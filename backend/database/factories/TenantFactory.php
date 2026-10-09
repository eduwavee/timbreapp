<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'document' => (string) fake()->unique()->numberBetween(20000000, 45000000),
            'phone' => '11 '.fake()->numberBetween(2000, 6999).'-'.fake()->numberBetween(1000, 9999),
            'email' => fake()->unique()->safeEmail(),
        ];
    }
}
