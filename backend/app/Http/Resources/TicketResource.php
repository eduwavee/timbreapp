<?php

namespace App\Http\Resources;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Ticket */
class TicketResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => EnumValue::of($this->category),
            'priority' => EnumValue::of($this->priority),
            'status' => EnumValue::of($this->status),
            'cost' => $this->cost !== null ? (float) $this->cost : null,
            'created_at' => $this->created_at->toIso8601String(),
            'derived_at' => $this->derived_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'property' => PropertyResource::make($this->whenLoaded('property')),
            'tenant' => TenantResource::make($this->whenLoaded('tenant')),
            'provider' => ProviderResource::make($this->whenLoaded('provider')),
            'comments' => $this->whenLoaded('comments', fn () => $this->comments->map(fn ($c) => [
                'id' => $c->id,
                'body' => $c->body,
                'author' => $c->user?->name ?? 'Sistema',
                'is_admin' => (bool) $c->user?->isAdmin(),
                'created_at' => $c->created_at->toIso8601String(),
            ])),
            'photos' => $this->whenLoaded('photos', fn () => $this->photos->map(fn ($p) => ['id' => $p->id, 'url' => $p->url])),
        ];
    }
}
