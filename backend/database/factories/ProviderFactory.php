<?php

namespace Database\Factories;

use App\Enums\Trade;
use App\Models\Provider;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Provider>
 */
class ProviderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'trade' => Trade::Plumbing,
            'phone' => '11 6123-4410',
            'active' => true,
        ];
    }
}
