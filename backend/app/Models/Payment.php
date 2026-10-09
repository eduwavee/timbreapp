<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['installment_id', 'receipt_number', 'amount', 'late_fee', 'paid_on', 'method', 'reference', 'notes'])]
class Payment extends Model
{
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'late_fee' => 'decimal:2',
            'paid_on' => 'date',
            'method' => PaymentMethod::class,
        ];
    }

    public function installment(): BelongsTo
    {
        return $this->belongsTo(Installment::class);
    }
}
