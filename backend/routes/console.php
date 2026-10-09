<?php

use App\Services\Billing;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('cuotas:generar', function (Billing $billing) {
    $created = $billing->generateInstallments();
    $overdue = $billing->refreshStatuses();
    $this->info("Cuotas creadas: {$created}. Marcadas como vencidas: {$overdue}.");
})->purpose('Genera las cuotas del mes y marca las vencidas');

Schedule::command('cuotas:generar')->dailyAt('06:00')->withoutOverlapping();
