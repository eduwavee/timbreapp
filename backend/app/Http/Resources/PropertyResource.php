<?php

namespace App\Http\Resources;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Property */
class PropertyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => EnumValue::of($this->type),
            'status' => EnumValue::of($this->status),
            'street' => $this->street,
            'number' => $this->number,
            'unit' => $this->unit,
            'city' => $this->city,
            'address' => $this->address,
            'surface_m2' => $this->surface_m2,
            'rooms' => $this->rooms,
            'notes' => $this->notes,
            'active_contract' => ContractResource::make($this->whenLoaded('activeContract')),
            'open_tickets_count' => $this->whenCounted('tickets'),
            'cover_url' => $this->whenLoaded('photos', fn () => $this->photos->first()?->url),
            'balance' => $this->when(isset($this->balance), fn () => round((float) $this->balance, 2)),
        ];
    }
}
