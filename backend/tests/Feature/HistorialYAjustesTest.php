<?php

namespace Tests\Feature;

use App\Enums\AdjustmentType;
use App\Enums\PropertyStatus;
use App\Enums\UserRole;
use App\Models\ChangeLog;
use App\Models\Contract;
use App\Models\IndexValue;
use App\Models\Property;
use App\Models\User;
use App\Services\Indices;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HistorialYAjustesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-23 10:00:00');
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => UserRole::Admin, 'name' => 'Administración']);
        Sanctum::actingAs($admin);

        return $admin;
    }

    public function test_editing_a_property_records_what_changed_with_readable_values(): void
    {
        $this->actingAsAdmin();
        $property = Property::factory()->create(['code' => 'AZC-8', 'status' => PropertyStatus::Available, 'rooms' => 2]);

        $this->putJson("/api/properties/{$property->id}", [
            ...$property->only(['code', 'street', 'number', 'unit', 'city', 'surface_m2', 'notes']),
            'type' => $property->type->value,
            'status' => PropertyStatus::Maintenance->value,
            'rooms' => 3,
        ])->assertOk();

        $this->getJson("/api/history/properties/{$property->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.event', 'cambio')
            ->assertJsonPath('data.0.user', 'Administración')
            ->assertJsonPath('data.0.changes', [
                ['label' => 'Ambientes', 'from' => '2', 'to' => '3'],
                ['label' => 'Estado', 'from' => PropertyStatus::Available->label(), 'to' => PropertyStatus::Maintenance->label()],
            ])
            ->assertJsonPath('data.1.event', 'alta');

        $this->getJson('/api/activity')
            ->assertJsonPath('data.0.kind', 'cambio')
            ->assertJsonPath('data.0.title', 'Cambios en la propiedad AZC-8')
            ->assertJsonPath('data.0.href', "/admin/propiedades/{$property->id}");
    }

    public function test_listing_changes_go_to_the_property_history(): void
    {
        $this->actingAsAdmin();
        $property = Property::factory()->create();
        $payload = ['headline' => 'Dos ambientes', 'for_sale' => false, 'for_rent' => true, 'rent_price' => 650000, 'published' => true];

        $this->putJson("/api/properties/{$property->id}/listing", $payload)->assertOk();
        $this->putJson("/api/properties/{$property->id}/listing", [...$payload, 'rent_price' => 720000])->assertOk();

        $this->getJson("/api/history/properties/{$property->id}")
            ->assertJsonPath('data.0.changes', [['label' => 'Publicación · Precio de alquiler', 'from' => '$ 650.000', 'to' => '$ 720.000']])
            ->assertJsonPath('data.1.changes.0.to', 'Creada');
    }

    public function test_changes_made_without_a_session_are_not_recorded(): void
    {
        Property::factory()->create()->update(['rooms' => 9]);

        $this->assertDatabaseCount(ChangeLog::class, 0);
    }

    public function test_the_command_brings_icl_from_bcra_and_ipc_from_indec(): void
    {
        Http::fake([
            'api.bcra.gob.ar/*' => Http::response(['status' => 200, 'results' => [['idVariable' => 40, 'detalle' => [
                ['fecha' => '2026-10-22', 'valor' => 37.0], ['fecha' => '2026-10-23', 'valor' => 37.02],
            ]]]]),
            'apis.datos.gob.ar/*' => Http::response(['data' => [['2026-07-01', 12076.39], ['2026-08-01', 12276.77], ['2026-09-01', null]]]),
        ]);

        $this->artisan('indices:actualizar')->assertSuccessful();

        $this->assertSame(2, IndexValue::query()->where('index', 'icl')->count());
        $this->assertSame(2, IndexValue::query()->where('index', 'ipc')->count(), 'el mes sin publicar no se guarda');
        Http::assertSent(fn ($request) => str_contains($request->url(), Indices::IPC_SERIES));
    }

    public function test_a_due_icl_adjustment_is_suggested_and_disappears_once_applied(): void
    {
        $this->actingAsAdmin();
        $contract = Contract::factory()->create([
            'start_date' => '2026-04-01', 'end_date' => '2028-03-31',
            'rent_amount' => 1000000, 'adjustment_type' => AdjustmentType::Icl, 'adjustment_every_months' => 6,
        ]);
        IndexValue::query()->create(['index' => 'icl', 'date' => '2026-04-01', 'value' => 10]);
        IndexValue::query()->create(['index' => 'icl', 'date' => '2026-10-01', 'value' => 11.5]);

        $this->getJson('/api/adjustments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.from_period', '2026-10')
            ->assertJsonPath('data.0.percentage', 15)
            ->assertJsonPath('data.0.new_amount', 1150000)
            ->assertJsonPath('data.0.provisional', false)
            ->assertJsonPath('data.0.basis', 'ICL 01/04/2026 → 01/10/2026');

        $this->postJson("/api/contracts/{$contract->id}/adjust", [
            'new_amount' => 1150000, 'from_period' => '2026-10', 'basis' => 'ICL 01/04/2026 → 01/10/2026',
        ])->assertOk()->assertJsonPath('data.rent_amount', 1150000);

        $this->getJson('/api/adjustments')->assertJsonCount(0, 'data');
        $this->getJson("/api/contracts/{$contract->id}")
            ->assertJsonPath('data.adjustments.0.percentage', 15)
            ->assertJsonPath('data.adjustments.0.previous_amount', 1000000)
            ->assertJsonPath('suggested_adjustment', null);
        $this->getJson("/api/history/contracts/{$contract->id}")
            ->assertJsonPath('data.0.changes.0', ['label' => 'Alquiler', 'from' => '$ 1.000.000', 'to' => '$ 1.150.000']);
    }

    public function test_ipc_uses_the_last_published_month_and_flags_it_when_it_is_older(): void
    {
        $this->actingAsAdmin();
        Contract::factory()->create([
            'start_date' => '2026-08-01', 'end_date' => '2028-07-31',
            'rent_amount' => 800000, 'adjustment_type' => AdjustmentType::Ipc, 'adjustment_every_months' => 3,
        ]);
        IndexValue::query()->create(['index' => 'ipc', 'date' => '2026-06-01', 'value' => 100]);
        IndexValue::query()->create(['index' => 'ipc', 'date' => '2026-08-01', 'value' => 104]);

        // Ajuste del 1/11: base junio (agosto − 2), objetivo septiembre (noviembre − 2), que todavía no salió.
        $this->getJson('/api/adjustments')
            ->assertJsonPath('data.0.date', '2026-11-01')
            ->assertJsonPath('data.0.percentage', 4)
            ->assertJsonPath('data.0.new_amount', 832000)
            ->assertJsonPath('data.0.provisional', true);
    }

    public function test_any_listing_can_be_exported_to_excel_as_it_is_seen(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/exports/table', [
            'title' => 'Propiedades',
            'columns' => [['label' => 'Código'], ['label' => 'Alquiler', 'type' => 'money']],
            'rows' => [['AZC-8', 720000], ['HUM-3', null]],
        ])->assertOk();

        $this->assertSame('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('propiedades-2026-10-23.xlsx', $response->headers->get('Content-Disposition'));
    }
}
