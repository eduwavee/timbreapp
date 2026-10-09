<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\TenantRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\TenantResource;
use App\Http\Resources\TicketResource;
use App\Models\ContactLog;
use App\Models\Installment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenants = Tenant::query()
            ->with(['activeContract.property', 'user'])
            ->addSelect(['balance' => Installment::query()
                ->selectRaw('coalesce(sum(installments.amount - installments.paid_amount), 0)')
                ->join('contracts', 'contracts.id', '=', 'installments.contract_id')
                ->whereColumn('contracts.tenant_id', 'tenants.id')
                ->overdue(),
            ])
            ->when($request->query('q'), function ($q, $term) {
                $like = '%'.mb_strtolower($term).'%';
                $q->where(fn ($w) => $w->whereRaw("lower(first_name || ' ' || last_name) like ?", [$like])
                    ->orWhere('document', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%"));
            })
            ->orderBy('last_name')
            ->get();

        return TenantResource::collection($tenants);
    }

    public function store(TenantRequest $request): TenantResource
    {
        $tenant = DB::transaction(function () use ($request) {
            $tenant = Tenant::query()->create($request->safe()->except(['portal_password', 'create_portal_access']));
            $this->syncPortalAccess($tenant, $request);

            return $tenant;
        });

        return TenantResource::make($tenant->load('user'));
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->load(['user', 'contracts' => fn ($q) => $q->with(['property', 'installments.payments'])->latest('start_date')]);

        return response()->json([
            'data' => TenantResource::make($tenant),
            'contracts' => ContractResource::collection($tenant->contracts),
            'tickets' => TicketResource::collection($tenant->tickets()->with('property', 'provider')->latest()->get()),
            'contacts' => ContactLog::query()->whereBelongsTo($tenant)->latest()->limit(20)->get()->map(fn ($l) => [
                'id' => $l->id,
                'kind' => $l->kind->label(),
                'message' => $l->message,
                'created_at' => $l->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function update(TenantRequest $request, Tenant $tenant): TenantResource
    {
        DB::transaction(function () use ($request, $tenant) {
            $tenant->update($request->safe()->except(['portal_password', 'create_portal_access']));
            $this->syncPortalAccess($tenant, $request);
        });

        return TenantResource::make($tenant->fresh('user'));
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        abort_if($tenant->contracts()->exists(), 422, 'El inquilino tiene contratos; no se puede borrar.');
        $tenant->delete();

        return response()->json(['ok' => true]);
    }

    private function syncPortalAccess(Tenant $tenant, TenantRequest $request): void
    {
        $user = $tenant->user;
        if ($user && $tenant->email) {
            $user->update(['email' => $tenant->email, 'name' => $tenant->full_name]);
        }
        if (! $request->boolean('create_portal_access') || ! $tenant->email) {
            return;
        }
        $password = $request->validated('portal_password');
        if ($user) {
            $user->update(['password' => $password]);

            return;
        }
        User::query()->create([
            'name' => $tenant->full_name,
            'email' => $tenant->email,
            'password' => $password,
            'role' => UserRole::Tenant,
            'tenant_id' => $tenant->id,
        ]);
    }
}
