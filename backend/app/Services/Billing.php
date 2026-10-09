<?php

namespace App\Services;

use App\Enums\ContractStatus;
use App\Enums\InstallmentStatus;
use App\Enums\PaymentMethod;
use App\Models\Contract;
use App\Models\Installment;
use App\Models\Payment;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Billing
{
    /**
     * Genera las cuotas que falten de cada contrato vigente hasta el mes indicado.
     *
     * @return int cantidad de cuotas creadas
     */
    public function generateInstallments(?CarbonInterface $upTo = null): int
    {
        $upTo = Carbon::parse($upTo ?? today())->startOfMonth();
        $created = 0;

        Contract::query()->where('status', ContractStatus::Active)->each(function (Contract $contract) use ($upTo, &$created): void {
            $created += $this->generateForContract($contract, $upTo);
        });

        return $created;
    }

    public function generateForContract(Contract $contract, ?CarbonInterface $upTo = null): int
    {
        $upTo = Carbon::parse($upTo ?? today())->startOfMonth();
        $last = $contract->end_date->copy()->startOfMonth();
        $limit = $upTo->lt($last) ? $upTo : $last;
        $period = $contract->start_date->copy()->startOfMonth();
        $created = 0;

        while ($period->lte($limit)) {
            $installment = Installment::query()->firstOrCreate(
                ['contract_id' => $contract->id, 'period' => $period->toDateString()],
                [
                    'due_date' => $period->copy()->day(min($contract->due_day, $period->daysInMonth))->toDateString(),
                    'amount' => $contract->rent_amount,
                    'status' => InstallmentStatus::Pending,
                ],
            );
            if ($installment->wasRecentlyCreated) {
                $created++;
            }
            $period->addMonth();
        }

        return $created;
    }

    /**
     * Marca como vencidas las cuotas impagas cuya fecha ya pasó.
     */
    public function refreshStatuses(): int
    {
        return Installment::query()
            ->whereIn('status', [InstallmentStatus::Pending, InstallmentStatus::Partial])
            ->whereDate('due_date', '<', today())
            ->update(['status' => InstallmentStatus::Overdue]);
    }

    /**
     * Registra un pago (total o parcial) y emite el recibo.
     *
     * @param  array{amount: float|string, paid_on?: string, method: string, reference?: ?string, notes?: ?string, late_fee?: float|string|null}  $data
     */
    public function registerPayment(Installment $installment, array $data): Payment
    {
        return DB::transaction(function () use ($installment, $data): Payment {
            $installment = Installment::query()->with('contract')->lockForUpdate()->findOrFail($installment->id);
            $paidOn = Carbon::parse($data['paid_on'] ?? today());
            $lateFee = array_key_exists('late_fee', $data) && $data['late_fee'] !== null
                ? (float) $data['late_fee']
                : $installment->lateFee($paidOn);

            // Numeración correlativa de recibos sin huecos ni duplicados.
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('select pg_advisory_xact_lock(4242)');
            }
            $payment = $installment->payments()->create([
                'receipt_number' => (int) Payment::query()->max('receipt_number') + 1,
                'amount' => $data['amount'],
                'late_fee' => $lateFee,
                'paid_on' => $paidOn->toDateString(),
                'method' => PaymentMethod::from($data['method']),
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $installment->paid_amount = round((float) $installment->paid_amount + (float) $data['amount'], 2);
            $installment->status = $installment->resolveStatus($paidOn->max(today()));
            if ($installment->status === InstallmentStatus::Paid) {
                $installment->paid_at = $paidOn;
            }
            $installment->save();

            return $payment;
        });
    }
}
