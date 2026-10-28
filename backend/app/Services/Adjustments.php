<?php

namespace App\Services;

use App\Enums\AdjustmentType;
use App\Enums\ContractStatus;
use App\Models\Contract;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * Ajustes de alquiler por ICL o IPC: cuándo toca cada uno y cuánto da según los índices oficiales.
 */
class Adjustments
{
    /** Se proponen los ajustes que caen en el próximo mes… */
    private const DAYS_AHEAD = 30;

    /** …y los de los últimos dos meses que todavía no se aplicaron. */
    private const DAYS_BEHIND = 60;

    public function __construct(private Indices $indices) {}

    /**
     * Los ajustes que hay que aplicar, del más atrasado al más lejano.
     *
     * @return array<int, array<string, mixed>>
     */
    public function pending(?CarbonInterface $today = null): array
    {
        $today ??= today();

        return Contract::query()
            ->where('status', ContractStatus::Active)
            ->whereIn('adjustment_type', [AdjustmentType::Icl, AdjustmentType::Ipc])
            ->with('property', 'tenant', 'adjustments')
            ->get()
            ->map(fn (Contract $contract) => $this->suggestionFor($contract, $today))
            ->filter()
            ->sortBy('date')
            ->values()
            ->all();
    }

    /**
     * El próximo ajuste de un contrato, o null si no toca ninguno o ya se aplicó.
     *
     * @return array<string, mixed>|null
     */
    public function suggestionFor(Contract $contract, ?CarbonInterface $today = null): ?array
    {
        $today ??= today();
        if (! in_array($contract->adjustment_type, [AdjustmentType::Icl, AdjustmentType::Ipc], true)) {
            return null;
        }

        [$previous, $date] = $this->currentWindow($contract, $today);
        if (! $date || $date->lt($today->copy()->subDays(self::DAYS_BEHIND)) || $date->gt($contract->end_date)) {
            return null;
        }

        $fromPeriod = $date->copy()->startOfMonth();
        if ($contract->adjustments->contains(fn ($a) => $a->from_period->isSameMonth($fromPeriod))) {
            return null;
        }

        $type = $contract->adjustment_type;
        $base = $this->indices->valueAt($type, $previous);
        $target = $this->indices->valueAt($type, $date);
        $rent = (float) $contract->rent_amount;
        $ready = $base && $target && $base['value'] > 0 && $target['date']->gt($base['date']);
        $factor = $ready ? $target['value'] / $base['value'] : null;

        return [
            'contract_id' => $contract->id,
            'property' => ['id' => $contract->property->id, 'code' => $contract->property->code, 'address' => $contract->property->address],
            'tenant' => ['id' => $contract->tenant->id, 'name' => $contract->tenant->full_name],
            'index' => $type->label(),
            'every_months' => $contract->adjustment_every_months,
            'date' => $date->toDateString(),
            'days' => (int) $today->diffInDays($date, false),
            'from_period' => $fromPeriod->format('Y-m'),
            'previous_amount' => $rent,
            'ready' => $ready,
            'percentage' => $factor ? round(($factor - 1) * 100, 2) : null,
            'new_amount' => $factor ? round($rent * $factor) : null,
            'provisional' => $ready && $target['provisional'],
            'basis' => $ready ? $this->basis($type, $base['date'], $target['date']) : null,
        ];
    }

    /**
     * La fecha del ajuste vigente (el último que ya llegó o llega en los próximos días) y la del anterior.
     *
     * @return array{0: Carbon, 1: Carbon|null}
     */
    private function currentWindow(Contract $contract, CarbonInterface $today): array
    {
        $every = max(1, (int) $contract->adjustment_every_months);
        $limit = $today->copy()->addDays(self::DAYS_AHEAD);
        $previous = $contract->start_date->copy();
        $current = null;

        for ($k = 1; ($next = $contract->start_date->copy()->addMonthsNoOverflow($k * $every))->lte($limit); $k++) {
            $previous = $current ?? $contract->start_date->copy();
            $current = $next;
        }

        return [$previous, $current];
    }

    private function basis(AdjustmentType $type, Carbon $from, Carbon $to): string
    {
        return $type === AdjustmentType::Ipc
            ? 'IPC '.$from->locale('es')->translatedFormat('M Y').' → '.$to->locale('es')->translatedFormat('M Y')
            : 'ICL '.$from->format('d/m/Y').' → '.$to->format('d/m/Y');
    }
}
