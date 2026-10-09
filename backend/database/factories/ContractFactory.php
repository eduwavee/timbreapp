<?php

namespace Database\Factories;

use App\Enums\AdjustmentType;
use App\Enums\ContractStatus;
use App\Models\Contract;
use App\Models\Property;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contract>
 */
class ContractFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = today()->subMonths(3)->startOfMonth();

        return [
            'property_id' => Property::factory(),
            'tenant_id' => Tenant::factory(),
            'start_date' => $start,
            'end_date' => $start->copy()->addYears(2)->subDay(),
            'rent_amount' => 700000,
            'due_day' => 10,
            'adjustment_type' => AdjustmentType::Icl,
            'adjustment_every_months' => 6,
            'deposit' => 700000,
            'late_fee_daily_pct' => 0.1,
            'status' => ContractStatus::Active,
        ];
    }
}
