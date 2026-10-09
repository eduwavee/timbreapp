<?php

namespace Database\Seeders;

use App\Enums\AdjustmentType;
use App\Enums\ContactKind;
use App\Enums\ContractStatus;
use App\Enums\DocumentKind;
use App\Enums\ExpenseCategory;
use App\Enums\InstallmentStatus;
use App\Enums\PaymentMethod;
use App\Enums\ProofStatus;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\Trade;
use App\Enums\UserRole;
use App\Models\ContactLog;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\Expense;
use App\Models\Installment;
use App\Models\PaymentProof;
use App\Models\Property;
use App\Models\Provider;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Billing;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Datos ficticios de demostración (no son clientes reales).
 * Los teléfonos usan la serie inexistente 11 0000-xxxx para que ningún WhatsApp de prueba le llegue a un desconocido.
 */
class DatabaseSeeder extends Seeder
{
    public function run(Billing $billing): void
    {
        mt_srand(2026);
        fake()->seed(2026);

        User::query()->create([
            'name' => 'Administración',
            'email' => 'admin@timbre.test',
            'password' => 'timbre2026',
            'role' => UserRole::Admin,
        ]);

        foreach ([
            'owner_name' => 'Administración Timbre',
            'owner_phone' => '11 0000-9001',
            'bank_alias' => 'TIMBRE.ALQUILER.MP',
        ] as $key => $value) {
            Setting::query()->create(['key' => $key, 'value' => $value]);
        }

        $providers = collect([
            ['Rubén Ocampo', Trade::Plumbing, '11 0000-9002', 'Llega en el día para urgencias.'],
            ['Hidro Sur — Marcelo Paz', Trade::Plumbing, '11 0000-9003', null],
            ['Electro Nico', Trade::Electrical, '11 0000-9004', 'Matriculado. Hace certificados.'],
            ['Gasista Daniel Ferreyra', Trade::Gas, '11 0000-9005', 'Matrícula Metrogas 2245.'],
            ['Cerrajería El Candado', Trade::Locksmith, '11 0000-9006', '24 hs.'],
            ['Pinturas Gómez', Trade::Painting, '11 0000-9007', null],
            ['Construcciones Ledesma', Trade::Masonry, '11 0000-9008', 'Techos y humedad.'],
            ['Don Tito (mantenimiento)', Trade::General, '11 0000-9009', 'Arreglos chicos.'],
        ])->map(fn ($p) => Provider::query()->create(['name' => $p[0], 'trade' => $p[1], 'phone' => $p[2], 'notes' => $p[3]]));

        // [calle, número, unidad, tipo, m2, ambientes, ciudad]
        $units = [
            ['Azcuénaga', '1250', '8', PropertyType::Apartment, 48, 2, 'CABA'],
            ['Azcuénaga', '1250', '3', PropertyType::Apartment, 52, 2, 'CABA'],
            ['Azcuénaga', '1250', '5', PropertyType::Apartment, 38, 1, 'CABA'],
            ['Billinghurst', '845', '2B', PropertyType::Apartment, 61, 3, 'CABA'],
            ['Billinghurst', '845', '4A', PropertyType::Apartment, 55, 2, 'CABA'],
            ['Gurruchaga', '1980', null, PropertyType::House, 140, 4, 'CABA'],
            ['Humahuaca', '3721', '1', PropertyType::Apartment, 42, 2, 'CABA'],
            ['Humahuaca', '3721', '2', PropertyType::Apartment, 42, 2, 'CABA'],
            ['Humahuaca', '3721', '3', PropertyType::Apartment, 65, 3, 'CABA'],
            ['Bulnes', '1544', '6C', PropertyType::Apartment, 36, 1, 'CABA'],
            ['Juncal', '2410', '9A', PropertyType::Apartment, 78, 3, 'CABA'],
            ['Paraguay', '3302', '5D', PropertyType::Apartment, 44, 2, 'CABA'],
            ['Thames', '1102', null, PropertyType::House, 165, 5, 'CABA'],
            ['Malabia', '960', '1', PropertyType::Apartment, 50, 2, 'CABA'],
            ['Malabia', '960', '2', PropertyType::Apartment, 50, 2, 'CABA'],
            ['Charcas', '4180', '7B', PropertyType::Apartment, 58, 2, 'CABA'],
            ['Av. Corrientes', '5320', '11F', PropertyType::Apartment, 40, 1, 'CABA'],
            ['Yerbal', '2215', null, PropertyType::House, 120, 4, 'CABA'],
            ['Directorio', '1876', '3A', PropertyType::Apartment, 47, 2, 'CABA'],
            ['Boyacá', '640', null, PropertyType::House, 98, 3, 'CABA'],
            ['Pedro Goyena', '1120', '4B', PropertyType::Apartment, 63, 3, 'CABA'],
            ['Avellaneda', '3044', '1', PropertyType::Apartment, 39, 1, 'CABA'],
            ['Avellaneda', '3044', '2', PropertyType::Apartment, 39, 1, 'CABA'],
            ['Nazca', '2290', null, PropertyType::House, 150, 4, 'CABA'],
            ['Cuenca', '3555', '2C', PropertyType::Apartment, 54, 2, 'CABA'],
            ['San Blas', '2701', null, PropertyType::House, 110, 3, 'CABA'],
            ['Larrazábal', '1430', null, PropertyType::Warehouse, 620, null, 'CABA'],
            ['Iriarte', '2850', null, PropertyType::Warehouse, 900, null, 'CABA'],
            ['Pinzón', '1290', null, PropertyType::Warehouse, 450, null, 'CABA'],
            ['Av. Mitre', '4420', null, PropertyType::Warehouse, 1200, null, 'Avellaneda'],
            ['Alsina', '311', null, PropertyType::Warehouse, 780, null, 'Avellaneda'],
            ['Uruguay', '1420', '1', PropertyType::Apartment, 45, 2, 'Avellaneda'],
            ['Uruguay', '1420', '2', PropertyType::Apartment, 45, 2, 'Avellaneda'],
            ['Las Heras', '880', null, PropertyType::House, 130, 4, 'Lanús'],
            ['Sarmiento', '1503', '3', PropertyType::Apartment, 51, 2, 'Lanús'],
            ['Ituzaingó', '760', null, PropertyType::Warehouse, 540, null, 'Lanús'],
        ];

        $properties = collect($units)->map(function ($u) {
            $prefix = mb_strtoupper(mb_substr(str_replace(['Av. ', 'á', 'é', 'í', 'ó', 'ú'], ['', 'a', 'e', 'i', 'o', 'u'], $u[0]), 0, 3));
            $code = $prefix.'-'.($u[2] ?? $u[1]);

            return Property::query()->create([
                'code' => $code,
                'street' => $u[0],
                'number' => $u[1],
                'unit' => $u[2],
                'type' => $u[3],
                'surface_m2' => $u[4],
                'rooms' => $u[5],
                'city' => $u[6],
                'status' => PropertyStatus::Available,
            ]);
        });

        // Las cuatro sin alquilar: dos libres y dos en mantenimiento.
        $vacant = [2, 16, 25, 33];
        $properties[16]->update(['status' => PropertyStatus::Maintenance, 'notes' => 'Pintura y cambio de piso flotante.']);
        $properties[33]->update(['status' => PropertyStatus::Maintenance, 'notes' => 'Reparación de techo.']);

        $people = [
            ['Juan', 'Pereyra'], ['Lucía', 'Fernández'], ['Martín', 'Sosa'], ['Camila', 'Rodríguez'], ['Diego', 'Benítez'],
            ['Valentina', 'Acosta'], ['Facundo', 'Romero'], ['Sofía', 'Medina'], ['Nicolás', 'Herrera'], ['Agustina', 'Giménez'],
            ['Matías', 'Álvarez'], ['Florencia', 'Castro'], ['Tomás', 'Domínguez'], ['Micaela', 'Vega'], ['Gonzalo', 'Ríos'],
            ['Julieta', 'Molina'], ['Federico', 'Ortiz'], ['Carolina', 'Suárez'], ['Pablo', 'Navarro'], ['Rocío', 'Luna'],
            ['Ezequiel', 'Cabrera'], ['Antonella', 'Ruiz'], ['Leandro', 'Morales'], ['Brenda', 'Quiroga'], ['Hernán', 'Ibarra'],
            ['Milagros', 'Paz'], ['Logística Sur SRL', ''], ['Maderera Iriarte SA', ''], ['Textil Pinzón SRL', ''],
            ['Distribuidora Mitre SA', ''], ['Talleres Alsina SRL', ''], ['Marcos', 'Villalba'],
        ];

        $today = Carbon::parse('2026-10-09');
        $tenantIndex = 0;
        $debtors = [3 => 3, 7 => 2, 11 => 2, 19 => 2, 28 => 3, 0 => 2];

        foreach ($properties as $i => $property) {
            if (in_array($i, $vacant, true)) {
                continue;
            }
            [$first, $last] = $people[$tenantIndex];
            $isCompany = $last === '';
            $tenant = Tenant::query()->create([
                'first_name' => $first,
                'last_name' => $last,
                'document' => $isCompany ? '30-'.mt_rand(50000000, 79999999).'-'.mt_rand(1, 9) : (string) mt_rand(25000000, 44999999),
                'phone' => '11 0000-'.str_pad((string) ($tenantIndex + 100), 4, '0', STR_PAD_LEFT),
                'email' => mb_strtolower(str_replace([' ', 'á', 'é', 'í', 'ó', 'ú'], ['.', 'a', 'e', 'i', 'o', 'u'], trim($first.'.'.$last, '.'))).'@mail.test',
                'guarantor_name' => $isCompany ? null : fake()->firstName().' '.fake()->lastName(),
                'guarantor_phone' => $isCompany ? null : '11 0000-'.str_pad((string) ($tenantIndex + 500), 4, '0', STR_PAD_LEFT),
            ]);
            $tenantIndex++;

            $base = match ($property->type) {
                PropertyType::Warehouse => mt_rand(250, 450) * 10000,
                PropertyType::House => mt_rand(110, 160) * 10000,
                PropertyType::Apartment => mt_rand(55, 90) * 10000,
            };
            $start = $today->copy()->subMonths(mt_rand(4, 22))->startOfMonth();
            $contract = Contract::query()->create([
                'property_id' => $property->id,
                'tenant_id' => $tenant->id,
                'start_date' => $start,
                'end_date' => $start->copy()->addYears(2)->subDay(),
                'rent_amount' => $base,
                'due_day' => $property->type === PropertyType::Warehouse ? 5 : 10,
                'adjustment_type' => $property->type === PropertyType::Warehouse ? AdjustmentType::Ipc : AdjustmentType::Icl,
                'adjustment_every_months' => $property->type === PropertyType::Warehouse ? 3 : 6,
                'deposit' => $base,
                'late_fee_daily_pct' => 0.1,
                'status' => ContractStatus::Active,
            ]);
            $property->update(['status' => PropertyStatus::Occupied]);

            $billing->generateForContract($contract, $today);
            $owedMonths = $debtors[$i] ?? 0;

            $contract->installments()->get()->each(function (Installment $inst) use ($billing, $today, $owedMonths, $i) {
                $monthsAgo = (int) $inst->period->diffInMonths($today->copy()->startOfMonth());
                // Cuota de este mes (vence el 10): algunos ya pagaron.
                if ($monthsAgo === 0) {
                    if ($inst->due_date->lt($today) && $owedMonths === 0) {
                        $this->pay($billing, $inst, $inst->due_date->copy()->subDays(mt_rand(0, 3)));
                    } elseif ($owedMonths === 0 && mt_rand(0, 2) === 0) {
                        $this->pay($billing, $inst, $today->copy()->subDays(mt_rand(0, 6)));
                    }

                    return;
                }
                if ($monthsAgo < $owedMonths) {
                    if ($i === 11 && $monthsAgo === 1) {
                        $billing->registerPayment($inst, ['amount' => round((float) $inst->amount * 0.4, 2), 'paid_on' => $inst->due_date->copy()->addDays(5)->toDateString(), 'method' => 'transferencia', 'late_fee' => 0]);
                    }

                    return;
                }
                $late = mt_rand(0, 9) === 0 ? mt_rand(2, 12) : -mt_rand(0, 4);
                $this->pay($billing, $inst, $inst->due_date->copy()->addDays($late));
            });

            if ($tenant->first_name === 'Juan') {
                User::query()->create([
                    'name' => $tenant->full_name,
                    'email' => 'juan@timbre.test',
                    'password' => 'timbre2026',
                    'role' => UserRole::Tenant,
                    'tenant_id' => $tenant->id,
                ]);
                $tenant->update(['email' => 'juan@timbre.test']);
            }
        }

        // Ajuste en el contrato más antiguo de galpón para mostrar un monto actualizado.
        Installment::query()->whereIn('status', [InstallmentStatus::Pending, InstallmentStatus::Partial])
            ->whereDate('due_date', '<', $today)->update(['status' => InstallmentStatus::Overdue]);

        $juan = Tenant::query()->where('first_name', 'Juan')->first();
        $tickets = [
            [$properties[0], $juan, 'Pierde la llave de paso', 'La llave de paso de la cocina gotea desde ayer y no cierra del todo. Puse un balde abajo.', Trade::Plumbing, TicketPriority::High, TicketStatus::Open, 0],
            [$properties[3], null, 'Salta la térmica del baño', 'Cuando se enciende el calefactor del baño salta la térmica general.', Trade::Electrical, TicketPriority::Medium, TicketStatus::Derived, 1],
            [$properties[12], null, 'Olor a gas en el calefón', 'Se siente olor a gas cerca del calefón cuando está encendido.', Trade::Gas, TicketPriority::Urgent, TicketStatus::Open, 0],
            [$properties[8], null, 'Humedad en la pared del dormitorio', 'Mancha de humedad que crece en la pared que da al patio.', Trade::Masonry, TicketPriority::Low, TicketStatus::InProgress, 6],
            [$properties[27], null, 'Portón no cierra', 'El portón corredizo se traba en el último metro.', Trade::General, TicketPriority::High, TicketStatus::Derived, 2],
            [$properties[10], null, 'Cerradura de la puerta de entrada', 'La llave gira en falso, hay que forzarla para abrir.', Trade::Locksmith, TicketPriority::Medium, TicketStatus::Resolved, 12],
            [$properties[5], null, 'Canilla del lavadero', 'La canilla del lavadero no corta el agua.', Trade::Plumbing, TicketPriority::Low, TicketStatus::Resolved, 20],
        ];
        foreach ($tickets as [$property, $tenant, $title, $desc, $cat, $prio, $status, $daysAgo]) {
            $tenant ??= $property->activeContract?->tenant;
            $created = $today->copy()->subDays($daysAgo)->setTime(mt_rand(8, 20), mt_rand(0, 59));
            $provider = $status !== TicketStatus::Open ? $providers->first(fn ($p) => $p->trade === $cat) : null;
            $ticket = Ticket::query()->create([
                'property_id' => $property->id,
                'tenant_id' => $tenant?->id,
                'provider_id' => $provider?->id,
                'title' => $title,
                'description' => $desc,
                'category' => $cat,
                'priority' => $prio,
                'status' => $status,
                'derived_at' => $provider ? $created->copy()->addHours(3) : null,
                'resolved_at' => $status === TicketStatus::Resolved ? $created->copy()->addDays(2) : null,
                'cost' => $status === TicketStatus::Resolved ? mt_rand(4, 18) * 5000 : null,
            ]);
            $ticket->forceFill(['created_at' => $created, 'updated_at' => $created])->save();
            if ($provider) {
                $ticket->comments()->create(['user_id' => 1, 'body' => "Derivado a {$provider->name} ({$provider->trade->label()})."]);
            }
        }

        $this->seedV2($today);

        ContactLog::query()->create([
            'kind' => ContactKind::Reminder,
            'tenant_id' => $properties[3]->activeContract->tenant_id,
            'phone' => $properties[3]->activeContract->tenant->phone,
            'message' => 'Recordatorio de saldo pendiente.',
        ])->forceFill(['created_at' => $today->copy()->subDays(4)])->save();
    }

    /**
     * Gastos, comprobantes y documentos de demostración (archivos generados, marcados como DEMO).
     */
    private function seedV2(Carbon $today): void
    {
        // Gastos: ABL y expensas mensuales de algunas unidades, seguros de galpones y los arreglos de reclamos cerrados.
        Property::query()->get()->each(function (Property $p) use ($today) {
            for ($m = 0; $m < 10; $m++) {
                $month = $today->copy()->startOfMonth()->subMonths($m);
                if ($month->year !== $today->year) {
                    continue;
                }
                if ($p->type === PropertyType::Apartment && $p->id % 2 === 0) {
                    Expense::query()->create(['property_id' => $p->id, 'category' => ExpenseCategory::Fees, 'description' => 'Expensas extraordinarias', 'amount' => mt_rand(30, 60) * 1000, 'spent_on' => $month->copy()->day(8)]);
                }
                if ($m % 2 === 0 && $month->copy()->day(15)->lte($today)) {
                    Expense::query()->create(['property_id' => $p->id, 'category' => ExpenseCategory::Abl, 'description' => 'ABL bimestral', 'amount' => ($p->type === PropertyType::Warehouse ? mt_rand(90, 160) : mt_rand(18, 45)) * 1000, 'spent_on' => $month->copy()->day(15)]);
                }
            }
            if ($p->type === PropertyType::Warehouse) {
                Expense::query()->create(['property_id' => $p->id, 'category' => ExpenseCategory::Insurance, 'description' => 'Seguro contra incendio anual', 'amount' => mt_rand(380, 620) * 1000, 'spent_on' => $today->copy()->month(3)->day(1)]);
            }
        });
        Ticket::query()->whereNotNull('cost')->get()->each(fn (Ticket $t) => Expense::query()->create([
            'property_id' => $t->property_id, 'ticket_id' => $t->id, 'category' => ExpenseCategory::Repair,
            'description' => "Reclamo #{$t->id}: {$t->title}", 'amount' => $t->cost, 'spent_on' => $t->resolved_at,
        ]));
        Expense::query()->create(['property_id' => 17, 'category' => ExpenseCategory::Repair, 'description' => 'Pintura completa y piso flotante', 'amount' => 1850000, 'spent_on' => $today->copy()->subDays(12)]);

        // Cada pago con la hora en que se registró, para que la actividad reciente cuente una historia creíble.
        DB::statement("update payments set created_at = paid_on + time '09:00' + (id % 9) * interval '1 hour' + (id * 7 % 60) * interval '1 minute', updated_at = created_at");

        // Comprobantes para confirmar: dos morosos avisaron que pagaron.
        $proofImage = $this->demoImage('Comprobante de transferencia (DEMO)');
        foreach (['Juan', 'Carolina'] as $name) {
            $tenant = Tenant::query()->where('first_name', $name)->first();
            $installment = Installment::query()->whereHas('contract', fn ($q) => $q->whereBelongsTo($tenant))->overdue()->orderBy('period')->first();
            if (! $installment) {
                continue;
            }
            $path = "proofs/{$tenant->id}/demo-{$installment->id}.png";
            Storage::disk('local')->put($path, $proofImage);
            PaymentProof::query()->create([
                'installment_id' => $installment->id, 'tenant_id' => $tenant->id, 'amount' => $installment->balance(),
                'paid_on' => $today->copy()->subDay(), 'method' => PaymentMethod::Transfer, 'path' => $path,
                'status' => ProofStatus::Pending, 'note' => 'Transferí desde Mercado Pago, perdón la demora.',
            ])->forceFill(['created_at' => $today->copy()->subHours(5)])->save();
        }

        // Documentos: contrato firmado y garantía en cada contrato; una garantía vence pronto.
        $pdf = $this->demoPdf();
        Contract::query()->with('property')->get()->each(function (Contract $c, int $i) use ($pdf, $today) {
            foreach ([[DocumentKind::Contract, 'Contrato firmado', null], [DocumentKind::Guarantee, 'Seguro de caución', $i === 3 ? $today->copy()->addDays(18) : $c->end_date->copy()]] as [$kind, $name, $expires]) {
                $path = "contracts/{$c->id}/demo-{$kind->value}.pdf";
                Storage::disk('local')->put($path, $pdf);
                ContractDocument::query()->create(['contract_id' => $c->id, 'kind' => $kind, 'name' => "{$name} {$c->property->code}.pdf", 'path' => $path, 'mime' => 'application/pdf', 'size' => strlen($pdf), 'expires_on' => $expires]);
            }
        });
    }

    private function demoImage(string $text): string
    {
        $img = imagecreatetruecolor(720, 960);
        imagefill($img, 0, 0, imagecolorallocate($img, 246, 247, 244));
        $ink = imagecolorallocate($img, 27, 30, 34);
        $violet = imagecolorallocate($img, 94, 67, 184);
        imagerectangle($img, 40, 40, 680, 920, $ink);
        imagestring($img, 5, 70, 80, $text, $ink);
        foreach (['Origen: cuenta del inquilino', 'Destino: TIMBRE.ALQUILER.MP', 'Operacion aprobada', 'DATOS FICTICIOS'] as $k => $line) {
            imagestring($img, 4, 70, 160 + $k * 40, $line, $k === 3 ? $violet : $ink);
        }
        ob_start();
        imagepng($img);

        return (string) ob_get_clean();
    }

    private function demoPdf(): string
    {
        $text = 'Documento de demostracion - Timbre (datos ficticios)';
        $stream = "BT /F1 18 Tf 60 760 Td ({$text}) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $n => $obj) {
            $offsets[] = strlen($pdf);
            $pdf .= ($n + 1)." 0 obj\n{$obj}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $o) {
            $pdf .= sprintf("%010d 00000 n \n", $o);
        }

        return $pdf.'trailer << /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }

    private function pay(Billing $billing, Installment $installment, Carbon $on): void
    {
        $methods = [PaymentMethod::Transfer, PaymentMethod::Transfer, PaymentMethod::Transfer, PaymentMethod::MercadoPago, PaymentMethod::Cash];
        $billing->registerPayment($installment, [
            'amount' => $installment->balance(),
            'paid_on' => $on->toDateString(),
            'method' => $methods[mt_rand(0, 4)]->value,
            'reference' => null,
        ]);
    }
}
