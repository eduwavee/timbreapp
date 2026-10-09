<?php

namespace App\Http\Controllers\Api;

use App\Enums\ExpenseCategory;
use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['month' => ['nullable', 'date_format:Y-m'], 'year' => ['nullable', 'digits:4']]);

        $expenses = Expense::query()
            ->with('property')
            ->when($request->query('month'), fn ($q, $m) => $q->whereBetween('spent_on', [$m.'-01', date('Y-m-t', strtotime($m.'-01'))]))
            ->when($request->query('year'), fn ($q, $y) => $q->whereYear('spent_on', $y))
            ->when($request->query('property_id'), fn ($q, $id) => $q->where('property_id', $id))
            ->when($request->query('category'), fn ($q, $c) => $q->where('category', $c))
            ->latest('spent_on')->latest('id')
            ->limit(500)
            ->get();

        return response()->json(['data' => $expenses->map(fn (Expense $e) => self::present($e))]);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['data' => self::present(Expense::query()->create($this->validated($request))->load('property'))], 201);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $expense->update($this->validated($request));

        return response()->json(['data' => self::present($expense->load('property'))]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'property_id' => ['required', 'exists:properties,id'],
            'category' => ['required', Rule::enum(ExpenseCategory::class)],
            'description' => ['required', 'string', 'max:200'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'spent_on' => ['required', 'date', 'before_or_equal:today'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(Expense $e): array
    {
        return [
            'id' => $e->id,
            'property' => ['id' => $e->property->id, 'code' => $e->property->code, 'address' => $e->property->address],
            'category' => ['value' => $e->category->value, 'label' => $e->category->label()],
            'description' => $e->description,
            'amount' => (float) $e->amount,
            'spent_on' => $e->spent_on->toDateString(),
            'ticket_id' => $e->ticket_id,
        ];
    }
}
