<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La Choza: publicación de propiedades en la web, consultas de interesados y colegas a quienes derivarlas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('colleagues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('agency')->nullable();            // inmobiliaria o matrícula
            $table->string('phone', 30);                      // WhatsApp
            $table->string('zone')->nullable();               // "Palermo y Colegiales"
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('headline', 120);
            $table->text('description')->nullable();
            $table->string('neighborhood', 80)->nullable();   // barrio: Recoleta, Villa Crespo
            $table->boolean('for_sale')->default(false);
            $table->decimal('sale_price', 14, 2)->nullable(); // USD
            $table->boolean('for_rent')->default(false);
            $table->decimal('rent_price', 12, 2)->nullable(); // ARS por mes
            $table->decimal('expenses', 12, 2)->nullable();   // expensas ARS
            $table->unsignedTinyInteger('bathrooms')->nullable();
            $table->boolean('garage')->default(false);
            $table->unsignedSmallInteger('age_years')->nullable();
            $table->json('amenities')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('reserved_at')->nullable();
            $table->timestamps();
            $table->index('published_at');
        });

        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('operation', 10);                  // venta | alquiler
            $table->string('name', 120);
            $table->string('phone', 30);
            $table->string('email')->nullable();
            $table->text('message')->nullable();
            $table->string('status', 12)->default('nueva');   // nueva | atendiendo | derivada | cerrada
            $table->foreignId('colleague_id')->nullable()->constrained()->nullOnDelete();
            $table->string('outcome', 12)->nullable();        // concretada | descartada
            $table->text('notes')->nullable();
            $table->timestamp('contacted_at')->nullable();
            $table->timestamp('derived_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
        Schema::dropIfExists('listings');
        Schema::dropIfExists('colleagues');
    }
};
