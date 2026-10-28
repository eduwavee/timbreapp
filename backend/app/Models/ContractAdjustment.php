<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un ajuste de alquiler ya aplicado: desde qué mes, de cuánto a cuánto y con qué índice. */
#[Fillable(['contract_id', 'from_period', 'previous_amount', 'new_amount', 'percentage', 'basis'])]
class ContractAdjustment extends Model
{
    protected function casts(): array
    {
        return [
            'from_period' => 'date',
            'previous_amount' => 'decimal:2',
            'new_amount' => 'decimal:2',
            'percentage' => 'decimal:3',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
