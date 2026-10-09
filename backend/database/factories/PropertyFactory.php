<?php

namespace Database\Factories;

use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('???-##')),
            'type' => PropertyType::Apartment,
            'status' => PropertyStatus::Available,
            'street' => fake()->streetName(),
            'number' => (string) fake()->numberBetween(100, 5000),
            'unit' => (string) fake()->numberBetween(1, 12),
            'city' => 'CABA',
            'surface_m2' => fake()->numberBetween(30, 90),
            'rooms' => fake()->numberBetween(1, 4),
        ];
    }
}
