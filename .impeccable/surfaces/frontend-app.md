---
version: 1
slug: "frontend-app"
primary_target: "frontend/app"
related_targets: []
---

# Surface: Timbre app (panel admin + portal inquilino)

Scope: toda la app Next.js en `frontend/`. Modo: Operate. Usuario: un dueño con 30-40 propiedades, uso diario en PC y celular; inquilinos en el portal.
Tarea: saber quién debe y actuar con un clic (avisar por WhatsApp, registrar el pago, derivar el reclamo al proveedor).

## Direction contract

THESIS: La cartera se lee como la liquidación de expensas del mes que se pega en el hall: cada unidad es una fila con código corto (AZC-8), saldo anterior, pagos, intereses y saldo, y la deuda en su propia columna. Rechaza el dashboard SaaS de tarjetas con métricas sueltas y gráficos decorativos.

OWN-WORLD: Fondo de papel obra blanco frío #F6F7F4, tinta #1B1E22 y barra lateral azul tinta #1F2B45 con texto claro. Rojo birome #C42F26 solo para deuda y vencidos (oscurecido desde #D2362C para sostener 4.5:1 sobre el fondo rosado #FBE9E6 de los avisos de deuda), resaltador amarillo #F1DF4A solo detrás de lo que pide acción y sello violeta #5E43B8 para lo confirmado o pagado. Una sola familia: Archivo (Omnibus-Type, Buenos Aires), con cifras tabulares alineadas a la derecha. Convención de montos: la planilla y los resúmenes van en pesos enteros para que entren las nueve columnas a 1440; los centavos aparecen en la hoja de cobro, el portal y el recibo. Los inputs de monto son numéricos nativos (teclado decimal en el celular) y muestran debajo el monto formateado en es-AR. Filetes de 1px, radio de 2px y cápsulas planas para los estados.

STORY: El dueño entra y en segundos ve cuánto esperaba, cuánto cobró y quién debe. Avisa al moroso por WhatsApp, registra el pago (el sello PAGADO cae sobre la fila) y deriva reclamos al plomero.

FIRST VIEWPORT: Rail izquierdo azul tinta de 232px con el wordmark Timbre y la navegación. Arriba, encabezado "Liquidación · octubre 2026" y una franja de totales en cifras grandes: esperado, cobrado y adeudado (en rojo). Debajo, la planilla de unidades ordenada con los morosos primero: las filas morosas llevan el trazo de resaltador y el botón WhatsApp en la última columna. A la derecha, en desktop, la columna "Timbres" con los reclamos abiertos y el botón "Derivar".

FORM: Liquidación de expensas, candidato 3 de 7 en mi lista ordenada, seed ff4e2508. Raises: cifras tabulares (Datamatics), código corto por unidad (catálogo), tira de etapas de la cuota: emitida, por vencer, vencida y pagada (folio), construcción de 1px (anuario). Movimiento distintivo: el resaltador se dibuja sobre las filas vencidas y el sello violeta PAGADO se estampa al registrar un pago.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
