<?php

namespace App\Http\Controllers\Api;

use App\Enums\DocumentKind;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Documentos de cada contrato (contrato firmado, DNI, garantía…). Se guardan en disco privado.
 */
class ContractDocumentController extends Controller
{
    public function index(Contract $contract): JsonResponse
    {
        return response()->json(['data' => $contract->documents->map(fn (ContractDocument $d) => self::present($d))]);
    }

    public function store(Request $request, Contract $contract): JsonResponse
    {
        $data = $request->validate([
            'kind' => ['required', Rule::enum(DocumentKind::class)],
            'name' => ['nullable', 'string', 'max:120'],
            'expires_on' => ['nullable', 'date'],
            'file' => ['required', 'file', 'max:15360', 'mimes:pdf,jpg,jpeg,png,webp,heic,doc,docx'],
        ]);
        $file = $request->file('file');

        $document = $contract->documents()->create([
            'kind' => $data['kind'],
            'name' => ($data['name'] ?? null) ?: $file->getClientOriginalName(),
            'path' => $file->store("contracts/{$contract->id}", 'local'),
            'mime' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
            'expires_on' => $data['expires_on'] ?? null,
        ]);

        return response()->json(['data' => self::present($document)], 201);
    }

    public function download(ContractDocument $document): StreamedResponse
    {
        $extension = pathinfo($document->path, PATHINFO_EXTENSION);
        $name = str($document->name)->endsWith('.'.$extension) ? $document->name : $document->name.'.'.$extension;

        return Storage::disk('local')->response($document->path, $name);
    }

    public function destroy(ContractDocument $document): JsonResponse
    {
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(ContractDocument $d): array
    {
        return [
            'id' => $d->id,
            'kind' => ['value' => $d->kind->value, 'label' => $d->kind->label()],
            'name' => $d->name,
            'mime' => $d->mime,
            'size' => $d->size,
            'expires_on' => $d->expires_on?->toDateString(),
            'days_to_expire' => $d->expires_on ? (int) today()->diffInDays($d->expires_on, false) : null,
            'created_at' => $d->created_at->toIso8601String(),
            'file_url' => '/api/backend/documents/'.$d->id.'/file',
        ];
    }
}
