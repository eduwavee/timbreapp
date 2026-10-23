<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListingRequest;
use App\Http\Resources\ListingResource;
use App\Models\Listing;
use App\Models\Property;
use Illuminate\Http\JsonResponse;

/**
 * La publicación de una propiedad en La Choza, editada desde su ficha en Timbre.
 */
class ListingController extends Controller
{
    public function show(Property $property): JsonResponse
    {
        $listing = $property->listing()->withCount(['inquiries' => fn ($q) => $q->open()])->first();

        return response()->json([
            'data' => $listing ? ListingResource::make($listing) : null,
            'amenities' => collect(Listing::AMENITIES)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
        ]);
    }

    public function update(ListingRequest $request, Property $property): JsonResponse
    {
        $data = $request->safe()->except(['published', 'reserved']);
        $listing = $property->listing ?? new Listing(['property_id' => $property->id]);

        $listing->fill([
            ...$data,
            'sale_price' => $data['for_sale'] ? ($data['sale_price'] ?? null) : null,
            'rent_price' => $data['for_rent'] ? ($data['rent_price'] ?? null) : null,
            'amenities' => array_values(array_unique($data['amenities'] ?? [])),
            'published_at' => $request->boolean('published') ? ($listing->published_at ?? now()) : null,
            'reserved_at' => $request->boolean('reserved') ? ($listing->reserved_at ?? now()) : null,
        ]);
        $listing->slug = Listing::makeSlug($property, $listing->neighborhood);
        $listing->save();

        return ListingResource::make($listing->loadCount(['inquiries' => fn ($q) => $q->open()]))->response()->setStatusCode(200);
    }
}
