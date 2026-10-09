<?php

namespace App\Http\Resources;

use App\Models\Installment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Installment */
class InstallmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $contractLoaded = $this->relationLoaded('contract');

        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'period' => $this->period->toDateString(),
            'due_date' => $this->due_date->toDateString(),
            'amount' => (float) $this->amount,
            'paid_amount' => (float) $this->paid_amount,
            'balance' => $this->balance(),
            'days_late' => $this->daysLate(),
            'late_fee' => $contractLoaded ? $this->lateFee() : null,
            'status' => EnumValue::of($this->status),
            'paid_at' => $this->paid_at?->toDateString(),
            'contract' => ContractResource::make($this->whenLoaded('contract')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'last_reminder_at' => $this->when(isset($this->last_reminder_at), fn () => $this->last_reminder_at),
        ];
    }
}
