<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\TicketResource;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class PropertyController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $properties = Property::query()
            ->with(['activeContract.tenant', 'photos'])
            ->withCount(['tickets' => fn ($q) => $q->open()])
            ->addSelect(['balance' => Installment::query()
                ->selectRaw('coalesce(sum(installments.amount - installments.paid_amount), 0)')
                ->join('contracts', 'contracts.id', '=', 'installments.contract_id')
                ->whereColumn('contracts.property_id', 'properties.id')
                ->overdue(),
            ])
            ->when($request->query('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('q'), function ($q, $term) {
                $like = '%'.mb_strtolower($term).'%';
                $q->where(fn ($w) => $w->whereRaw('lower(street) like ?', [$like])
                    ->orWhereRaw('lower(code) like ?', [$like])
                    ->orWhereHas('activeContract.tenant', fn ($t) => $t->whereRaw("lower(first_name || ' ' || last_name) like ?", [$like])));
            })
            ->orderBy('code')
            ->get();

        return PropertyResource::collection($properties);
    }

    public function store(PropertyRequest $request): PropertyResource
    {
        return PropertyResource::make(Property::query()->create($request->validated()));
    }

    public function show(Property $property): JsonResponse
    {
        $property->load(['activeContract.tenant', 'photos', 'contracts' => fn ($q) => $q->with('tenant')->latest('start_date')]);
        $year = today()->year;
        $income = (float) Payment::query()
            ->whereHas('installment.contract', fn ($q) => $q->whereBelongsTo($property))
            ->whereYear('paid_on', $year)
            ->selectRaw('coalesce(sum(amount + late_fee), 0) as total')->value('total');
        $expenses = (float) $property->expenses()->whereYear('spent_on', $year)->sum('amount');
        $tickets = Ticket::query()->whereBelongsTo($property)->with('provider')->latest()->limit(20)->get();

        return response()->json([
            'data' => PropertyResource::make($property),
            'contracts' => $property->contracts->map(fn ($c) => [
                'id' => $c->id,
                'tenant' => $c->tenant->full_name,
                'start_date' => $c->start_date->toDateString(),
                'end_date' => $c->end_date->toDateString(),
                'rent_amount' => (float) $c->rent_amount,
                'status' => ['value' => $c->status->value, 'label' => $c->status->label()],
            ]),
            'tickets' => TicketResource::collection($tickets),
            'photos' => $property->photos->map(fn ($p) => ['id' => $p->id, 'url' => $p->url, 'caption' => $p->caption]),
            'year' => ['year' => $year, 'income' => round($income, 2), 'expenses' => round($expenses, 2), 'net' => round($income - $expenses, 2)],
        ]);
    }

    public function update(PropertyRequest $request, Property $property): PropertyResource
    {
        $property->update($request->validated());

        return PropertyResource::make($property);
    }

    public function destroy(Property $property): JsonResponse
    {
        abort_if($property->contracts()->exists(), 422, 'La propiedad tiene contratos asociados; cambiá su estado en lugar de borrarla.');
        DB::transaction(fn () => $property->delete());

        return response()->json(['ok' => true]);
    }
}
