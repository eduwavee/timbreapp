<?php

namespace App\Http\Requests;

use App\Models\Listing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ListingRequest extends FormRequest
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
            'headline' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:5000'],
            'neighborhood' => ['nullable', 'string', 'max:80'],
            'for_sale' => ['required', 'boolean'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'for_rent' => ['required', 'boolean'],
            'rent_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'expenses' => ['nullable', 'numeric', 'min:0'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'garage' => ['sometimes', 'boolean'],
            'age_years' => ['nullable', 'integer', 'min:0', 'max:300'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => [Rule::in(array_keys(Listing::AMENITIES))],
            'published' => ['required', 'boolean'],
            'reserved' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->boolean('for_sale') && ! $this->boolean('for_rent')) {
                    $validator->errors()->add('for_sale', 'Elegí si se vende, se alquila o las dos.');
                }
            },
        ];
    }

    public function attributes(): array
    {
        return [
            'headline' => 'título',
            'sale_price' => 'precio de venta',
            'rent_price' => 'precio de alquiler',
            'expenses' => 'expensas',
        ];
    }
}
