<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContractStatus;
use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Models\Property;
use App\Services\Billing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContractController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $contracts = Contract::query()
            ->with(['property', 'tenant'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->boolean('expiring'), fn ($q) => $q->where('status', ContractStatus::Active)->whereDate('end_date', '<=', today()->addDays(90)))
            ->orderBy('end_date')
            ->get();

        return ContractResource::collection($contracts);
    }

    public function store(ContractRequest $request, Billing $billing): ContractResource
    {
        $contract = DB::transaction(function () use ($request, $billing) {
            $data = $request->validated();
            $overlap = Contract::query()
                ->where('property_id', $data['property_id'])
                ->where('status', ContractStatus::Active)
                ->whereDate('start_date', '<=', $data['end_date'])
                ->whereDate('end_date', '>=', $data['start_date'])
                ->exists();
            if ($overlap) {
                throw ValidationException::withMessages(['property_id' => 'La propiedad ya tiene un contrato vigente en esas fechas.']);
            }

            $contract = Contract::query()->create($data + ['status' => ContractStatus::Active]);
            Property::query()->whereKey($contract->property_id)->update(['status' => PropertyStatus::Occupied]);
            $billing->generateForContract($contract);
            $billing->refreshStatuses();

            return $contract;
        });

        return ContractResource::make($contract->load('property', 'tenant'));
    }

    public function show(Contract $contract): ContractResource
    {
        return ContractResource::make($contract->load(['property', 'tenant', 'installments.payments', 'installments.contract', 'documents']));
    }

    public function update(ContractRequest $request, Contract $contract): ContractResource
    {
        DB::transaction(function () use ($request, $contract) {
            $contract->update($request->validated());
            if ($contract->status !== ContractStatus::Active) {
                Property::query()->whereKey($contract->property_id)->update(['status' => PropertyStatus::Available]);
            }
        });

        return ContractResource::make($contract->load('property', 'tenant'));
    }

    /**
     * Aplica un ajuste (ICL/IPC/acordado) al alquiler: actualiza el monto y las cuotas futuras impagas.
     */
    public function adjust(Request $request, Contract $contract): ContractResource
    {
        $data = $request->validate([
            'percentage' => ['required_without:new_amount', 'nullable', 'numeric', 'between:-50,500'],
            'new_amount' => ['required_without:percentage', 'nullable', 'numeric', 'min:1'],
            'from_period' => ['required', 'date_format:Y-m'],
        ]);

        DB::transaction(function () use ($contract, $data) {
            $amount = $data['new_amount'] ?? round((float) $contract->rent_amount * (1 + $data['percentage'] / 100), 2);
            $contract->update(['rent_amount' => $amount]);
            $contract->installments()
                ->whereDate('period', '>=', $data['from_period'].'-01')
                ->where('paid_amount', 0)
                ->update(['amount' => $amount]);
        });

        return ContractResource::make($contract->fresh(['property', 'tenant']));
    }

    public function destroy(Contract $contract): JsonResponse
    {
        abort_if($contract->installments()->where('paid_amount', '>', 0)->exists(), 422, 'El contrato tiene pagos registrados; rescindilo en lugar de borrarlo.');
        $contract->delete();

        return response()->json(['ok' => true]);
    }
}
