#!/usr/bin/env bash
# Arranque en Render (plan gratis). El disco se borra cada vez que el servicio se duerme,
# así que en cada arranque se migra, se cargan los datos de demo si la base está vacía,
# se reponen las fotos y se corren las tareas del día.
set -e
cd /var/www/html

# Render genera un valor al azar; Laravel necesita exactamente 32 bytes en base64.
if [ -n "$APP_KEY" ] && [[ "$APP_KEY" != base64:* ]]; then
  export APP_KEY="base64:$(php -r 'echo base64_encode(hash("sha256", getenv("APP_KEY"), true));')"
fi
export APP_URL="${APP_URL:-$RENDER_EXTERNAL_URL}"

PORT="${PORT:-10000}"
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

mkdir -p storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
php artisan storage:link --force
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan demo:preparar
php artisan cuotas:generar || true
chown -R www-data:www-data storage bootstrap/cache

# Los índices se piden a internet: no demoran el arranque. El scheduler corre mientras el servicio esté despierto.
(php artisan indices:actualizar || true) &
(php artisan schedule:work > /dev/null 2>&1) &

exec apache2-foreground
