<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Historial de cambios de las fichas, valores oficiales de ICL e IPC y los ajustes de alquiler aplicados.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('change_logs', function (Blueprint $table) {
            $table->id();
            $table->morphs('subject');                          // la ficha: propiedad, inquilino o contrato
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 10);                         // alta | cambio
            $table->json('changes');                             // [{label, from, to}] ya formateados
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('index_values', function (Blueprint $table) {
            $table->id();
            $table->string('index', 3);                          // icl (diario, BCRA) | ipc (mensual, INDEC)
            $table->date('date');
            $table->decimal('value', 16, 6);
            $table->timestamps();
            $table->unique(['index', 'date']);
        });

        Schema::create('contract_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->date('from_period');                         // primer mes con el alquiler nuevo
            $table->decimal('previous_amount', 12, 2);
            $table->decimal('new_amount', 12, 2);
            $table->decimal('percentage', 8, 3);
            $table->string('basis')->nullable();                 // "ICL 30/07/2026 → 01/11/2026"
            $table->timestamps();
            $table->unique(['contract_id', 'from_period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_adjustments');
        Schema::dropIfExists('index_values');
        Schema::dropIfExists('change_logs');
    }
};
