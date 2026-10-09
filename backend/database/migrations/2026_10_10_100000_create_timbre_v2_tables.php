<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('caption')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('category', 20);                 // arreglo | abl | expensas | seguro | impuesto | servicio | otro
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->date('spent_on');
            $table->timestamps();
            $table->index(['property_id', 'spent_on']);
        });

        Schema::create('payment_proofs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('paid_on');
            $table->string('method', 20);
            $table->string('path');
            $table->string('status', 20)->default('pendiente'); // pendiente | aprobado | rechazado
            $table->text('note')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });

        Schema::create('contract_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 20);                      // contrato | dni | garantia | recibo_sueldo | seguro | otro
            $table->string('name');
            $table->string('path');
            $table->string('mime', 100);
            $table->unsignedInteger('size');
            $table->date('expires_on')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_documents');
        Schema::dropIfExists('payment_proofs');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('property_photos');
    }
};
