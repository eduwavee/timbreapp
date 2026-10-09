<?php

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'amount' => (float) $this->amount,
            'late_fee' => (float) $this->late_fee,
            'total' => round((float) $this->amount + (float) $this->late_fee, 2),
            'paid_on' => $this->paid_on->toDateString(),
            'method' => EnumValue::of($this->method),
            'reference' => $this->reference,
            'notes' => $this->notes,
            'installment' => InstallmentResource::make($this->whenLoaded('installment')),
        ];
    }
}
