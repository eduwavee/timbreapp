<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContractStatus;
use App\Enums\ProofStatus;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Http\Controllers\Controller;
use App\Http\Resources\ContractResource;
use App\Http\Resources\TicketResource;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\PaymentProof;
use App\Models\Property;
use App\Models\Provider;
use App\Models\Ticket;
use App\Services\WhatsApp;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(WhatsApp $whatsApp): JsonResponse
    {
        $providers = Provider::query()->where('active', true)->orderBy('name')->get();

        $from = today()->startOfMonth()->subMonths(5);

        $byMonth = Installment::query()
            ->whereDate('period', '>=', $from)
            ->whereDate('period', '<=', today()->startOfMonth())
            ->selectRaw("to_char(period, 'YYYY-MM') as month, sum(amount) as expected, sum(paid_amount) as collected")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $series = collect(range(0, 5))->map(function (int $i) use ($from, $byMonth) {
            $month = $from->copy()->addMonths($i);
            $row = $byMonth->get($month->format('Y-m'));

            return [
                'month' => $month->format('Y-m'),
                'label' => ucfirst($month->locale('es')->translatedFormat('M')),
                'expected' => round((float) ($row->expected ?? 0), 2),
                'collected' => round((float) ($row->collected ?? 0), 2),
            ];
        });

        $occupancy = collect(PropertyType::cases())->map(fn (PropertyType $type) => [
            'type' => $type->label(),
            'total' => Property::query()->where('type', $type)->count(),
            'occupied' => Property::query()->where('type', $type)->where('status', PropertyStatus::Occupied)->count(),
        ]);

        return response()->json([
            'occupancy' => [
                'total' => Property::query()->count(),
                'occupied' => Property::query()->where('status', PropertyStatus::Occupied)->count(),
                'maintenance' => Property::query()->where('status', PropertyStatus::Maintenance)->count(),
                'by_type' => $occupancy,
            ],
            'cash_this_month' => round((float) Payment::query()->whereBetween('paid_on', [today()->startOfMonth(), today()])->sum('amount'), 2),
            'series' => $series,
            'open_tickets' => Ticket::query()->open()->with(['property', 'tenant', 'provider'])
                ->orderByRaw("case status when 'abierto' then 0 else 1 end")
                ->orderByRaw("case priority when 'urgente' then 0 when 'alta' then 1 when 'media' then 2 else 3 end")
                ->latest()->limit(6)->get()
                ->map(function (Ticket $ticket) use ($providers, $whatsApp) {
                    $suggested = $ticket->provider_id ? null : $providers->first(fn (Provider $p) => $p->trade === $ticket->category);

                    return TicketResource::make($ticket)->resolve() + [
                        'suggested_provider' => $suggested ? [
                            'id' => $suggested->id,
                            'name' => $suggested->name,
                            'whatsapp_url' => $whatsApp->derivation($ticket, $suggested)['url'],
                        ] : null,
                    ];
                }),
            'open_tickets_count' => Ticket::query()->open()->count(),
            'pending_proofs' => PaymentProof::query()->where('status', ProofStatus::Pending)
                ->with(['tenant', 'installment.contract.property'])->oldest()->get()
                ->map(fn ($p) => PaymentProofController::present($p)),
            'expiring_documents' => ContractDocument::query()->with('contract.property', 'contract.tenant')
                ->whereNotNull('expires_on')->whereDate('expires_on', '<=', today()->addDays(45))
                ->whereHas('contract', fn ($q) => $q->where('status', ContractStatus::Active))
                ->orderBy('expires_on')->get()
                ->map(fn ($d) => ContractDocumentController::present($d) + ['contract_id' => $d->contract_id, 'property_code' => $d->contract->property->code, 'tenant' => $d->contract->tenant->full_name]),
            'expiring_contracts' => ContractResource::collection(
                Contract::query()->where('status', ContractStatus::Active)
                    ->whereDate('end_date', '<=', today()->addDays(90))
                    ->with(['property', 'tenant'])->orderBy('end_date')->get()
            ),
        ]);
    }
}
