#!/usr/bin/env bash
# Levanta API (8000), scheduler y frontend (3000). Ctrl+C corta todo.
set -e
cd "$(dirname "$0")"
trap 'kill 0' EXIT
(cd backend && php artisan serve --port=8000) &
(cd backend && php artisan schedule:work) &
(cd frontend && npm run dev -- -p 3000) &
wait
