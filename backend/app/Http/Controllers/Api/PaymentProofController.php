<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProofStatus;
use App\Http\Controllers\Controller;
use App\Models\PaymentProof;
use App\Services\Billing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Comprobantes que suben los inquilinos: el dueño los confirma (se registra el pago) o los rechaza.
 */
class PaymentProofController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $proofs = PaymentProof::query()
            ->with(['tenant', 'installment.contract.property', 'payment'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByRaw("case status when 'pendiente' then 0 else 1 end")
            ->latest()
            ->limit(200)
            ->get();

        return response()->json(['data' => $proofs->map(fn (PaymentProof $p) => self::present($p))]);
    }

    public function approve(Request $request, PaymentProof $proof, Billing $billing): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'late_fee' => ['nullable', 'numeric', 'min:0'],
        ]);
        if ($proof->status !== ProofStatus::Pending) {
            throw ValidationException::withMessages(['proof' => 'Este comprobante ya fue revisado.']);
        }

        DB::transaction(function () use ($proof, $data, $billing) {
            $installment = $proof->installment;
            $amount = min((float) ($data['amount'] ?? $proof->amount), $installment->balance());
            // Lo que el inquilino pagó por encima del saldo es la mora.
            $lateFee = $data['late_fee'] ?? max(0, round((float) $proof->amount - $amount, 2));
            if ($amount <= 0) {
                throw ValidationException::withMessages(['amount' => 'La cuota ya no tiene saldo.']);
            }
            $payment = $billing->registerPayment($installment, [
                'amount' => $amount,
                'late_fee' => $lateFee,
                'paid_on' => $proof->paid_on->toDateString(),
                'method' => $proof->method->value,
                'reference' => 'Comprobante #'.$proof->id,
                'notes' => $proof->note,
            ]);
            $proof->update(['status' => ProofStatus::Approved, 'payment_id' => $payment->id, 'reviewed_at' => now()]);
        });

        return response()->json(['data' => self::present($proof->fresh(['tenant', 'installment.contract.property', 'payment']))]);
    }

    public function reject(Request $request, PaymentProof $proof): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        abort_if($proof->status !== ProofStatus::Pending, 422, 'Este comprobante ya fue revisado.');
        $proof->update(['status' => ProofStatus::Rejected, 'rejection_reason' => $data['reason'], 'reviewed_at' => now()]);

        return response()->json(['data' => self::present($proof->fresh(['tenant', 'installment.contract.property']))]);
    }

    /**
     * El archivo es privado: solo lo ve el dueño o el inquilino que lo subió.
     */
    public function file(Request $request, PaymentProof $proof): StreamedResponse
    {
        $user = $request->user();
        abort_if(! $user->isAdmin() && $proof->tenant_id !== $user->tenant_id, 403);

        return Storage::disk('local')->response($proof->path);
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(PaymentProof $p): array
    {
        $installment = $p->installment;

        return [
            'id' => $p->id,
            'amount' => (float) $p->amount,
            'paid_on' => $p->paid_on->toDateString(),
            'method' => ['value' => $p->method->value, 'label' => $p->method->label()],
            'status' => ['value' => $p->status->value, 'label' => $p->status->label()],
            'note' => $p->note,
            'rejection_reason' => $p->rejection_reason,
            'created_at' => $p->created_at->toIso8601String(),
            'reviewed_at' => $p->reviewed_at?->toIso8601String(),
            'file_url' => '/api/backend/proofs/'.$p->id.'/file',
            'is_pdf' => str_ends_with(strtolower($p->path), '.pdf'),
            'tenant' => $p->relationLoaded('tenant') ? ['id' => $p->tenant->id, 'name' => $p->tenant->full_name] : null,
            'installment' => [
                'id' => $installment->id,
                'period' => $installment->period->toDateString(),
                'balance' => $installment->balance(),
                'property_code' => $installment->contract?->property?->code,
            ],
            'payment_id' => $p->payment_id,
            'receipt_number' => $p->payment?->receipt_number,
        ];
    }
}
