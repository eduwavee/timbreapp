<?php

use App\Models\Property;
use App\Models\PropertyPhoto;
use App\Services\Billing;
use App\Services\Indices;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('cuotas:generar', function (Billing $billing) {
    $created = $billing->generateInstallments();
    $overdue = $billing->refreshStatuses();
    $this->info("Cuotas creadas: {$created}. Marcadas como vencidas: {$overdue}.");
})->purpose('Genera las cuotas del mes y marca las vencidas');

Artisan::command('indices:actualizar', function (Indices $indices) {
    $saved = $indices->update();
    $this->info("ICL: {$saved['icl']} valores. IPC: {$saved['ipc']} valores.");
})->purpose('Trae el ICL del BCRA y el IPC del INDEC para calcular los ajustes de alquiler');

Artisan::command('demo:preparar', function () {
    if (! Property::query()->exists()) {
        $this->call('db:seed', ['--force' => true]);
    }

    // En un servidor con disco efímero las fotos se pierden al reiniciar: se reponen desde las de la demo.
    $restored = 0;
    PropertyPhoto::query()->each(function (PropertyPhoto $photo) use (&$restored): void {
        $source = database_path('seeders/photos/'.basename($photo->path));
        if (! Storage::disk('public')->exists($photo->path) && is_file($source)) {
            Storage::disk('public')->put($photo->path, (string) file_get_contents($source));
            $restored++;
        }
    });
    $this->info("Fotos repuestas: {$restored}.");
})->purpose('Demo: carga los datos de prueba si la base está vacía y repone las fotos que falten');

Schedule::command('indices:actualizar')->dailyAt('05:30')->withoutOverlapping();
Schedule::command('cuotas:generar')->dailyAt('06:00')->withoutOverlapping();
