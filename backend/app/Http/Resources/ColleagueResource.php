<?php

namespace App\Http\Resources;

use App\Models\Colleague;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Colleague */
class ColleagueResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'agency' => $this->agency,
            'phone' => $this->phone,
            'zone' => $this->zone,
            'notes' => $this->notes,
            'active' => $this->active,
            'open_inquiries_count' => $this->whenCounted('inquiries'),
        ];
    }
}
