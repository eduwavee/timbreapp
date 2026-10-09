<?php

namespace App\Http\Requests;

use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PropertyRequest extends FormRequest
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
        return [
            'code' => ['required', 'string', 'max:16', Rule::unique('properties')->ignore($this->route('property'))],
            'type' => ['required', Rule::enum(PropertyType::class)],
            'status' => ['required', Rule::enum(PropertyStatus::class)],
            'street' => ['required', 'string', 'max:120'],
            'number' => ['required', 'string', 'max:20'],
            'unit' => ['nullable', 'string', 'max:20'],
            'city' => ['required', 'string', 'max:80'],
            'surface_m2' => ['nullable', 'numeric', 'min:0'],
            'rooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
