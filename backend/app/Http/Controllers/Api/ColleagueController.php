<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ColleagueResource;
use App\Models\Colleague;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Vendedores y colegas a quienes se les derivan las consultas de La Choza.
 */
class ColleagueController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ColleagueResource::collection(
            Colleague::query()->withCount(['inquiries' => fn ($q) => $q->open()])->orderByDesc('active')->orderBy('name')->get()
        );
    }

    public function store(Request $request): ColleagueResource
    {
        return ColleagueResource::make(Colleague::query()->create($this->validated($request)));
    }

    public function update(Request $request, Colleague $colleague): ColleagueResource
    {
        $colleague->update($this->validated($request));

        return ColleagueResource::make($colleague);
    }

    public function destroy(Colleague $colleague): JsonResponse
    {
        $colleague->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'agency' => ['nullable', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\-\s]{8,}$/'],
            'zone' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'active' => ['sometimes', 'boolean'],
        ]);
    }
}
