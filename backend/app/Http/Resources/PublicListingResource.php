<?php

namespace App\Http\Resources;

use App\Enums\ListingOperation;
use App\Enums\PropertyType;
use App\Models\Listing;
use App\Models\PropertyPhoto;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lo que ve cualquiera en La Choza: sin inquilinos, sin número exacto ni datos internos.
 *
 * @mixin Listing
 */
class PublicListingResource extends JsonResource
{
    public bool $detailed = false;

    public function detailed(): static
    {
        $this->detailed = true;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $property = $this->property;
        $photos = $property->photos;

        return [
            'slug' => $this->slug,
            'code' => $property->code,
            'headline' => $this->headline,
            'type' => EnumValue::of($property->type),
            'operations' => collect($this->operations())->map(fn (ListingOperation $op) => [
                'value' => $op->value,
                'label' => $op->label(),
                'verb' => $op->verb(),
                'currency' => $op === ListingOperation::Sale ? 'USD' : 'ARS',
                'price' => ($op === ListingOperation::Sale ? $this->sale_price : $this->rent_price) !== null
                    ? (float) ($op === ListingOperation::Sale ? $this->sale_price : $this->rent_price) : null,
            ])->values(),
            'expenses' => $this->expenses !== null ? (float) $this->expenses : null,
            'rooms' => $property->type === PropertyType::Warehouse ? null : $property->rooms,
            'surface_m2' => $property->surface_m2 !== null ? (float) $property->surface_m2 : null,
            'bathrooms' => $this->bathrooms,
            'garage' => $this->garage,
            'age_years' => $this->age_years,
            'neighborhood' => $this->neighborhood,
            'city' => $property->city,
            'place' => $this->place(),
            'address_hint' => $this->addressHint(),
            'reserved' => $this->reserved_at !== null,
            'published_at' => $this->published_at?->toIso8601String(),
            'cover' => $photos->first() ? ['url' => $photos->first()->url, 'caption' => $photos->first()->caption] : null,
            'photo_count' => $photos->count(),
            'amenities' => $this->when($this->detailed, fn () => collect($this->amenities ?? [])
                ->filter(fn ($key) => isset(Listing::AMENITIES[$key]))
                ->map(fn ($key) => ['value' => $key, 'label' => Listing::AMENITIES[$key]])->values()),
            'description' => $this->when($this->detailed, $this->description),
            'photos' => $this->when($this->detailed, fn () => $photos->map(fn (PropertyPhoto $p) => ['url' => $p->url, 'caption' => $p->caption])->values()),
        ];
    }
}
