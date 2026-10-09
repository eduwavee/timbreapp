<?php

namespace Tests\Feature;

use App\Enums\InstallmentStatus;
use App\Enums\ProofStatus;
use App\Enums\UserRole;
use App\Models\Contract;
use App\Models\Expense;
use App\Models\PaymentProof;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Billing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TimbreV2Test extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-09 10:00:00');
        Storage::fake('local');
        Storage::fake('public');
    }

    private function contractWithInstallments(): Contract
    {
        $contract = Contract::factory()->create();
        app(Billing::class)->generateForContract($contract);
        app(Billing::class)->refreshStatuses();

        return $contract;
    }

    public function test_tenant_uploads_a_proof_and_admin_approval_registers_the_payment(): void
    {
        $contract = $this->contractWithInstallments();
        $installment = $contract->installments()->where('status', InstallmentStatus::Overdue)->first();
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Tenant, 'tenant_id' => $contract->tenant_id]));

        $this->postJson('/api/portal/proofs', [
            'installment_id' => $installment->id,
            'amount' => 700000,
            'paid_on' => '2026-10-08',
            'method' => 'transferencia',
            'file' => UploadedFile::fake()->image('comprobante.jpg'),
        ])->assertCreated()->assertJsonPath('data.status.value', 'pendiente');

        $this->postJson('/api/portal/proofs', [
            'installment_id' => $installment->id, 'amount' => 1, 'paid_on' => '2026-10-08', 'method' => 'transferencia',
            'file' => UploadedFile::fake()->image('otra.jpg'),
        ])->assertUnprocessable()->assertJsonValidationErrors('installment_id');

        $proof = PaymentProof::query()->first();
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $this->getJson('/api/ledger?period=2026-10')->assertJsonPath('rows.0.pending_proofs', 1);

        $this->postJson("/api/proofs/{$proof->id}/approve")->assertOk()->assertJsonPath('data.status.value', 'aprobado');

        $this->assertSame(InstallmentStatus::Paid, $installment->fresh()->status);
        // Informó 700.000 por una cuota de 700.000: no hay mora.
        $this->assertSame(0.0, (float) $proof->fresh()->payment->late_fee);
        $this->assertNotNull($proof->fresh()->payment_id);
        $this->postJson("/api/proofs/{$proof->id}/approve")->assertUnprocessable();
    }

    public function test_tenants_cannot_send_proofs_for_someone_elses_installment_or_see_others_files(): void
    {
        $mine = $this->contractWithInstallments();
        $other = $this->contractWithInstallments();
        $foreign = $other->installments()->first();
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Tenant, 'tenant_id' => $mine->tenant_id]));

        $this->postJson('/api/portal/proofs', [
            'installment_id' => $foreign->id, 'amount' => 1000, 'paid_on' => '2026-10-08', 'method' => 'efectivo',
            'file' => UploadedFile::fake()->image('x.jpg'),
        ])->assertUnprocessable();

        $proof = PaymentProof::query()->create([
            'installment_id' => $foreign->id, 'tenant_id' => $other->tenant_id, 'amount' => 1, 'paid_on' => '2026-10-08',
            'method' => 'efectivo', 'path' => 'proofs/x.png', 'status' => ProofStatus::Pending,
        ]);
        $this->get("/api/proofs/{$proof->id}/file")->assertForbidden();
    }

    public function test_ticket_cost_becomes_an_expense_and_counts_in_profitability(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $ticket = Ticket::factory()->create();

        $this->putJson("/api/tickets/{$ticket->id}", ['status' => 'resuelto', 'cost' => 45000])->assertOk();
        $this->assertDatabaseHas('expenses', ['ticket_id' => $ticket->id, 'amount' => 45000, 'category' => 'arreglo']);

        $this->putJson("/api/tickets/{$ticket->id}", ['cost' => 52000])->assertOk();
        $this->assertSame(1, Expense::query()->count());

        $this->getJson('/api/profitability?year=2026')->assertOk()->assertJsonPath('totals.expenses', 52000);
    }

    public function test_search_finds_units_tenants_and_tickets(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $contract = Contract::factory()->create();
        $contract->property->update(['code' => 'AZC-8']);
        $contract->tenant->update(['last_name' => 'Pereyra']);
        Ticket::factory()->create(['property_id' => $contract->property_id, 'title' => 'Pierde la llave de paso']);

        $this->getJson('/api/search?q=azc')->assertJsonPath('properties.0.title', 'AZC-8');
        $this->getJson('/api/search?q=pereyra')->assertJsonCount(1, 'tenants');
        $this->getJson('/api/search?q=llave')->assertJsonPath('tickets.0.title', 'Pierde la llave de paso');
    }

    public function test_documents_are_private_and_show_up_in_the_agenda_when_they_expire(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $contract = Contract::factory()->create();

        $id = $this->post("/api/contracts/{$contract->id}/documents", [
            'kind' => 'garantia',
            'expires_on' => '2026-10-20',
            'file' => UploadedFile::fake()->create('caucion.pdf', 120, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated()->json('data.id');

        $this->get("/api/documents/{$id}/file")->assertOk();
        $kinds = collect($this->getJson('/api/agenda?month=2026-10')->json('events'))->pluck('kind');
        $this->assertContains('documento', $kinds);

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Tenant, 'tenant_id' => $contract->tenant_id]));
        $this->get("/api/documents/{$id}/file")->assertForbidden();
    }

    public function test_month_export_is_an_excel_file(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $this->contractWithInstallments();

        $response = $this->get('/api/exports/month?month=2026-10');

        $response->assertOk()->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
