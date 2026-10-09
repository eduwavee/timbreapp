<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use App\Enums\Trade;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isAdmin = (bool) $this->user()?->isAdmin();

        return [
            'property_id' => [Rule::requiredIf($isAdmin), 'exists:properties,id'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'title' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:3000'],
            'category' => ['required', Rule::enum(Trade::class)],
            'priority' => ['required', Rule::enum(TicketPriority::class)],
            'photos' => ['nullable', 'array', 'max:4'],
            'photos.*' => ['image', 'max:6144'],
        ];
    }
}
