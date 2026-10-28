<?php

namespace App\Models;

use App\Enums\AdjustmentType;
use App\Enums\ContractStatus;
use App\Models\Concerns\RecordsChanges;
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
    use HasFactory, RecordsChanges;

    protected function historyFields(): array
    {
        return [
            'start_date' => ['Inicio', 'date'],
            'end_date' => ['Fin', 'date'],
            'rent_amount' => ['Alquiler', 'money'],
            'due_day' => ['Día de vencimiento', 'text'],
            'adjustment_type' => ['Ajuste', 'text'],
            'adjustment_every_months' => ['Ajusta cada (meses)', 'text'],
            'deposit' => ['Depósito', 'money'],
            'late_fee_daily_pct' => ['Mora diaria', 'pct'],
            'status' => ['Estado', 'text'],
            'notes' => ['Notas', 'text'],
        ];
    }

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

    public function adjustments(): HasMany
    {
        return $this->hasMany(ContractAdjustment::class)->latest('from_period');
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class)->orderBy('period');
    }
}
