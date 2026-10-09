<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstallmentResource;
use App\Models\Installment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InstallmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $installments = Installment::query()
            ->with(['contract.property', 'contract.tenant'])
            ->when($request->query('status'), fn ($q, $s) => $s === 'impagas' ? $q->unpaid() : $q->where('status', $s))
            ->when($request->query('contract_id'), fn ($q, $id) => $q->where('contract_id', $id))
            ->when($request->query('period'), fn ($q, $p) => $q->whereDate('period', $p.'-01'))
            ->orderBy('due_date')
            ->limit(500)
            ->get();

        return InstallmentResource::collection($installments);
    }

    public function show(Installment $installment): InstallmentResource
    {
        return InstallmentResource::make($installment->load(['contract.property', 'contract.tenant', 'payments']));
    }
}
