<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\Billing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $payments = Payment::query()
            ->with(['installment.contract.property', 'installment.contract.tenant'])
            ->when($request->query('month'), fn ($q, $m) => $q->whereBetween('paid_on', [$m.'-01', date('Y-m-t', strtotime($m.'-01'))]))
            ->latest('paid_on')
            ->latest('id')
            ->limit(300)
            ->get();

        return PaymentResource::collection($payments);
    }

    public function store(PaymentRequest $request, Installment $installment, Billing $billing): PaymentResource
    {
        $payment = $billing->registerPayment($installment, $request->validated());

        return PaymentResource::make($payment->load(['installment.contract.property', 'installment.contract.tenant']));
    }

    /**
     * Datos del recibo imprimible.
     */
    public function show(Request $request, Payment $payment): JsonResponse
    {
        $payment->load(['installment.contract.property', 'installment.contract.tenant']);
        $user = $request->user();
        abort_if(! $user->isAdmin() && $payment->installment->contract->tenant_id !== $user->tenant_id, 403);

        return response()->json([
            'data' => PaymentResource::make($payment),
            'issuer' => [
                'name' => Setting::get('owner_name'),
                'phone' => Setting::get('owner_phone'),
            ],
        ]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $installment = $payment->installment;
        $installment->paid_amount = max(0, round((float) $installment->paid_amount - (float) $payment->amount, 2));
        $payment->delete();
        $installment->status = $installment->resolveStatus();
        $installment->paid_at = null;
        $installment->save();

        return response()->json(['ok' => true]);
    }
}
