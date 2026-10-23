<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(Setting::allWithDefaults());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'owner_name' => ['required', 'string', 'max:120'],
            'owner_phone' => ['nullable', 'string', 'max:30'],
            'bank_alias' => ['nullable', 'string', 'max:60'],
            'reminder_template' => ['required', 'string', 'max:1500'],
            'derivation_template' => ['required', 'string', 'max:1500'],
            'site_name' => ['sometimes', 'required', 'string', 'max:60'],
            'inquiry_reply_template' => ['sometimes', 'required', 'string', 'max:1500'],
            'inquiry_derivation_template' => ['sometimes', 'required', 'string', 'max:1500'],
        ]);

        foreach ($data as $key => $value) {
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(Setting::allWithDefaults());
    }
}
