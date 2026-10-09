<?php

namespace App\Models;

use App\Enums\ContractStatus;
use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['first_name', 'last_name', 'document', 'phone', 'email', 'guarantor_name', 'guarantor_phone', 'notes'])]
class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function activeContract(): HasOne
    {
        return $this->hasOne(Contract::class)->where('status', ContractStatus::Active)->latestOfMany('start_date');
    }

    public function installments(): HasManyThrough
    {
        return $this->hasManyThrough(Installment::class, Contract::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn (): string => trim("{$this->first_name} {$this->last_name}"));
    }
}
