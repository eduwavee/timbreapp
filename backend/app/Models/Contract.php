<?php

namespace App\Models;

use App\Enums\AdjustmentType;
use App\Enums\ContractStatus;
use Database\Factories\ContractFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['property_id', 'tenant_id', 'start_date', 'end_date', 'rent_amount', 'due_day', 'adjustment_type', 'adjustment_every_months', 'deposit', 'late_fee_daily_pct', 'status', 'notes'])]
class Contract extends Model
{
    /** @use HasFactory<ContractFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'rent_amount' => 'decimal:2',
            'deposit' => 'decimal:2',
            'late_fee_daily_pct' => 'decimal:3',
            'adjustment_type' => AdjustmentType::class,
            'status' => ContractStatus::class,
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ContractDocument::class)->latest();
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class)->orderBy('period');
    }
}
