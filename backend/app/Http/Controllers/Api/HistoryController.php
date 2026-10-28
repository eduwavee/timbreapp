<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChangeLog;
use App\Models\Contract;
use App\Models\Property;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;

/**
 * Historial de una ficha: quién la dio de alta y qué cambió en cada edición.
 */
class HistoryController extends Controller
{
    private const SUBJECTS = ['properties' => Property::class, 'tenants' => Tenant::class, 'contracts' => Contract::class];

    public function __invoke(string $type, int $id): JsonResponse
    {
        $class = self::SUBJECTS[$type];
        $subject = $class::query()->findOrFail($id);

        $entries = ChangeLog::query()
            ->whereMorphedTo('subject', $subject)
            ->with('user')
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (ChangeLog $log) => [
                'id' => $log->id,
                'event' => $log->event,
                'changes' => $log->changes,
                'user' => $log->user?->name,
                'at' => $log->created_at->toIso8601String(),
            ]);

        return response()->json(['data' => $entries]);
    }
}
