<?php

namespace Tests\Feature;

use App\Enums\InstallmentStatus;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Models\Contract;
use App\Models\Installment;
use App\Models\Provider;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Billing;
use App\Services\WhatsApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TimbreApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-09 10:00:00');
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    public function test_login_returns_a_token_and_rejects_bad_passwords(): void
    {
        User::factory()->create(['email' => 'admin@timbre.test', 'password' => 'secreto123', 'role' => UserRole::Admin]);

        $this->postJson('/api/login', ['email' => 'admin@timbre.test', 'password' => 'mal'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => 'admin@timbre.test', 'password' => 'secreto123'])
            ->assertOk()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonStructure(['token']);
    }

    public function test_creating_a_contract_generates_installments_and_marks_overdue_ones(): void
    {
        $this->actingAsAdmin();
        $contract = Contract::factory()->make();

        $this->postJson('/api/contracts', $contract->only(['property_id', 'tenant_id', 'rent_amount', 'due_day', 'adjustment_type', 'adjustment_every_months', 'late_fee_daily_pct']) + [
            'start_date' => '2026-08-01',
            'end_date' => '2028-07-31',
            'adjustment_type' => 'icl',
        ])->assertCreated();

        $installments = Installment::query()->orderBy('period')->get();
        $this->assertCount(3, $installments);
        $this->assertSame(InstallmentStatus::Overdue, $installments[0]->status);
        $this->assertSame(InstallmentStatus::Pending, $installments[2]->status);
    }

    public function test_partial_and_full_payments_update_the_installment_and_number_receipts(): void
    {
        $this->actingAsAdmin();
        $contract = Contract::factory()->create();
        app(Billing::class)->generateForContract($contract);
        $installment = $contract->installments()->whereDate('period', '2026-10-01')->first();

        $this->postJson("/api/installments/{$installment->id}/payments", ['amount' => 300000, 'paid_on' => '2026-10-05', 'method' => 'transferencia'])
            ->assertCreated()
            ->assertJsonPath('data.receipt_number', 1);
        $this->assertSame(InstallmentStatus::Partial, $installment->fresh()->status);

        $this->postJson("/api/installments/{$installment->id}/payments", ['amount' => 500000, 'paid_on' => '2026-10-06', 'method' => 'efectivo'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount');

        $this->postJson("/api/installments/{$installment->id}/payments", ['amount' => 400000, 'paid_on' => '2026-10-06', 'method' => 'efectivo'])
            ->assertCreated()
            ->assertJsonPath('data.receipt_number', 2);
        $this->assertSame(InstallmentStatus::Paid, $installment->fresh()->status);
    }

    public function test_late_fee_accrues_daily_on_overdue_balance(): void
    {
        $contract = Contract::factory()->create(['rent_amount' => 1000000, 'late_fee_daily_pct' => 0.1]);
        $installment = Installment::query()->create([
            'contract_id' => $contract->id,
            'period' => '2026-09-01',
            'due_date' => '2026-09-29',
            'amount' => 1000000,
        ]);

        $this->assertSame(10, $installment->daysLate());
        $this->assertSame(10000.0, $installment->lateFee());
    }

    public function test_ledger_lists_debtors_first_with_a_whatsapp_link(): void
    {
        $this->actingAsAdmin();
        $upToDate = Contract::factory()->create();
        $debtor = Contract::factory()->create();
        $billing = app(Billing::class);
        $billing->generateForContract($upToDate);
        $billing->generateForContract($debtor);
        $billing->refreshStatuses();
        $upToDate->installments()->where('period', '<', '2026-10-01')->get()
            ->each(fn ($i) => $billing->registerPayment($i, ['amount' => $i->balance(), 'paid_on' => $i->due_date->toDateString(), 'method' => 'efectivo']));

        $response = $this->getJson('/api/ledger?period=2026-10')->assertOk();

        $response->assertJsonPath('rows.0.contract_id', $debtor->id)
            ->assertJsonPath('totals.debtors', 1);
        $this->assertStringStartsWith('https://wa.me/549', $response->json('rows.0.whatsapp_url'));
        $this->assertNull($response->json('rows.1.whatsapp_url'));

        // La cuota de octubre (vence el 10) todavía no está vencida: no entra en lo adeudado.
        $this->assertEqualsWithDelta($response->json('rows.0.overdue_due'), $response->json('totals.owed'), 0.01);
        $this->assertEqualsWithDelta($response->json('rows.0.total_due') - 700000, $response->json('totals.owed'), 0.01);
    }

    public function test_deriving_a_ticket_assigns_the_provider_and_builds_the_message(): void
    {
        $this->actingAsAdmin();
        $contract = Contract::factory()->create();
        $ticket = Ticket::factory()->create(['property_id' => $contract->property_id, 'tenant_id' => $contract->tenant_id]);
        $provider = Provider::factory()->create(['name' => 'Rubén']);

        $response = $this->postJson("/api/tickets/{$ticket->id}/derive", ['provider_id' => $provider->id])->assertOk();

        $this->assertSame(TicketStatus::Derived, $ticket->fresh()->status);
        $this->assertSame($provider->id, $ticket->fresh()->provider_id);
        $this->assertStringContainsString('Hola Rubén', $response->json('message'));
        $this->assertStringContainsString('Pierde la llave de paso', $response->json('message'));
        $this->assertDatabaseHas('contact_logs', ['ticket_id' => $ticket->id, 'kind' => 'derivacion']);
    }

    public function test_tenants_only_see_their_own_data_and_cannot_reach_admin_routes(): void
    {
        $mine = Contract::factory()->create();
        $other = Contract::factory()->create();
        Ticket::factory()->create(['property_id' => $other->property_id, 'tenant_id' => $other->tenant_id, 'title' => 'Ajeno']);
        $user = User::factory()->create(['role' => UserRole::Tenant, 'tenant_id' => $mine->tenant_id]);
        Sanctum::actingAs($user);

        $this->getJson('/api/ledger')->assertForbidden();
        $this->getJson('/api/portal/summary')->assertOk()->assertJsonPath('contract.id', $mine->id);

        $this->postJson('/api/portal/tickets', [
            'title' => 'No anda el termotanque',
            'description' => 'No calienta.',
            'category' => 'gas',
            'priority' => 'alta',
        ])->assertCreated()->assertJsonPath('data.property.id', $mine->property_id);

        $titles = collect($this->getJson('/api/portal/tickets')->json('data'))->pluck('title');
        $this->assertSame(['No anda el termotanque'], $titles->all());
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function phones(): array
    {
        return [
            'CABA con guión' => ['11 5555-1234', '5491155551234'],
            'con 0 y 15' => ['011 15 5555-1234', '5491155551234'],
            'ya internacional' => ['+54 9 11 5555 1234', '5491155551234'],
            'interior' => ['0351 155-123456', '5493515123456'],
        ];
    }

    #[DataProvider('phones')]
    public function test_argentine_phones_are_normalized_for_whatsapp(string $input, string $expected): void
    {
        $this->assertSame($expected, WhatsApp::normalizePhone($input));
    }

    public function test_admin_can_give_a_tenant_portal_access(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/tenants', [
            'first_name' => 'Ana',
            'last_name' => 'Paz',
            'document' => '30111222',
            'phone' => '11 4444-5555',
            'email' => 'ana@mail.test',
            'create_portal_access' => true,
            'portal_password' => 'clave-segura',
        ])->assertCreated()->assertJsonPath('data.has_portal_access', true);

        $tenant = Tenant::query()->where('document', '30111222')->first();
        $this->assertSame(UserRole::Tenant, $tenant->user->role);
    }
}
