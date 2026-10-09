<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Buscador global (Ctrl+K): unidades, inquilinos y reclamos.
 */
class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q'));
        if (mb_strlen($term) < 2) {
            return response()->json(['properties' => [], 'tenants' => [], 'tickets' => []]);
        }
        $like = '%'.mb_strtolower($term).'%';

        $properties = Property::query()
            ->with('activeContract.tenant')
            ->where(fn ($q) => $q->whereRaw('lower(code) like ?', [$like])
                ->orWhereRaw("lower(street || ' ' || number || ' ' || coalesce(unit, '')) like ?", [$like]))
            ->orderBy('code')->limit(6)->get()
            ->map(fn (Property $p) => [
                'id' => $p->id,
                'title' => $p->code,
                'subtitle' => $p->address.($p->activeContract ? ' · '.$p->activeContract->tenant->full_name : ' · '.$p->status->label()),
            ]);

        $tenants = Tenant::query()
            ->with('activeContract.property')
            ->where(fn ($q) => $q->whereRaw("lower(first_name || ' ' || coalesce(last_name, '')) like ?", [$like])
                ->orWhere('document', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%"))
            ->orderBy('last_name')->limit(6)->get()
            ->map(fn (Tenant $t) => [
                'id' => $t->id,
                'title' => $t->full_name,
                'subtitle' => ($t->activeContract?->property->code ?? 'Sin contrato').' · '.$t->phone,
            ]);

        $tickets = Ticket::query()
            ->with('property')
            ->where(fn ($q) => $q->whereRaw('lower(title) like ?', [$like])->orWhereRaw('lower(description) like ?', [$like]))
            ->latest()->limit(6)->get()
            ->map(fn (Ticket $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'subtitle' => $t->property->code.' · '.$t->status->label(),
            ]);

        return response()->json(['properties' => $properties, 'tenants' => $tenants, 'tickets' => $tickets]);
    }
}
