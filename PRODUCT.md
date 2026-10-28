# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Laravel 12 (API REST, PHP 8.5) + PostgreSQL 17 en `backend/`; Next.js (App Router, TypeScript, sobre Node 24) en `frontend/`. Elegido por el usuario.

## Users

- **Dueño/administrador (usuario principal, una sola persona):** administra una cartera propia de 30 a 40 propiedades (casas, departamentos y galpones). Usa el panel todos los días, desde la PC y desde el celular, para cobrar, perseguir atrasos y resolver fallas.
- **Inquilinos:** entran a un portal propio para ver su contrato, sus pagos y su deuda, y para cargar reclamos (fallas o problemas en la propiedad).
- **Proveedores (plomero, electricista, gasista, etc.):** no usan el sistema. Reciben el trabajo por WhatsApp.

## Product Purpose

Timbre centraliza la gestión de alquileres: propiedades, inquilinos, contratos, cuotas y pagos, morosidad y reclamos de mantenimiento. Funciona bien si el dueño sabe en segundos quién debe, cuánto y desde cuándo, y si puede actuar con un solo clic: avisarle al inquilino atrasado o derivarle un reclamo al proveedor indicado.

## Positioning

El nombre viene del timbre, que suena en las dos direcciones: el inquilino "toca timbre" cuando hay una falla y el dueño "toca timbre" cuando hay un atraso. Todo el contacto sale por WhatsApp con el mensaje ya armado (links wa.me, sin API paga), que es como ya se trabaja en Argentina.

## Operating Context

- Argentina: montos en ARS (formato $ 1.234,56), DNI/CUIT, ajustes de contrato por ICL/IPC o monto fijo, vencimiento mensual con día de pago.
- Contacto por WhatsApp mediante links wa.me con el mensaje precargado: recordatorio de deuda al inquilino y derivación de reclamos al proveedor (ejemplo: "Depto 8, Azcuénaga, inquilino Juan: falla en la llave de paso").
- Escala chica: entre 30 y 40 propiedades, un solo administrador.

## Capabilities and Constraints

Módulos: autenticación con roles (admin / inquilino), propiedades, inquilinos, contratos, cuotas y pagos (parciales, recibos), morosidad con aviso por WhatsApp, reclamos con estados, proveedores con derivación en un clic, portal del inquilino y dashboard.

## Brand Commitments

- Nombre: **Timbre**, elegido por el usuario siguiendo el estilo de su otro proyecto "Mordida": una sola palabra, un objeto cotidiano del rubro, con doble sentido y bien argentina.
- Voz: español rioplatense (vos), directa y cercana.

## Evidence on Hand

No hay datos reales todavía. Los datos de prueba (seeders) son ficticios y no se presentan como reales.

## Brunito (web pública)

- Web de propiedades en `sitio/` (Next.js, puerto 3001) con marca propia: **Brunito**, elegida por el usuario. Voz rioplatense con humor de barrio.
- Publica casas, departamentos y galpones en venta (USD) y/o alquiler (ARS). Las publicaciones, precios y fotos se cargan desde la ficha de cada propiedad en Timbre.
- Quien toca "Me interesa" deja nombre y WhatsApp; la consulta cae en Timbre (Consultas) y el dueño la atiende él o la deriva a un colega o vendedor, todo por links `wa.me`.
- Visitantes: gente que busca para comprar o alquilar, mayormente desde el celular.

## Product Principles

1. **Un clic hasta la acción:** cobrar, avisar y derivar tienen que estar a un toque desde donde aparece el problema.
2. **La deuda primero:** lo que está vencido se ve antes que cualquier otra cosa.
3. **Hecho para una persona:** nada de flujos de equipo ni burocracia interna.
4. **El celular cuenta:** el dueño también trabaja desde el teléfono.
