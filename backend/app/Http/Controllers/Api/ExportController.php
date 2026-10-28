<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Payment;
use App\Services\WhatsApp;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Excel del mes para el contador (liquidación, cobros y gastos, una hoja cada uno)
 * y el Excel de cualquier listado tal como se ve en pantalla, con sus filtros.
 */
class ExportController extends Controller
{
    public function month(Request $request, LedgerController $ledger, WhatsApp $whatsApp): BinaryFileResponse
    {
        $request->validate(['month' => ['required', 'date_format:Y-m']]);
        $month = $request->query('month');
        $from = Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfDay();
        $to = $from->copy()->endOfMonth();

        $ledgerRequest = Request::create('/', 'GET', ['period' => $month]);
        $data = $ledger($ledgerRequest, $whatsApp)->getData(true);

        $money = new Style(format: '"$" #,##0.00');
        $head = new Style(fontBold: true, backgroundColor: 'EEF0EC');
        $title = new Style(fontBold: true, fontSize: 13);

        $options = new Options;
        $options->setColumnWidth(14, 1);
        $options->setColumnWidth(30, 2, 3);
        $options->setColumnWidthForRange(16, 4, 10);
        $path = tempnam(sys_get_temp_dir(), 'timbre').'.xlsx';
        $writer = new Writer($options);
        $writer->openToFile($path);

        // Hoja 1: liquidación
        $writer->getCurrentSheet()->setName('Liquidación');
        $writer->addRow(Row::fromValuesWithStyle(['Liquidación '.$data['period_label']], $title));
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(['Unidad', 'Dirección', 'Inquilino', 'Saldo anterior', 'Cuota', 'Pagado', 'Intereses', 'Saldo', 'Días de atraso', 'Etapa'], $head));
        foreach ($data['rows'] as $r) {
            $writer->addRow(Row::fromValuesWithStyles(
                [$r['property']['code'], $r['property']['address'], $r['tenant']['name'], $r['previous_balance'], $r['month_amount'], $r['month_paid'], $r['late_fees'], $r['total_due'], $r['days_late'], $r['stage']['label'] ?? ''],
                [3 => $money, 4 => $money, 5 => $money, 6 => $money, 7 => $money],
            ));
        }
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyles(['Esperado', '', '', $data['totals']['expected']], [0 => $head, 3 => $money]));
        $writer->addRow(Row::fromValuesWithStyles(['Cobrado', '', '', $data['totals']['collected']], [0 => $head, 3 => $money]));
        $writer->addRow(Row::fromValuesWithStyles(['Adeudado vencido', '', '', $data['totals']['owed']], [0 => $head, 3 => $money]));

        // Hoja 2: cobros
        $writer->addNewSheetAndMakeItCurrent()->setName('Cobros');
        $writer->addRow(Row::fromValuesWithStyle(['Recibo', 'Fecha', 'Unidad', 'Inquilino', 'Período', 'Medio', 'Alquiler', 'Mora', 'Total', 'Referencia'], $head));
        Payment::query()->with('installment.contract.property', 'installment.contract.tenant')
            ->whereBetween('paid_on', [$from->toDateString(), $to->toDateString()])->orderBy('receipt_number')->get()
            ->each(fn (Payment $p) => $writer->addRow(Row::fromValuesWithStyles([
                $p->receipt_number,
                $p->paid_on->format('d/m/Y'),
                $p->installment->contract->property->code,
                $p->installment->contract->tenant->full_name,
                ucfirst($p->installment->period->locale('es')->translatedFormat('F Y')),
                $p->method->label(),
                (float) $p->amount,
                (float) $p->late_fee,
                (float) $p->amount + (float) $p->late_fee,
                $p->reference ?? '',
            ], [6 => $money, 7 => $money, 8 => $money])));

        // Hoja 3: gastos
        $writer->addNewSheetAndMakeItCurrent()->setName('Gastos');
        $writer->addRow(Row::fromValuesWithStyle(['Fecha', 'Unidad', 'Rubro', 'Detalle', 'Monto'], $head));
        Expense::query()->with('property')->whereBetween('spent_on', [$from->toDateString(), $to->toDateString()])->orderBy('spent_on')->get()
            ->each(fn (Expense $e) => $writer->addRow(Row::fromValuesWithStyles([
                $e->spent_on->format('d/m/Y'), $e->property->code, $e->category->label(), $e->description, (float) $e->amount,
            ], [4 => $money])));

        $writer->close();

        return response()->download($path, "timbre-{$month}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend();
    }

    /**
     * Arma el Excel con las columnas y filas que manda el panel: lo que el usuario está viendo.
     */
    public function table(Request $request): BinaryFileResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:80'],
            'columns' => ['required', 'array', 'min:1', 'max:30'],
            'columns.*.label' => ['required', 'string', 'max:60'],
            'columns.*.type' => ['nullable', 'in:text,money,number'],
            'rows' => ['present', 'array', 'max:5000'],
            'rows.*' => ['array'],
        ]);

        $money = new Style(format: '"$" #,##0');
        $head = new Style(fontBold: true, backgroundColor: 'EEF0EC');
        $title = new Style(fontBold: true, fontSize: 13);
        $types = array_map(fn (array $c) => $c['type'] ?? 'text', $data['columns']);

        $options = new Options;
        $options->setColumnWidthForRange(18, 1, count($types));
        $path = tempnam(sys_get_temp_dir(), 'timbre').'.xlsx';
        $writer = new Writer($options);
        $writer->openToFile($path);
        $writer->getCurrentSheet()->setName(str($data['title'])->limit(28, '')->toString());

        $writer->addRow(Row::fromValuesWithStyle([$data['title'].' · '.now()->format('d/m/Y H:i')], $title));
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(array_column($data['columns'], 'label'), $head));
        foreach ($data['rows'] as $row) {
            $values = [];
            $styles = [];
            foreach ($types as $i => $type) {
                $value = $row[$i] ?? null;
                $values[] = $type === 'text' || ! is_numeric($value) ? (string) ($value ?? '') : (float) $value;
                if ($type === 'money' && is_numeric($value)) {
                    $styles[$i] = $money;
                }
            }
            $writer->addRow(Row::fromValuesWithStyles($values, $styles));
        }
        $writer->close();

        $name = str($data['title'])->slug()->append('-'.now()->format('Y-m-d').'.xlsx')->toString();

        return response()->download($path, $name, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend();
    }
}
