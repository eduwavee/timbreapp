<?php

namespace App\Http\Resources;

use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * La publicación tal como la ve el dueño en Timbre.
 *
 * @mixin Listing
 */
class ListingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'slug' => $this->slug,
            'headline' => $this->headline,
            'description' => $this->description,
            'neighborhood' => $this->neighborhood,
            'for_sale' => $this->for_sale,
            'sale_price' => $this->sale_price !== null ? (float) $this->sale_price : null,
            'for_rent' => $this->for_rent,
            'rent_price' => $this->rent_price !== null ? (float) $this->rent_price : null,
            'expenses' => $this->expenses !== null ? (float) $this->expenses : null,
            'bathrooms' => $this->bathrooms,
            'garage' => $this->garage,
            'age_years' => $this->age_years,
            'amenities' => $this->amenities ?? [],
            'published' => $this->isPublished(),
            'published_at' => $this->published_at?->toIso8601String(),
            'reserved' => $this->reserved_at !== null,
            'public_url' => rtrim((string) config('services.site.url'), '/').'/propiedades/'.$this->slug,
            'open_inquiries_count' => $this->whenCounted('inquiries'),
        ];
    }
}
