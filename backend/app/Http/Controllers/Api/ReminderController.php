<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContactKind;
use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Installment;
use App\Services\WhatsApp;
use Illuminate\Http\JsonResponse;

/**
 * Registra el aviso de deuda por WhatsApp y devuelve el link wa.me.
 */
class ReminderController extends Controller
{
    public function store(Installment $installment, WhatsApp $whatsApp): JsonResponse
    {
        $reminder = $whatsApp->reminder($installment);

        $log = ContactLog::query()->create([
            'kind' => ContactKind::Reminder,
            'tenant_id' => $installment->contract->tenant_id,
            'installment_id' => $installment->id,
            'phone' => $reminder['phone'],
            'message' => $reminder['message'],
        ]);

        return response()->json($reminder + ['logged_at' => $log->created_at->toIso8601String()]);
    }
}
