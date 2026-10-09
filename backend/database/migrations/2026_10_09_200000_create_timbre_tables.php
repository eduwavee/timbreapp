<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16)->unique();           // AZC-8
            $table->string('type', 20);                      // casa | departamento | galpon
            $table->string('street');
            $table->string('number', 20);
            $table->string('unit', 20)->nullable();          // "8", "3B"
            $table->string('city')->default('CABA');
            $table->decimal('surface_m2', 8, 2)->nullable();
            $table->unsignedSmallInteger('rooms')->nullable();
            $table->string('status', 20)->default('disponible'); // disponible | ocupada | mantenimiento
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('document', 20)->unique();        // DNI o CUIT
            $table->string('phone', 30);                      // WhatsApp
            $table->string('email')->nullable();
            $table->string('guarantor_name')->nullable();
            $table->string('guarantor_phone', 30)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('rent_amount', 12, 2);
            $table->unsignedTinyInteger('due_day')->default(10);
            $table->string('adjustment_type', 10)->default('icl'); // icl | ipc | fijo
            $table->unsignedTinyInteger('adjustment_every_months')->default(12);
            $table->decimal('deposit', 12, 2)->default(0);
            $table->decimal('late_fee_daily_pct', 5, 3)->default(0.1); // % diario sobre saldo vencido
            $table->string('status', 20)->default('vigente'); // vigente | finalizado | rescindido
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->date('period');                           // primer día del mes
            $table->date('due_date');
            $table->decimal('amount', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->string('status', 20)->default('pendiente'); // pendiente | parcial | vencida | pagada
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['contract_id', 'period']);
            $table->index(['status', 'due_date']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installment_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('receipt_number')->unique();
            $table->decimal('amount', 12, 2);
            $table->decimal('late_fee', 12, 2)->default(0);
            $table->date('paid_on');
            $table->string('method', 20);                    // efectivo | transferencia | mercadopago | otro
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('providers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('trade', 20);                      // plomeria | electricidad | gas | cerrajeria | pintura | albanileria | general
            $table->string('phone', 30);
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('category', 20);                   // mismas claves que providers.trade
            $table->string('priority', 10)->default('media'); // baja | media | alta | urgente
            $table->string('status', 20)->default('abierto'); // abierto | derivado | en_curso | resuelto
            $table->timestamp('derived_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->timestamps();
            $table->index('status');
        });

        Schema::create('ticket_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('ticket_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->timestamps();
        });

        Schema::create('contact_logs', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 20);                       // recordatorio | derivacion
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('installment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained()->nullOnDelete();
            $table->string('phone', 30);
            $table->text('message');
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('admin');     // admin | inquilino
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn('role');
        });
        foreach (['settings', 'contact_logs', 'ticket_photos', 'ticket_comments', 'tickets', 'providers', 'payments', 'installments', 'contracts', 'tenants', 'properties'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
