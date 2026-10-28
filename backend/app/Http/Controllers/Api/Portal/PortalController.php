<?php

namespace App\Http\Controllers\Api\Portal;

use App\Enums\PaymentMethod;
use App\Enums\ProofStatus;
use App\Http\Controllers\Api\PaymentProofController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Controller;
use App\Http\Requests\TicketRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\InstallmentResource;
use App\Http\Resources\TicketResource;
use App\Models\Installment;
use App\Models\PaymentProof;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Services\WhatsApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Endpoints del portal del inquilino: siempre acotados a su propio registro.
 */
class PortalController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);
        $contract = $tenant->activeContract()->with('property')->first();

        $installments = Installment::query()
            ->whereHas('contract', fn ($q) => $q->whereBelongsTo($tenant))
            ->with(['contract', 'payments'])
            ->orderByDesc('period')
            ->limit(24)
            ->get();

        $unpaid = $installments->filter(fn (Installment $i) => $i->balance() > 0);
        $overdue = $unpaid->filter(fn (Installment $i) => $i->daysLate() > 0);
        $upcoming = $unpaid->reject(fn (Installment $i) => $i->daysLate() > 0)->sortBy('due_date')->first();
        $ownerPhone = Setting::get('owner_phone');

        return response()->json([
            'tenant' => ['first_name' => $tenant->first_name, 'full_name' => $tenant->full_name],
            'contract' => $contract ? ContractResource::make($contract) : null,
            'debt' => [
                'overdue' => round($overdue->sum(fn (Installment $i) => $i->balance() + $i->lateFee()), 2),
                'overdue_count' => $overdue->count(),
                'next_amount' => $upcoming?->balance(),
                'next_due' => $upcoming?->due_date?->toDateString(),
            ],
            'installments' => InstallmentResource::collection($installments),
            'proofs' => PaymentProof::query()->whereBelongsTo($tenant)->with('installment.contract.property', 'payment')->latest()->limit(10)->get()
                ->map(fn (PaymentProof $p) => PaymentProofController::present($p)),
            'payment_info' => [
                'bank_alias' => Setting::get('bank_alias'),
                'owner_name' => Setting::get('owner_name'),
                'owner_whatsapp_url' => $ownerPhone ? WhatsApp::link($ownerPhone, "Hola, soy {$tenant->full_name}. Te escribo por el alquiler de ".($contract?->property->address ?? 'mi unidad').'.') : null,
            ],
        ]);
    }

    public function tickets(Request $request): AnonymousResourceCollection
    {
        $tenant = $this->tenant($request);

        return TicketResource::collection(
            Ticket::query()->whereBelongsTo($tenant)->with(['property', 'provider', 'comments.user', 'photos'])->latest()->get()
        );
    }

    public function storeTicket(TicketRequest $request): TicketResource
    {
        $tenant = $this->tenant($request);
        $contract = $tenant->activeContract;
        if (! $contract) {
            throw ValidationException::withMessages(['title' => 'No tenés un contrato vigente para cargar reclamos.']);
        }

        $data = $request->safe()->only(['title', 'description', 'category', 'priority']);
        $ticket = TicketController::createWithPhotos($data + [
            'property_id' => $contract->property_id,
            'tenant_id' => $tenant->id,
        ], $request);

        return TicketResource::make($ticket->load(['property', 'photos', 'comments']));
    }

    /**
     * El inquilino informa un pago subiendo la foto o el PDF del comprobante.
     */
    public function storeProof(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);
        $data = $request->validate([
            'installment_id' => ['required', 'integer'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'note' => ['nullable', 'string', 'max:500'],
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,heic,pdf'],
        ]);

        $installment = Installment::query()
            ->whereKey($data['installment_id'])
            ->whereHas('contract', fn ($q) => $q->whereBelongsTo($tenant))
            ->first();
        if (! $installment) {
            throw ValidationException::withMessages(['installment_id' => 'Elegí una de tus cuotas.']);
        }
        if ($installment->proofs()->where('status', ProofStatus::Pending)->exists()) {
            throw ValidationException::withMessages(['installment_id' => 'Ya mandaste un comprobante de esa cuota; está esperando confirmación.']);
        }

        $proof = PaymentProof::query()->create([
            'installment_id' => $installment->id,
            'tenant_id' => $tenant->id,
            'amount' => $data['amount'],
            'paid_on' => $data['paid_on'],
            'method' => $data['method'],
            'note' => $data['note'] ?? null,
            'path' => $request->file('file')->store("proofs/{$tenant->id}"),
            'status' => ProofStatus::Pending,
        ]);

        return response()->json(['data' => PaymentProofController::present($proof->load('installment.contract.property'))], 201);
    }

    private function tenant(Request $request): Tenant
    {
        $tenant = $request->user()->tenant;
        abort_unless($tenant, 403, 'Tu usuario no está vinculado a un inquilino.');

        return $tenant;
    }
}
