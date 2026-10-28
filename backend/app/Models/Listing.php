<?php

namespace App\Models;

use App\Enums\ListingOperation;
use App\Enums\PropertyType;
use App\Models\Concerns\RecordsChanges;
use Database\Factories\ListingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Touches;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Publicación de una propiedad en Brunito: venta (USD), alquiler (ARS) o las dos.
 */
#[Fillable(['property_id', 'slug', 'headline', 'description', 'neighborhood', 'for_sale', 'sale_price', 'for_rent', 'rent_price', 'expenses', 'bathrooms', 'garage', 'age_years', 'amenities', 'published_at', 'reserved_at'])]
#[Touches('property')]
class Listing extends Model
{
    /** @use HasFactory<ListingFactory> */
    use HasFactory, RecordsChanges;

    protected function historyFields(): array
    {
        return [
            'headline' => ['Título', 'text'],
            'description' => ['Descripción', 'text'],
            'neighborhood' => ['Barrio', 'text'],
            'for_sale' => ['En venta', 'bool'],
            'sale_price' => ['Precio de venta', 'usd'],
            'for_rent' => ['En alquiler', 'bool'],
            'rent_price' => ['Precio de alquiler', 'money'],
            'expenses' => ['Expensas', 'money'],
            'bathrooms' => ['Baños', 'text'],
            'garage' => ['Cochera', 'bool'],
            'age_years' => ['Antigüedad (años)', 'text'],
            'published_at' => ['Visible en la web', 'flag'],
            'reserved_at' => ['Reservada', 'flag'],
        ];
    }

    protected function historySubject(): Model
    {
        return $this->property;
    }

    protected function historyPrefix(): string
    {
        return 'Publicación · ';
    }

    public const AMENITIES = [
        'luminoso' => 'Luminoso',
        'balcon' => 'Balcón',
        'patio' => 'Patio',
        'terraza' => 'Terraza',
        'parrilla' => 'Parrilla',
        'pileta' => 'Pileta',
        'ascensor' => 'Ascensor',
        'lavadero' => 'Lavadero',
        'aire' => 'Aire acondicionado',
        'calefaccion' => 'Calefacción',
        'amoblado' => 'Amoblado',
        'mascotas' => 'Acepta mascotas',
        'apto_credito' => 'Apto crédito',
        'apto_profesional' => 'Apto profesional',
        'a_estrenar' => 'A estrenar',
        'seguridad' => 'Seguridad 24 h',
    ];

    protected function casts(): array
    {
        return [
            'for_sale' => 'boolean',
            'for_rent' => 'boolean',
            'garage' => 'boolean',
            'sale_price' => 'decimal:2',
            'rent_price' => 'decimal:2',
            'expenses' => 'decimal:2',
            'amenities' => 'array',
            'published_at' => 'datetime',
            'reserved_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    /**
     * @param  Builder<Listing>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function isPublished(): bool
    {
        return $this->published_at !== null && $this->published_at->lte(now());
    }

    /**
     * @return list<ListingOperation>
     */
    public function operations(): array
    {
        return array_values(array_filter([
            $this->for_sale ? ListingOperation::Sale : null,
            $this->for_rent ? ListingOperation::Rent : null,
        ]));
    }

    public function offers(ListingOperation $operation): bool
    {
        return $operation === ListingOperation::Sale ? $this->for_sale : $this->for_rent;
    }

    /** "USD 128.000" o "$ 650.000 por mes". */
    public function priceLabel(ListingOperation $operation): string
    {
        if ($operation === ListingOperation::Sale) {
            return $this->sale_price ? 'USD '.number_format((float) $this->sale_price, 0, ',', '.') : 'consultar precio';
        }

        return $this->rent_price ? '$ '.number_format((float) $this->rent_price, 0, ',', '.').' por mes' : 'consultar precio';
    }

    /** "Azcuénaga al 1200": la altura sin el número exacto. */
    public function addressHint(): string
    {
        $property = $this->property;
        $number = (int) preg_replace('/\D+/', '', $property->number);

        return $number > 0 ? "{$property->street} al ".(intdiv($number, 100) * 100) : $property->street;
    }

    public function place(): string
    {
        return $this->neighborhood ?: $this->property->city;
    }

    public static function makeSlug(Property $property, ?string $neighborhood): string
    {
        $parts = [$property->type->label()];
        if ($property->rooms && $property->type !== PropertyType::Warehouse) {
            $parts[] = $property->rooms === 1 ? 'monoambiente' : "{$property->rooms} ambientes";
        }
        $parts[] = $neighborhood ?: $property->city;
        $parts[] = $property->code;

        return Str::slug(implode(' ', $parts));
    }
}
