<?php

namespace App\Http\Requests;

use App\Enums\AdjustmentType;
use App\Enums\ContractStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'property_id' => ['required', 'exists:properties,id'],
            'tenant_id' => ['required', 'exists:tenants,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'rent_amount' => ['required', 'numeric', 'min:1'],
            'due_day' => ['required', 'integer', 'between:1,28'],
            'adjustment_type' => ['required', Rule::enum(AdjustmentType::class)],
            'adjustment_every_months' => ['required', 'integer', 'between:1,24'],
            'deposit' => ['nullable', 'numeric', 'min:0'],
            'late_fee_daily_pct' => ['required', 'numeric', 'between:0,5'],
            'status' => ['sometimes', Rule::enum(ContractStatus::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
