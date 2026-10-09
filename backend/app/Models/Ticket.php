<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\Trade;
use Database\Factories\TicketFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['property_id', 'tenant_id', 'provider_id', 'title', 'description', 'category', 'priority', 'status', 'derived_at', 'resolved_at', 'cost'])]
class Ticket extends Model
{
    /** @use HasFactory<TicketFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'category' => Trade::class,
            'priority' => TicketPriority::class,
            'status' => TicketStatus::class,
            'derived_at' => 'datetime',
            'resolved_at' => 'datetime',
            'cost' => 'decimal:2',
        ];
    }

    #[Scope]
    protected function open(Builder $query): Builder
    {
        return $query->where('status', '!=', TicketStatus::Resolved);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class)->oldest();
    }

    public function photos(): HasMany
    {
        return $this->hasMany(TicketPhoto::class);
    }
}
