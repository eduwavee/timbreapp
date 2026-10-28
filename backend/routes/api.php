<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AdjustmentController;
use App\Http\Controllers\Api\AgendaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ColleagueController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\ContractDocumentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\LedgerController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentProofController;
use App\Http\Controllers\Api\Portal\PortalController;
use App\Http\Controllers\Api\ProfitabilityController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyPhotoController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\Site\SiteController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');

// Brunito: web pública. Solo lectura de lo publicado y el "Me interesa".
Route::prefix('site')->group(function () {
    Route::middleware('throttle:site')->group(function () {
        Route::get('/meta', [SiteController::class, 'meta']);
        Route::get('/listings', [SiteController::class, 'index']);
        Route::get('/listings/{slug}', [SiteController::class, 'show']);
    });
    Route::post('/listings/{slug}/inquiries', [SiteController::class, 'inquire'])->middleware('throttle:inquiries');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Compartidos (el controlador valida que el inquilino sea el dueño del recurso).
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::post('/tickets/{ticket}/comments', [TicketController::class, 'comment']);
    Route::get('/proofs/{proof}/file', [PaymentProofController::class, 'file']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/dashboard', DashboardController::class);
        Route::get('/ledger', LedgerController::class);

        Route::apiResource('properties', PropertyController::class);
        Route::apiResource('tenants', TenantController::class);
        Route::apiResource('contracts', ContractController::class);
        Route::post('/contracts/{contract}/adjust', [ContractController::class, 'adjust']);
        Route::get('/adjustments', AdjustmentController::class);
        Route::get('/history/{type}/{id}', HistoryController::class)->whereIn('type', ['properties', 'tenants', 'contracts'])->whereNumber('id');

        Route::get('/installments', [InstallmentController::class, 'index']);
        Route::get('/installments/{installment}', [InstallmentController::class, 'show']);
        Route::post('/installments/{installment}/payments', [PaymentController::class, 'store']);
        Route::post('/installments/{installment}/reminder', [ReminderController::class, 'store']);
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);

        Route::apiResource('providers', ProviderController::class)->except('show');
        Route::apiResource('tickets', TicketController::class);
        Route::post('/tickets/{ticket}/derive', [TicketController::class, 'derive']);

        Route::get('/search', SearchController::class);
        Route::get('/activity', ActivityController::class);
        Route::get('/agenda', AgendaController::class);

        Route::post('/properties/{property}/photos', [PropertyPhotoController::class, 'store']);
        Route::patch('/property-photos/{photo}', [PropertyPhotoController::class, 'update']);
        Route::delete('/property-photos/{photo}', [PropertyPhotoController::class, 'destroy']);

        Route::get('/proofs', [PaymentProofController::class, 'index']);
        Route::post('/proofs/{proof}/approve', [PaymentProofController::class, 'approve']);
        Route::post('/proofs/{proof}/reject', [PaymentProofController::class, 'reject']);

        Route::apiResource('expenses', ExpenseController::class)->except('show');
        Route::get('/profitability', ProfitabilityController::class);

        Route::get('/contracts/{contract}/documents', [ContractDocumentController::class, 'index']);
        Route::post('/contracts/{contract}/documents', [ContractDocumentController::class, 'store']);
        Route::get('/documents/{document}/file', [ContractDocumentController::class, 'download']);
        Route::delete('/documents/{document}', [ContractDocumentController::class, 'destroy']);

        Route::get('/properties/{property}/listing', [ListingController::class, 'show']);
        Route::put('/properties/{property}/listing', [ListingController::class, 'update']);
        Route::apiResource('colleagues', ColleagueController::class)->except('show');
        Route::get('/inquiries', [InquiryController::class, 'index']);
        Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show']);
        Route::patch('/inquiries/{inquiry}', [InquiryController::class, 'update']);
        Route::post('/inquiries/{inquiry}/contact', [InquiryController::class, 'contact']);
        Route::post('/inquiries/{inquiry}/derive', [InquiryController::class, 'derive']);

        Route::get('/exports/month', [ExportController::class, 'month']);
        Route::post('/exports/table', [ExportController::class, 'table']);

        Route::get('/settings', [SettingController::class, 'show']);
        Route::put('/settings', [SettingController::class, 'update']);
    });

    Route::middleware('role:inquilino')->prefix('portal')->group(function () {
        Route::get('/summary', [PortalController::class, 'summary']);
        Route::get('/tickets', [PortalController::class, 'tickets']);
        Route::post('/tickets', [PortalController::class, 'storeTicket']);
        Route::post('/proofs', [PortalController::class, 'storeProof']);
    });
});
