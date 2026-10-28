<?php

use App\Services\Billing;
use App\Services\Indices;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('cuotas:generar', function (Billing $billing) {
    $created = $billing->generateInstallments();
    $overdue = $billing->refreshStatuses();
    $this->info("Cuotas creadas: {$created}. Marcadas como vencidas: {$overdue}.");
})->purpose('Genera las cuotas del mes y marca las vencidas');

Artisan::command('indices:actualizar', function (Indices $indices) {
    $saved = $indices->update();
    $this->info("ICL: {$saved['icl']} valores. IPC: {$saved['ipc']} valores.");
})->purpose('Trae el ICL del BCRA y el IPC del INDEC para calcular los ajustes de alquiler');

Schedule::command('indices:actualizar')->dailyAt('05:30')->withoutOverlapping();
Schedule::command('cuotas:generar')->dailyAt('06:00')->withoutOverlapping();
