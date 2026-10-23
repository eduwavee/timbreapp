<?php

namespace App\Http\Controllers\Api\Site;

use App\Enums\InquiryStatus;
use App\Enums\ListingOperation;
use App\Http\Controllers\Controller;
use App\Http\Resources\PublicListingResource;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * API pública de La Choza: lista lo publicado y recibe los "Me interesa", que caen en Timbre.
 */
class SiteController extends Controller
{
    public function meta(): JsonResponse
    {
        $listings = Listing::query()->published()->with('property')->get();
        $places = $listings->groupBy(fn (Listing $l) => $l->place())
            ->map(fn ($group, $name) => [
                'name' => $name,
                'city' => $group->first()->property->city,
                'venta' => $group->where('for_sale', true)->count(),
                'alquiler' => $group->where('for_rent', true)->count(),
            ])
            ->sortByDesc(fn ($p) => $p['venta'] + $p['alquiler'])->values();

        return response()->json([
            'site_name' => Setting::get('site_name'),
            'owner_name' => Setting::get('owner_name'),
            'owner_phone' => Setting::get('owner_phone') ?: null,
            'counts' => [
                'venta' => $listings->where('for_sale', true)->count(),
                'alquiler' => $listings->where('for_rent', true)->count(),
            ],
            'places' => $places,
            'types' => $listings->groupBy(fn (Listing $l) => $l->property->type->value)
                ->map(fn ($group, $type) => ['value' => $type, 'label' => $group->first()->property->type->label(), 'count' => $group->count()])
                ->values(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'op' => ['nullable', Rule::enum(ListingOperation::class)],
            'type' => ['nullable', 'string', 'max:20'],
            'place' => ['nullable', 'string', 'max:80'],
            'rooms' => ['nullable', 'integer', 'min:1', 'max:10'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'sort' => ['nullable', Rule::in(['recientes', 'precio_asc', 'precio_desc'])],
            'limit' => ['nullable', 'integer', 'min:1', 'max:60'],
            'exclude' => ['nullable', 'string', 'max:160'],
        ]);
        $operation = isset($filters['op']) ? ListingOperation::from($filters['op']) : null;
        $priceColumn = $operation === ListingOperation::Rent ? 'rent_price' : 'sale_price';

        $query = Listing::query()->published()
            ->select('listings.*')
            ->join('properties', 'properties.id', '=', 'listings.property_id')
            ->with('property.photos')
            ->when($operation, fn (Builder $q) => $q->where($operation === ListingOperation::Sale ? 'for_sale' : 'for_rent', true))
            ->when($filters['type'] ?? null, fn (Builder $q, $type) => $q->where('properties.type', $type))
            ->when($filters['place'] ?? null, fn (Builder $q, $place) => $q->where(fn ($w) => $w->where('listings.neighborhood', $place)
                ->orWhere(fn ($c) => $c->whereNull('listings.neighborhood')->where('properties.city', $place))))
            ->when($filters['rooms'] ?? null, fn (Builder $q, $rooms) => $rooms >= 4 ? $q->where('properties.rooms', '>=', 4) : $q->where('properties.rooms', $rooms))
            ->when($operation && isset($filters['max_price']), fn (Builder $q) => $q->where($priceColumn, '<=', $filters['max_price']))
            ->when($filters['exclude'] ?? null, fn (Builder $q, $slug) => $q->where('listings.slug', '!=', $slug));

        $total = (clone $query)->count();
        match ($filters['sort'] ?? 'recientes') {
            'precio_asc' => $query->orderByRaw("{$priceColumn} asc nulls last"),
            'precio_desc' => $query->orderByRaw("{$priceColumn} desc nulls last"),
            default => $query->orderByRaw('reserved_at is not null')->orderByDesc('published_at'),
        };
        $listings = $query->orderBy('listings.id')->limit($filters['limit'] ?? 48)->get();

        return response()->json([
            'data' => PublicListingResource::collection($listings),
            'total' => $total,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $listing = Listing::query()->published()->where('slug', $slug)->with('property.photos')->firstOrFail();

        return response()->json(['data' => PublicListingResource::make($listing)->detailed()]);
    }

    public function inquire(Request $request, string $slug): JsonResponse
    {
        $listing = Listing::query()->published()->where('slug', $slug)->firstOrFail();
        $data = $request->validate([
            'operation' => ['required', Rule::enum(ListingOperation::class)],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\-\s]{8,}$/'],
            'email' => ['nullable', 'email', 'max:160'],
            'message' => ['nullable', 'string', 'max:1500'],
            'website' => ['nullable', 'string', 'max:0'],
        ], [
            'phone.regex' => 'Revisá el número: con código de área, por ejemplo 11 6123-4410.',
            'website.max' => 'No se pudo enviar la consulta.',
        ], ['name' => 'nombre', 'phone' => 'WhatsApp', 'message' => 'mensaje']);

        $operation = ListingOperation::from($data['operation']);
        abort_unless($listing->offers($operation), 422, 'Esta propiedad no está en '.mb_strtolower($operation->label()).'.');

        // Si la misma persona vuelve a tocar "Me interesa" en un rato, no se duplica la consulta.
        $existing = Inquiry::query()
            ->whereBelongsTo($listing)
            ->where('phone', $data['phone'])
            ->where('created_at', '>=', now()->subHours(12))
            ->first();
        if ($existing) {
            $existing->update(['message' => $data['message'] ?? $existing->message, 'email' => $data['email'] ?? $existing->email]);

            return response()->json(['ok' => true, 'code' => $listing->property->code], 201);
        }

        Inquiry::query()->create([
            'listing_id' => $listing->id,
            'property_id' => $listing->property_id,
            'operation' => $operation,
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'message' => $data['message'] ?? null,
            'status' => InquiryStatus::New,
        ]);

        return response()->json(['ok' => true, 'code' => $listing->property->code], 201);
    }
}
