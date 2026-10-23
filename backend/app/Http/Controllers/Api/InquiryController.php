<?php

namespace App\Http\Controllers\Api;

use App\Enums\InquiryOutcome;
use App\Enums\InquiryStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InquiryResource;
use App\Models\Colleague;
use App\Models\Inquiry;
use App\Services\WhatsApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Consultas que llegan desde La Choza: el dueño las atiende él o se las pasa a un colega.
 */
class InquiryController extends Controller
{
    public function __construct(private WhatsApp $whatsApp) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $inquiries = Inquiry::query()
            ->with(['listing.property', 'property.photos', 'colleague'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('property_id'), fn ($q, $id) => $q->where('property_id', $id))
            ->when($request->query('q'), function ($q, $term) {
                $like = '%'.mb_strtolower($term).'%';
                $q->where(fn ($w) => $w->whereRaw('lower(name) like ?', [$like])
                    ->orWhere('phone', 'like', $like)
                    ->orWhereHas('property', fn ($p) => $p->whereRaw('lower(code) like ?', [$like])->orWhereRaw('lower(street) like ?', [$like])));
            })
            ->orderByRaw("case status when 'nueva' then 0 when 'atendiendo' then 1 when 'derivada' then 2 else 3 end")
            ->latest()
            ->limit(200)
            ->get();

        return InquiryResource::collection($inquiries);
    }

    public function show(Inquiry $inquiry): JsonResponse
    {
        $inquiry->load(['listing.property', 'property.photos', 'colleague']);
        $others = Inquiry::query()
            ->where('id', '!=', $inquiry->id)
            ->where('phone', $inquiry->phone)
            ->with('listing.property')
            ->latest()->limit(10)->get();

        return response()->json([
            'data' => InquiryResource::make($inquiry),
            'suggested_colleague_id' => $this->suggestColleague($inquiry)?->id,
            'reply' => $this->whatsApp->inquiryReply($inquiry),
            'same_person' => InquiryResource::collection($others),
        ]);
    }

    public function update(Request $request, Inquiry $inquiry): InquiryResource
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::enum(InquiryStatus::class)],
            'outcome' => ['nullable', Rule::enum(InquiryOutcome::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (isset($data['outcome'])) {
            $data['status'] = InquiryStatus::Closed->value;
        }
        if (($data['status'] ?? null) === InquiryStatus::Closed->value) {
            $inquiry->closed_at ??= now();
        } elseif (isset($data['status'])) {
            $inquiry->closed_at = null;
            $data['outcome'] = null;
        }
        $inquiry->fill($data)->save();

        return InquiryResource::make($inquiry->load(['listing.property', 'property.photos', 'colleague']));
    }

    /**
     * "La atiendo yo": arma el WhatsApp al interesado y deja la consulta a cargo del dueño.
     */
    public function contact(Inquiry $inquiry): JsonResponse
    {
        $link = $this->whatsApp->inquiryReply($inquiry);
        $inquiry->forceFill([
            'status' => $inquiry->status === InquiryStatus::Closed ? InquiryStatus::Closed : InquiryStatus::InProgress,
            'colleague_id' => null,
            'contacted_at' => now(),
        ])->save();

        return response()->json([
            'data' => InquiryResource::make($inquiry->load(['listing.property', 'property.photos', 'colleague'])),
            'whatsapp' => $link,
        ]);
    }

    /**
     * Le pasa la consulta a un colega o vendedor con los datos ya escritos.
     */
    public function derive(Request $request, Inquiry $inquiry): JsonResponse
    {
        $data = $request->validate(['colleague_id' => ['required', Rule::exists('colleagues', 'id')]]);
        $colleague = Colleague::query()->findOrFail($data['colleague_id']);
        $link = $this->whatsApp->inquiryDerivation($inquiry, $colleague);

        $inquiry->forceFill([
            'status' => InquiryStatus::Derived,
            'colleague_id' => $colleague->id,
            'derived_at' => now(),
        ])->save();

        return response()->json([
            'data' => InquiryResource::make($inquiry->load(['listing.property', 'property.photos', 'colleague'])),
            'whatsapp' => $link,
        ]);
    }

    /**
     * El colega que mejor calza: el que ya la tiene, o el que trabaja ese barrio, ciudad o tipo de propiedad.
     */
    private function suggestColleague(Inquiry $inquiry): ?Colleague
    {
        if ($inquiry->colleague) {
            return $inquiry->colleague;
        }

        $property = $inquiry->listing->property;
        $words = array_filter([
            $inquiry->listing->neighborhood,
            $property->city,
            $property->type->value === 'galpon' ? 'galp' : null,
        ]);

        return Colleague::query()->where('active', true)->get()
            ->sortByDesc(function (Colleague $colleague) use ($words): int {
                $haystack = mb_strtolower($colleague->zone.' '.$colleague->notes.' '.$colleague->agency);

                return collect($words)->filter(fn (string $word) => str_contains($haystack, mb_strtolower($word)))->count();
            })
            ->first(fn (Colleague $colleague) => true);
    }
}
