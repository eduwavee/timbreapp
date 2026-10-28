<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Cada límite lleva su propio contador: navegar la web no gasta los "Me interesa" ni los intentos de ingreso.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('site', fn (Request $request) => self::fromSiteProxy($request)
            ? Limit::perMinute(1200)->by(self::siteVisitor($request) ?? 'proxy')
            : Limit::perMinute(240)->by($request->ip()));
        RateLimiter::for('inquiries', fn (Request $request) => Limit::perMinute(6)->by(self::siteVisitor($request) ?? $request->ip()));
    }

    /**
     * El pedido viene del servidor de Brunito: trae la clave compartida (SITE_PROXY_KEY).
     */
    private static function fromSiteProxy(Request $request): bool
    {
        $key = (string) config('services.site.proxy_key');

        return $key !== '' && hash_equals($key, (string) $request->header('X-Site-Key'));
    }

    /**
     * La IP de quien navega Brunito. Next llama a la API desde su servidor y manda la del visitante
     * en X-Forwarded-For; solo se le cree si el pedido viene del servidor de Brunito.
     */
    private static function siteVisitor(Request $request): ?string
    {
        if (! self::fromSiteProxy($request)) {
            return null;
        }
        $ip = trim(explode(',', (string) $request->header('X-Forwarded-For'))[0]);

        return filter_var($ip, FILTER_VALIDATE_IP) ? 'visitor|'.$ip : null;
    }
}
