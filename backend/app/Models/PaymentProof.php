<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\ProofStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Comprobante de pago que sube el inquilino; el dueño lo confirma o lo rechaza.
 */
#[Fillable(['installment_id', 'tenant_id', 'payment_id', 'amount', 'paid_on', 'method', 'path', 'status', 'note', 'rejection_reason', 'reviewed_at'])]
class PaymentProof extends Model
{
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_on' => 'date',
            'method' => PaymentMethod::class,
            'status' => ProofStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function installment(): BelongsTo
    {
        return $this->belongsTo(Installment::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
