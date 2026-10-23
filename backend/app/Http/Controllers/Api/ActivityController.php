<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContactKind;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Inquiry;
use App\Models\Payment;
use App\Models\PaymentProof;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Línea de tiempo: pagos, avisos, reclamos y comprobantes, de lo más nuevo a lo más viejo.
 */
class ActivityController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $limit = min(100, max(5, (int) $request->query('limit', 40)));

        $payments = Payment::query()->with('installment.contract.property', 'installment.contract.tenant')->latest('id')->limit($limit)->get()
            ->map(fn (Payment $p) => [
                'kind' => 'pago',
                'at' => $p->created_at->toIso8601String(),
                'title' => $p->installment->contract->tenant->full_name.' pagó '.self::pesos((float) $p->amount + (float) $p->late_fee),
                'detail' => $p->installment->contract->property->code.' · '.ucfirst($p->installment->period->locale('es')->translatedFormat('F Y')).' · recibo N° '.str_pad((string) $p->receipt_number, 5, '0', STR_PAD_LEFT),
                'href' => '/recibo/'.$p->id,
            ]);

        $contacts = ContactLog::query()->with('tenant', 'provider')->latest()->limit($limit)->get()
            ->map(fn (ContactLog $l) => [
                'kind' => $l->kind === ContactKind::Reminder ? 'aviso' : 'derivacion',
                'at' => $l->created_at->toIso8601String(),
                'title' => $l->kind === ContactKind::Reminder
                    ? 'Aviso de deuda a '.($l->tenant?->full_name ?? 'inquilino')
                    : 'Reclamo derivado a '.($l->provider?->name ?? 'proveedor'),
                'detail' => str($l->message)->limit(110)->toString(),
                'href' => $l->ticket_id ? '/admin/reclamos/'.$l->ticket_id : ($l->tenant_id ? '/admin/inquilinos/'.$l->tenant_id : null),
            ]);

        $tickets = Ticket::query()->with('property', 'tenant')->latest()->limit($limit)->get()
            ->flatMap(fn (Ticket $t) => array_filter([
                [
                    'kind' => 'reclamo',
                    'at' => $t->created_at->toIso8601String(),
                    'title' => 'Nuevo reclamo: '.$t->title,
                    'detail' => $t->property->code.' · '.($t->tenant?->full_name ?? 'cargado por la administración').' · '.$t->priority->label(),
                    'href' => '/admin/reclamos/'.$t->id,
                ],
                $t->status === TicketStatus::Resolved && $t->resolved_at ? [
                    'kind' => 'resuelto',
                    'at' => $t->resolved_at->toIso8601String(),
                    'title' => 'Reclamo resuelto: '.$t->title,
                    'detail' => $t->property->code.($t->cost ? ' · costo '.self::pesos((float) $t->cost) : ''),
                    'href' => '/admin/reclamos/'.$t->id,
                ] : null,
            ]));

        $proofs = PaymentProof::query()->with('tenant', 'installment.contract.property')->latest()->limit($limit)->get()
            ->map(fn (PaymentProof $p) => [
                'kind' => 'comprobante',
                'at' => $p->created_at->toIso8601String(),
                'title' => $p->tenant->full_name.' subió un comprobante de '.self::pesos((float) $p->amount),
                'detail' => $p->installment->contract->property->code.' · '.$p->status->label(),
                'href' => '/admin/cobros?tab=comprobantes',
            ]);

        $inquiries = Inquiry::query()->with('property', 'colleague')->latest()->limit($limit)->get()
            ->flatMap(fn (Inquiry $i) => array_filter([
                [
                    'kind' => 'consulta',
                    'at' => $i->created_at->toIso8601String(),
                    'title' => "{$i->name} consultó por {$i->property->code} en La Choza",
                    'detail' => $i->operation->label().' · '.str((string) $i->message)->limit(90)->toString(),
                    'href' => '/admin/consultas?id='.$i->id,
                ],
                $i->derived_at && $i->colleague ? [
                    'kind' => 'derivacion',
                    'at' => $i->derived_at->toIso8601String(),
                    'title' => "Consulta de {$i->name} derivada a {$i->colleague->name}",
                    'detail' => $i->property->code.' · '.$i->operation->label(),
                    'href' => '/admin/consultas?id='.$i->id,
                ] : null,
            ]));

        /** @var Collection<int, array<string, mixed>> $events */
        $events = collect()->concat($payments)->concat($contacts)->concat($tickets)->concat($proofs)->concat($inquiries)
            ->sortByDesc('at')->take($limit)->values();

        return response()->json(['data' => $events]);
    }

    /**
     * Pesos enteros, como en la planilla.
     */
    private static function pesos(float $amount): string
    {
        return '$ '.number_format($amount, 0, ',', '.');
    }
}
