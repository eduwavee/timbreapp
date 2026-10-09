<?php

namespace App\Models;

use App\Enums\Trade;
use Database\Factories\ProviderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'trade', 'phone', 'notes', 'active'])]
class Provider extends Model
{
    /** @use HasFactory<ProviderFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'trade' => Trade::class,
            'active' => 'boolean',
        ];
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
