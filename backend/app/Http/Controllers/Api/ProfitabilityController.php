<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Cuánto deja cada propiedad: lo cobrado (incluida la mora) menos los gastos cargados.
 */
class ProfitabilityController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['year' => ['nullable', 'digits:4']]);
        $year = (int) ($request->query('year') ?? today()->year);

        $income = Payment::query()
            ->join('installments', 'installments.id', '=', 'payments.installment_id')
            ->join('contracts', 'contracts.id', '=', 'installments.contract_id')
            ->whereYear('payments.paid_on', $year)
            ->selectRaw('contracts.property_id, extract(month from payments.paid_on)::int as month, sum(payments.amount + payments.late_fee) as total')
            ->groupBy('contracts.property_id', 'month')
            ->get();

        $spent = Expense::query()
            ->whereYear('spent_on', $year)
            ->selectRaw('property_id, extract(month from spent_on)::int as month, sum(amount) as total')
            ->groupBy('property_id', 'month')
            ->get();

        $rows = Property::query()->orderBy('code')->get()->map(function (Property $p) use ($income, $spent) {
            $in = round((float) $income->where('property_id', $p->id)->sum('total'), 2);
            $out = round((float) $spent->where('property_id', $p->id)->sum('total'), 2);

            return [
                'property' => ['id' => $p->id, 'code' => $p->code, 'address' => $p->address, 'type' => $p->type->label()],
                'income' => $in,
                'expenses' => $out,
                'net' => round($in - $out, 2),
                'margin' => $in > 0 ? round(($in - $out) / $in * 100, 1) : null,
            ];
        })->sortByDesc('net')->values();

        $months = collect(range(1, 12))->map(fn (int $m) => [
            'month' => sprintf('%d-%02d', $year, $m),
            'income' => round((float) $income->where('month', $m)->sum('total'), 2),
            'expenses' => round((float) $spent->where('month', $m)->sum('total'), 2),
        ])->map(fn ($r) => $r + ['net' => round($r['income'] - $r['expenses'], 2)]);

        return response()->json([
            'year' => $year,
            'totals' => [
                'income' => round($rows->sum('income'), 2),
                'expenses' => round($rows->sum('expenses'), 2),
                'net' => round($rows->sum('net'), 2),
            ],
            'properties' => $rows,
            'months' => $months,
        ]);
    }
}
