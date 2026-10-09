<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContractStatus;
use App\Enums\InstallmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\Installment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Agenda del mes: vencimientos de cuotas, fines de contrato, ajustes y documentos que vencen.
 */
class AgendaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['month' => ['nullable', 'date_format:Y-m']]);
        $from = Carbon::createFromFormat('Y-m-d', ($request->query('month') ?? today()->format('Y-m')).'-01')->startOfDay();
        $to = $from->copy()->endOfMonth();
        $events = collect();

        Installment::query()->with('contract.property', 'contract.tenant')
            ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->groupBy(fn (Installment $i) => $i->due_date->toDateString())
            ->each(function ($group, string $date) use ($events) {
                $unpaid = $group->filter(fn (Installment $i) => $i->status !== InstallmentStatus::Paid);
                $events->push([
                    'date' => $date,
                    'kind' => 'vencimiento',
                    'title' => $group->count().' '.($group->count() === 1 ? 'cuota vence' : 'cuotas vencen'),
                    'detail' => $unpaid->isEmpty() ? 'Todas cobradas' : $unpaid->count().' sin cobrar · '.'$'."\u{00A0}".number_format($unpaid->sum(fn (Installment $i) => $i->balance()), 0, ',', '.'),
                    'tone' => $unpaid->isEmpty() ? 'ok' : (Carbon::parse($date)->lt(today()) ? 'debt' : 'ink'),
                    'href' => '/admin',
                    'units' => $unpaid->map(fn (Installment $i) => $i->contract->property->code)->values(),
                ]);
            });

        Contract::query()->with('property', 'tenant')->where('status', ContractStatus::Active)->get()
            ->each(function (Contract $c) use ($events, $from, $to) {
                if ($c->end_date->between($from, $to)) {
                    $events->push([
                        'date' => $c->end_date->toDateString(),
                        'kind' => 'fin_contrato',
                        'title' => 'Termina el contrato de '.$c->property->code,
                        'detail' => $c->tenant->full_name,
                        'tone' => 'debt',
                        'href' => '/admin/contratos/'.$c->id,
                        'units' => [$c->property->code],
                    ]);
                }
                // Ajustes: cada N meses desde el inicio.
                $next = $c->start_date->copy()->addMonthsNoOverflow($c->adjustment_every_months);
                while ($next->lte($to) && $next->lt($c->end_date)) {
                    if ($next->gte($from)) {
                        $events->push([
                            'date' => $next->toDateString(),
                            'kind' => 'ajuste',
                            'title' => 'Ajuste '.$c->adjustment_type->label().' de '.$c->property->code,
                            'detail' => $c->tenant->full_name.' · cada '.$c->adjustment_every_months.' meses',
                            'tone' => 'ink',
                            'href' => '/admin/contratos/'.$c->id,
                            'units' => [$c->property->code],
                        ]);
                    }
                    $next->addMonthsNoOverflow($c->adjustment_every_months);
                }
            });

        ContractDocument::query()->with('contract.property')
            ->whereBetween('expires_on', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->each(fn (ContractDocument $d) => $events->push([
                'date' => $d->expires_on->toDateString(),
                'kind' => 'documento',
                'title' => 'Vence: '.$d->kind->label().' de '.$d->contract->property->code,
                'detail' => $d->name,
                'tone' => $d->expires_on->lt(today()) ? 'debt' : 'ink',
                'href' => '/admin/contratos/'.$d->contract_id,
                'units' => [$d->contract->property->code],
            ]));

        return response()->json([
            'month' => $from->format('Y-m'),
            'label' => ucfirst($from->locale('es')->translatedFormat('F Y')),
            'events' => $events->sortBy('date')->values(),
        ]);
    }
}
