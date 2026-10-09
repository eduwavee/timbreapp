<?php

namespace App\Models;

use App\Enums\ContactKind;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['kind', 'tenant_id', 'provider_id', 'installment_id', 'ticket_id', 'phone', 'message'])]
class ContactLog extends Model
{
    protected function casts(): array
    {
        return ['kind' => ContactKind::class];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }
}
