<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContactKind;
use App\Enums\ExpenseCategory;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\TicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\ContactLog;
use App\Models\Expense;
use App\Models\Property;
use App\Models\Provider;
use App\Models\Ticket;
use App\Services\WhatsApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tickets = Ticket::query()
            ->with(['property', 'tenant', 'provider'])
            ->when($request->query('status'), fn ($q, $s) => $s === 'abiertos' ? $q->open() : $q->where('status', $s))
            ->when($request->query('category'), fn ($q, $c) => $q->where('category', $c))
            ->when($request->query('property_id'), fn ($q, $id) => $q->where('property_id', $id))
            ->orderByRaw("case status when 'abierto' then 0 when 'derivado' then 1 when 'en_curso' then 2 else 3 end")
            ->orderByRaw("case priority when 'urgente' then 0 when 'alta' then 1 when 'media' then 2 else 3 end")
            ->latest()
            ->limit(300)
            ->get();

        return TicketResource::collection($tickets);
    }

    public function store(TicketRequest $request): TicketResource
    {
        $data = $request->safe()->except('photos');
        if (empty($data['tenant_id'])) {
            $data['tenant_id'] = Property::query()->find($data['property_id'])?->activeContract?->tenant_id;
        }
        $ticket = self::createWithPhotos($data, $request);

        return TicketResource::make($ticket->load(['property', 'tenant', 'photos']));
    }

    public function show(Ticket $ticket, WhatsApp $whatsApp): JsonResponse
    {
        $ticket->load(['property', 'tenant', 'provider', 'comments.user', 'photos']);

        $providers = Provider::query()->where('active', true)
            ->orderByRaw('case when trade = ? then 0 else 1 end', [$ticket->category->value])
            ->orderBy('name')
            ->get()
            ->map(fn (Provider $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'trade' => ['value' => $p->trade->value, 'label' => $p->trade->label()],
                'phone' => $p->phone,
                'matches' => $p->trade === $ticket->category,
                'whatsapp_url' => $whatsApp->derivation($ticket, $p)['url'],
            ]);

        return response()->json([
            'data' => TicketResource::make($ticket),
            'providers' => $providers,
            'tenant_whatsapp_url' => $ticket->tenant ? WhatsApp::link($ticket->tenant->phone, "Hola {$ticket->tenant->first_name}, te escribo por el reclamo #{$ticket->id} ({$ticket->title}).") : null,
        ]);
    }

    public function update(Request $request, Ticket $ticket): TicketResource
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::enum(TicketStatus::class)],
            'priority' => ['sometimes', Rule::enum(TicketPriority::class)],
            'cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'provider_id' => ['sometimes', 'nullable', 'exists:providers,id'],
        ]);

        if (($data['status'] ?? null) === TicketStatus::Resolved->value && ! $ticket->resolved_at) {
            $data['resolved_at'] = now();
        }
        if (isset($data['status']) && $data['status'] !== TicketStatus::Resolved->value) {
            $data['resolved_at'] = null;
        }
        $ticket->update($data);

        // El costo del arreglo queda como gasto de la unidad.
        if (array_key_exists('cost', $data)) {
            if ($ticket->cost) {
                Expense::query()->updateOrCreate(['ticket_id' => $ticket->id], [
                    'property_id' => $ticket->property_id,
                    'category' => ExpenseCategory::Repair,
                    'description' => "Reclamo #{$ticket->id}: {$ticket->title}",
                    'amount' => $ticket->cost,
                    'spent_on' => ($ticket->resolved_at ?? now())->toDateString(),
                ]);
            } else {
                Expense::query()->where('ticket_id', $ticket->id)->delete();
            }
        }

        return TicketResource::make($ticket->load(['property', 'tenant', 'provider']));
    }

    /**
     * Deriva el reclamo a un proveedor: lo asigna, cambia el estado y deja registro del WhatsApp.
     */
    public function derive(Request $request, Ticket $ticket, WhatsApp $whatsApp): JsonResponse
    {
        $data = $request->validate(['provider_id' => ['required', 'exists:providers,id']]);
        $provider = Provider::query()->findOrFail($data['provider_id']);
        $derivation = $whatsApp->derivation($ticket, $provider);

        DB::transaction(function () use ($ticket, $provider, $derivation, $request) {
            $ticket->update([
                'provider_id' => $provider->id,
                'status' => TicketStatus::Derived,
                'derived_at' => now(),
            ]);
            ContactLog::query()->create([
                'kind' => ContactKind::Derivation,
                'provider_id' => $provider->id,
                'tenant_id' => $ticket->tenant_id,
                'ticket_id' => $ticket->id,
                'phone' => $derivation['phone'],
                'message' => $derivation['message'],
            ]);
            $ticket->comments()->create([
                'user_id' => $request->user()->id,
                'body' => "Derivado a {$provider->name} ({$provider->trade->label()}).",
            ]);
        });

        return response()->json($derivation + ['ticket' => TicketResource::make($ticket->fresh(['property', 'tenant', 'provider']))]);
    }

    public function comment(Request $request, Ticket $ticket): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isAdmin() && $ticket->tenant_id !== $user->tenant_id, 403);
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);
        $comment = $ticket->comments()->create(['user_id' => $user->id, 'body' => $data['body']]);

        return response()->json([
            'id' => $comment->id,
            'body' => $comment->body,
            'author' => $user->name,
            'is_admin' => $user->isAdmin(),
            'created_at' => $comment->created_at->toIso8601String(),
        ], 201);
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function createWithPhotos(array $data, Request $request): Ticket
    {
        return DB::transaction(function () use ($data, $request) {
            $ticket = Ticket::query()->create($data + ['status' => TicketStatus::Open]);
            foreach ($request->file('photos', []) as $photo) {
                $ticket->photos()->create(['path' => $photo->store("tickets/{$ticket->id}", 'public')]);
            }

            return $ticket;
        });
    }
}
