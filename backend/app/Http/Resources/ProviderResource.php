<?php

namespace App\Http\Resources;

use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Provider */
class ProviderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'trade' => EnumValue::of($this->trade),
            'phone' => $this->phone,
            'notes' => $this->notes,
            'active' => $this->active,
            'open_tickets_count' => $this->whenCounted('tickets'),
        ];
    }
}
