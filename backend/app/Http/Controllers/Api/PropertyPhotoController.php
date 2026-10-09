<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PropertyPhotoController extends Controller
{
    public function store(Request $request, Property $property): JsonResponse
    {
        $request->validate([
            'photos' => ['required', 'array', 'max:12'],
            'photos.*' => ['image', 'max:8192'],
            'caption' => ['nullable', 'string', 'max:120'],
        ]);

        $position = (int) $property->photos()->max('position');
        $photos = collect($request->file('photos'))->map(fn ($file) => $property->photos()->create([
            'path' => $file->store("properties/{$property->id}", 'public'),
            'caption' => $request->input('caption'),
            'position' => ++$position,
        ]));

        return response()->json(['data' => $photos->map(fn (PropertyPhoto $p) => ['id' => $p->id, 'url' => $p->url, 'caption' => $p->caption])], 201);
    }

    public function update(Request $request, PropertyPhoto $photo): JsonResponse
    {
        $data = $request->validate(['caption' => ['nullable', 'string', 'max:120'], 'cover' => ['sometimes', 'boolean']]);
        if ($request->boolean('cover')) {
            PropertyPhoto::query()->where('property_id', $photo->property_id)->increment('position');
            $photo->position = 0;
        }
        if (array_key_exists('caption', $data)) {
            $photo->caption = $data['caption'];
        }
        $photo->save();

        return response()->json(['ok' => true]);
    }

    public function destroy(PropertyPhoto $photo): JsonResponse
    {
        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['ok' => true]);
    }
}
