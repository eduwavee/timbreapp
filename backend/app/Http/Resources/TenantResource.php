<?php

namespace App\Http\Resources;

use App\Models\Tenant;
use App\Services\WhatsApp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Tenant */
class TenantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'document' => $this->document,
            'phone' => $this->phone,
            'whatsapp_url' => WhatsApp::link($this->phone, ''),
            'email' => $this->email,
            'guarantor_name' => $this->guarantor_name,
            'guarantor_phone' => $this->guarantor_phone,
            'notes' => $this->notes,
            'has_portal_access' => $this->whenLoaded('user', fn () => $this->user !== null),
            'active_contract' => ContractResource::make($this->whenLoaded('activeContract')),
            'balance' => $this->when(isset($this->balance), fn () => round((float) $this->balance, 2)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
