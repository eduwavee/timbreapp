<?php

namespace App\Services;

use App\Enums\AdjustmentType;
use App\Enums\ContractStatus;
use App\Models\Contract;
use App\Models\IndexValue;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

/**
 * Índices oficiales para ajustar alquileres: ICL diario del BCRA e IPC mensual del INDEC (vía datos.gob.ar).
 */
class Indices
{
    public const ICL_URL = 'https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/40';

    public const IPC_URL = 'https://apis.datos.gob.ar/series/api/series/';

    /** IPC nacional, nivel general, base diciembre 2016. */
    public const IPC_SERIES = '148.3_INIVELNAL_DICI_M_26';

    /**
     * Trae lo que falta de cada índice y lo guarda.
     *
     * @return array{icl: int, ipc: int}
     */
    public function update(): array
    {
        return ['icl' => $this->updateIcl(), 'ipc' => $this->updateIpc()];
    }

    /**
     * El valor vigente para una fecha: el ICL publicado ese día (o el último anterior) y, para el IPC,
     * el del mes que el INDEC ya publicó (dos meses antes, porque sale a mitad del mes siguiente).
     *
     * @return array{date: Carbon, value: float, provisional: bool}|null
     */
    public function valueAt(AdjustmentType $type, CarbonInterface $date): ?array
    {
        $wanted = $type === AdjustmentType::Ipc
            ? $date->copy()->startOfMonth()->subMonthsNoOverflow(2)
            : $date->copy()->startOfDay();

        $row = IndexValue::query()
            ->where('index', $type->value)
            ->whereDate('date', '<=', $wanted)
            ->orderByDesc('date')
            ->first();

        return $row ? ['date' => $row->date, 'value' => (float) $row->value, 'provisional' => $row->date->lt($wanted)] : null;
    }

    private function updateIcl(): int
    {
        $from = $this->resumeFrom('icl');
        $saved = 0;

        // El BCRA devuelve hasta 1000 filas por pedido: se pide de a un año.
        for ($start = $from->copy(); $start->lte(today()); $start->addYear()) {
            $end = $start->copy()->addYear()->subDay()->min(today());
            $rows = Http::timeout(20)->retry(2, 500)
                ->get(self::ICL_URL, ['desde' => $start->toDateString(), 'hasta' => $end->toDateString(), 'limit' => 1000])
                ->throw()
                ->json('results.0.detalle', []);

            $saved += $this->store('icl', collect($rows)->map(fn (array $r) => ['date' => $r['fecha'], 'value' => $r['valor']]));
        }

        return $saved;
    }

    private function updateIpc(): int
    {
        $rows = Http::timeout(20)->retry(2, 500)
            ->get(self::IPC_URL, ['ids' => self::IPC_SERIES, 'start_date' => $this->resumeFrom('ipc')->format('Y-m-01'), 'limit' => 1000, 'format' => 'json'])
            ->throw()
            ->json('data', []);

        return $this->store('ipc', collect($rows)->map(fn (array $r) => ['date' => $r[0], 'value' => $r[1]]));
    }

    /**
     * Desde dónde pedir: una semana antes del último guardado (por si hubo correcciones) o,
     * la primera vez, desde el contrato ajustable más viejo.
     */
    private function resumeFrom(string $index): Carbon
    {
        $last = IndexValue::query()->where('index', $index)->max('date');
        if ($last) {
            return Carbon::parse($last)->subDays($index === 'ipc' ? 62 : 7);
        }

        $oldest = Contract::query()
            ->where('status', ContractStatus::Active)
            ->whereIn('adjustment_type', [AdjustmentType::Icl, AdjustmentType::Ipc])
            ->min('start_date');

        return ($oldest ? Carbon::parse($oldest) : today()->subYears(2))->subMonthsNoOverflow(3)->startOfMonth();
    }

    /**
     * @param  Collection<int, array{date: string, value: float|null}>  $rows
     */
    private function store(string $index, Collection $rows): int
    {
        $now = now();
        $values = $rows->filter(fn (array $r) => $r['value'] !== null)
            ->map(fn (array $r) => ['index' => $index, 'date' => $r['date'], 'value' => $r['value'], 'created_at' => $now, 'updated_at' => $now])
            ->values()
            ->all();

        if ($values) {
            IndexValue::query()->upsert($values, ['index', 'date'], ['value', 'updated_at']);
        }

        return count($values);
    }
}
