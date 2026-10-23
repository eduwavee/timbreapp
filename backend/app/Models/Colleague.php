<?php

namespace App\Models;

use Database\Factories\ColleagueFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Vendedor o colega inmobiliario al que se le derivan consultas de La Choza.
 */
#[Fillable(['name', 'agency', 'phone', 'zone', 'notes', 'active'])]
class Colleague extends Model
{
    /** @use HasFactory<ColleagueFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }
}
