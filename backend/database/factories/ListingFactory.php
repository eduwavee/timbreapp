<?php

namespace Database\Factories;

use App\Models\Listing;
use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Listing>
 */
class ListingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'slug' => Str::slug(fake()->unique()->words(4, true)),
            'headline' => 'Dos ambientes luminoso con balcón',
            'description' => fake()->paragraph(),
            'neighborhood' => 'Villa Crespo',
            'for_sale' => true,
            'sale_price' => 98000,
            'for_rent' => true,
            'rent_price' => 650000,
            'expenses' => 85000,
            'bathrooms' => 1,
            'garage' => false,
            'amenities' => ['luminoso', 'balcon'],
            'published_at' => now()->subDay(),
        ];
    }

    public function unpublished(): static
    {
        return $this->state(['published_at' => null]);
    }

    public function forRentOnly(): static
    {
        return $this->state(['for_sale' => false, 'sale_price' => null]);
    }
}
