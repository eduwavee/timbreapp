<?php

namespace App\Http\Resources;

use App\Models\Inquiry;
use App\Services\WhatsApp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Inquiry */
class InquiryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'operation' => EnumValue::of($this->operation),
            'status' => EnumValue::of($this->status),
            'outcome' => EnumValue::of($this->outcome),
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'message' => $this->message,
            'notes' => $this->notes,
            'created_at' => $this->created_at->toIso8601String(),
            'contacted_at' => $this->contacted_at?->toIso8601String(),
            'derived_at' => $this->derived_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'colleague' => ColleagueResource::make($this->whenLoaded('colleague')),
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'code' => $this->property->code,
                'address' => $this->property->address,
                'city' => $this->property->city,
                'type' => EnumValue::of($this->property->type),
                'status' => EnumValue::of($this->property->status),
                'cover_url' => $this->property->relationLoaded('photos') ? $this->property->photos->first()?->url : null,
            ]),
            'listing' => $this->whenLoaded('listing', fn () => $this->listingSummary()),
            'reply_url' => $this->whenLoaded('listing', fn () => app(WhatsApp::class)->inquiryReply($this->resource)['url']),        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function listingSummary(): array
    {
        $listing = $this->listing;

        return [
            'id' => $listing->id,
            'slug' => $listing->slug,
            'headline' => $listing->headline,
            'place' => $listing->place(),
            'price_label' => $listing->priceLabel($this->operation),
            'reserved' => $listing->reserved_at !== null,
            'public_url' => rtrim((string) config('services.site.url'), '/').'/propiedades/'.$listing->slug,
        ];
    }
}
