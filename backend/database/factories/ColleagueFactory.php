<?php

namespace Database\Factories;

use App\Models\Colleague;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Colleague>
 */
class ColleagueFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'agency' => 'Propiedades '.fake()->lastName(),
            'phone' => '11 6123-4411',
            'zone' => 'Palermo',
            'active' => true,
        ];
    }
}
