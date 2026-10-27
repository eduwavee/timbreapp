<?php

namespace App\Http\Resources;

use App\Http\Controllers\Api\ContractDocumentController;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Contract */
class ContractResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'tenant_id' => $this->tenant_id,
            'property' => PropertyResource::make($this->whenLoaded('property')),
            'tenant' => TenantResource::make($this->whenLoaded('tenant')),
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'days_to_end' => (int) today()->diffInDays($this->end_date, false),
            'rent_amount' => (float) $this->rent_amount,
            'due_day' => $this->due_day,
            'adjustment_type' => EnumValue::of($this->adjustment_type),
            'adjustment_every_months' => $this->adjustment_every_months,
            'deposit' => (float) $this->deposit,
            'late_fee_daily_pct' => (float) $this->late_fee_daily_pct,
            'status' => EnumValue::of($this->status),
            'notes' => $this->notes,
            'installments' => InstallmentResource::collection($this->whenLoaded('installments')),
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($d) => ContractDocumentController::present($d))),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
