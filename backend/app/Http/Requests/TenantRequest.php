<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantRequest extends FormRequest
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
        $tenant = $this->route('tenant');

        return [
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'document' => ['required', 'string', 'max:20', Rule::unique('tenants')->ignore($tenant)],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\-\s]{8,}$/'],
            'email' => ['nullable', 'email', 'max:120', Rule::unique('users', 'email')->ignore($tenant?->user?->id)],
            'guarantor_name' => ['nullable', 'string', 'max:120'],
            'guarantor_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'portal_password' => ['nullable', 'string', 'min:8', 'required_with:create_portal_access'],
            'create_portal_access' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['phone.regex' => 'Escribí el teléfono con código de área, por ejemplo 11 5555-1234.'];
    }
}
