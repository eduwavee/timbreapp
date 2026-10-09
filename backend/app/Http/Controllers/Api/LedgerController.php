<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContactKind;
use App\Enums\ContractStatus;
use App\Enums\InstallmentStatus;
use App\Enums\ProofStatus;
use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Contract;
use App\Models\Installment;
use App\Models\PaymentProof;
use App\Services\WhatsApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * La "liquidación" del mes: una fila por unidad alquilada, con saldo anterior, cuota, pagos, intereses y saldo.
 */
class LedgerController extends Controller
{
    public function __invoke(Request $request, WhatsApp $whatsApp): JsonResponse
    {
        $request->validate(['period' => ['nullable', 'date_format:Y-m']]);
        $period = Carbon::createFromFormat('Y-m-d', ($request->query('period') ?? today()->format('Y-m')).'-01')->startOfDay();

        $contracts = Contract::query()
            ->where(fn ($q) => $q->where('status', ContractStatus::Active)
                ->orWhereHas('installments', fn ($i) => $i->overdue()))
            ->with([
                'property',
                'tenant',
                'installments' => fn ($q) => $q->where(fn ($w) => $w->unpaid()->orWhereDate('period', $period)),
            ])
            ->get();

        $pendingProofs = PaymentProof::query()
            ->where('status', ProofStatus::Pending)
            ->whereIn('tenant_id', $contracts->pluck('tenant_id'))
            ->selectRaw('tenant_id, count(*) as total')
            ->groupBy('tenant_id')
            ->pluck('total', 'tenant_id');

        $lastReminders = ContactLog::query()
            ->where('kind', ContactKind::Reminder)
            ->whereIn('tenant_id', $contracts->pluck('tenant_id'))
            ->selectRaw('tenant_id, max(created_at) as last_at')
            ->groupBy('tenant_id')
            ->pluck('last_at', 'tenant_id');

        $rows = $contracts->map(function (Contract $contract) use ($period, $whatsApp, $lastReminders, $pendingProofs) {
            $installments = $contract->installments->each->setRelation('contract', $contract);
            $current = $installments->first(fn (Installment $i) => $i->period->equalTo($period));
            $previous = $installments->filter(fn (Installment $i) => $i->period->lt($period) && $i->status !== InstallmentStatus::Paid);
            $overdue = $installments->filter(fn (Installment $i) => $i->daysLate() > 0);

            $previousBalance = round($previous->sum(fn (Installment $i) => $i->balance()), 2);
            $overdueDue = round($overdue->sum(fn (Installment $i) => $i->balance() + $i->lateFee()), 2);
            $lateFees = round($overdue->sum(fn (Installment $i) => $i->lateFee()), 2);
            $currentBalance = $current?->balance() ?? 0;
            $oldest = $overdue->sortBy('period')->first() ?? ($current && $current->status !== InstallmentStatus::Paid ? $current : null);

            return [
                'contract_id' => $contract->id,
                'property' => [
                    'id' => $contract->property->id,
                    'code' => $contract->property->code,
                    'address' => $contract->property->address,
                    'type' => $contract->property->type->label(),
                ],
                'tenant' => [
                    'id' => $contract->tenant->id,
                    'name' => $contract->tenant->full_name,
                    'phone' => $contract->tenant->phone,
                ],
                'previous_balance' => $previousBalance,
                'month_amount' => (float) ($current?->amount ?? 0),
                'month_paid' => (float) ($current?->paid_amount ?? 0),
                'late_fees' => $lateFees,
                'total_due' => round($previousBalance + $currentBalance + $lateFees, 2),
                'overdue_due' => $overdueDue,
                'overdue_count' => $overdue->count(),
                'days_late' => (int) $overdue->max(fn (Installment $i) => $i->daysLate()),
                'stage' => $current ? ['value' => $current->status->value, 'label' => $current->status->label()] : null,
                'current_installment_id' => $current?->id,
                'due_date' => $current?->due_date->toDateString(),
                'action_installment_id' => $oldest?->id,
                'whatsapp_url' => $oldest && $overdue->isNotEmpty() ? $whatsApp->reminder($oldest)['url'] : null,
                'pending_proofs' => (int) ($pendingProofs[$contract->tenant_id] ?? 0),
                'last_reminder_at' => isset($lastReminders[$contract->tenant_id]) ? Carbon::parse($lastReminders[$contract->tenant_id])->toIso8601String() : null,
            ];
        })
            ->sortBy([
                fn ($a, $b) => $b['days_late'] > 0 <=> $a['days_late'] > 0,
                fn ($a, $b) => $b['total_due'] <=> $a['total_due'],
                fn ($a, $b) => strcmp($a['property']['code'], $b['property']['code']),
            ])
            ->values();

        return response()->json([
            'period' => $period->format('Y-m'),
            'period_label' => ucfirst($period->locale('es')->translatedFormat('F Y')),
            'totals' => [
                'expected' => round($rows->sum('month_amount'), 2),
                'collected' => round($rows->sum('month_paid'), 2),
                'owed' => round($rows->sum('overdue_due'), 2),
                'debtors' => $rows->where('days_late', '>', 0)->count(),
                'units' => $rows->count(),
            ],
            'rows' => $rows,
        ]);
    }
}
