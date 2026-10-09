<?php

namespace App\Models;

use App\Enums\InstallmentStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['contract_id', 'period', 'due_date', 'amount', 'paid_amount', 'status', 'paid_at'])]
class Installment extends Model
{
    protected function casts(): array
    {
        return [
            'period' => 'date',
            'due_date' => 'date',
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'status' => InstallmentStatus::class,
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function proofs(): HasMany
    {
        return $this->hasMany(PaymentProof::class)->latest();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('paid_on');
    }

    /**
     * Cuotas con saldo pendiente.
     */
    #[Scope]
    protected function unpaid(Builder $query): Builder
    {
        return $query->where($this->qualifyColumn('status'), '!=', InstallmentStatus::Paid);
    }

    #[Scope]
    protected function overdue(Builder $query): Builder
    {
        return $query->where($this->qualifyColumn('status'), '!=', InstallmentStatus::Paid)->whereDate($this->qualifyColumn('due_date'), '<', today());
    }

    public function balance(): float
    {
        return round((float) $this->amount - (float) $this->paid_amount, 2);
    }

    public function daysLate(?CarbonInterface $on = null): int
    {
        $on ??= today();
        if ($this->status === InstallmentStatus::Paid || $on->lte($this->due_date)) {
            return 0;
        }

        return (int) $this->due_date->diffInDays($on);
    }

    /**
     * Interés punitorio: % diario del contrato sobre el saldo vencido.
     */
    public function lateFee(?CarbonInterface $on = null): float
    {
        $pct = (float) ($this->contract?->late_fee_daily_pct ?? 0);

        return round($this->balance() * $pct / 100 * $this->daysLate($on), 2);
    }

    /**
     * Recalcula el estado según lo pagado y la fecha de vencimiento.
     */
    public function resolveStatus(?CarbonInterface $on = null): InstallmentStatus
    {
        $on ??= Carbon::today();

        return match (true) {
            $this->balance() <= 0 => InstallmentStatus::Paid,
            $on->gt($this->due_date) => InstallmentStatus::Overdue,
            (float) $this->paid_amount > 0 => InstallmentStatus::Partial,
            default => InstallmentStatus::Pending,
        };
    }
}
