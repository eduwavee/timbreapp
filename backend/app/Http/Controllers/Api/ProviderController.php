<?php

namespace App\Http\Controllers\Api;

use App\Enums\Trade;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProviderResource;
use App\Models\Provider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ProviderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return ProviderResource::collection(
            Provider::query()
                ->withCount(['tickets' => fn ($q) => $q->open()])
                ->when($request->query('trade'), fn ($q, $t) => $q->where('trade', $t))
                ->orderBy('trade')->orderBy('name')->get()
        );
    }

    public function store(Request $request): ProviderResource
    {
        return ProviderResource::make(Provider::query()->create($this->validated($request)));
    }

    public function update(Request $request, Provider $provider): ProviderResource
    {
        $provider->update($this->validated($request));

        return ProviderResource::make($provider);
    }

    public function destroy(Provider $provider): JsonResponse
    {
        $provider->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'trade' => ['required', Rule::enum(Trade::class)],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\-\s]{8,}$/'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'active' => ['sometimes', 'boolean'],
        ]);
    }
}
