<?php

namespace App\Models;

use App\Enums\InquiryOutcome;
use App\Enums\InquiryStatus;
use App\Enums\ListingOperation;
use Database\Factories\InquiryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Alguien tocó "Me interesa" en La Choza.
 */
#[Fillable(['listing_id', 'property_id', 'operation', 'name', 'phone', 'email', 'message', 'status', 'colleague_id', 'outcome', 'notes', 'contacted_at', 'derived_at', 'closed_at'])]
class Inquiry extends Model
{
    /** @use HasFactory<InquiryFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'operation' => ListingOperation::class,
            'status' => InquiryStatus::class,
            'outcome' => InquiryOutcome::class,
            'contacted_at' => 'datetime',
            'derived_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function colleague(): BelongsTo
    {
        return $this->belongsTo(Colleague::class);
    }

    /**
     * @param  Builder<Inquiry>  $query
     */
    public function scopeOpen(Builder $query): void
    {
        $query->where('status', '!=', InquiryStatus::Closed);
    }
}
