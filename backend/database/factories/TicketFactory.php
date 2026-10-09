<?php

namespace Database\Factories;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\Trade;
use App\Models\Property;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'title' => 'Pierde la llave de paso',
            'description' => 'Gotea desde ayer.',
            'category' => Trade::Plumbing,
            'priority' => TicketPriority::High,
            'status' => TicketStatus::Open,
        ];
    }
}
