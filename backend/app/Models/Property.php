<?php

namespace App\Models;

use App\Enums\ContractStatus;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use Database\Factories\PropertyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['code', 'type', 'street', 'number', 'unit', 'city', 'surface_m2', 'rooms', 'status', 'notes'])]
class Property extends Model
{
    /** @use HasFactory<PropertyFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'type' => PropertyType::class,
            'status' => PropertyStatus::class,
            'surface_m2' => 'decimal:2',
        ];
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function activeContract(): HasOne
    {
        return $this->hasOne(Contract::class)->where('status', ContractStatus::Active)->latestOfMany('start_date');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(PropertyPhoto::class)->orderBy('position')->orderBy('id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * "Azcuénaga 1250, depto 8".
     */
    protected function address(): Attribute
    {
        return Attribute::get(function (): string {
            $address = "{$this->street} {$this->number}";
            if ($this->unit) {
                $label = $this->type === PropertyType::Apartment ? 'depto' : 'unidad';
                $address .= ", {$label} {$this->unit}";
            }

            return $address;
        });
    }
}
