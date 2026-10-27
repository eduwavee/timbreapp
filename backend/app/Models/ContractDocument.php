<?php

namespace App\Models;

use App\Enums\DocumentKind;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Touches;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['contract_id', 'kind', 'name', 'path', 'mime', 'size', 'expires_on'])]
#[Touches('contract')]
class ContractDocument extends Model
{
    protected function casts(): array
    {
        return [
            'kind' => DocumentKind::class,
            'expires_on' => 'date',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
