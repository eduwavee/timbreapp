<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IndexValue;
use App\Services\Adjustments;
use Illuminate\Http\JsonResponse;

/**
 * Ajustes ICL e IPC para aplicar: los que vencieron hace poco y los del próximo mes, ya calculados.
 */
class AdjustmentController extends Controller
{
    public function __invoke(Adjustments $adjustments): JsonResponse
    {
        return response()->json([
            'data' => $adjustments->pending(),
            'indices' => collect(['icl', 'ipc'])->mapWithKeys(fn (string $index) => [
                $index => IndexValue::query()->where('index', $index)->max('date'),
            ]),
        ]);
    }
}
