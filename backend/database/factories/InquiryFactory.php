<?php

namespace Database\Factories;

use App\Enums\InquiryStatus;
use App\Enums\ListingOperation;
use App\Models\Inquiry;
use App\Models\Listing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Inquiry>
 */
class InquiryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'listing_id' => Listing::factory(),
            'property_id' => fn (array $attributes) => Listing::query()->find($attributes['listing_id'])->property_id,
            'operation' => ListingOperation::Rent,
            'name' => fake()->firstName(),
            'phone' => '11 6123-4412',
            'message' => '¿Se puede ver el sábado?',
            'status' => InquiryStatus::New,
        ];
    }
}
