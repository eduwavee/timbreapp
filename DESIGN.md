---
name: Timbre
description: Gestión de alquileres que se lee como la liquidación de expensas del mes.
colors:
  paper: "#f6f7f4"
  sheet: "#ffffff"
  sheet-2: "#eef0ec"
  ink: "#1b1e22"
  ink-2: "#4a5058"
  ink-3: "#6b717a"
  rule: "#d9dcd5"
  rule-strong: "#b9bdb4"
  rail: "#1f2b45"
  rail-2: "#2a3857"
  rail-ink: "#e9edf6"
  rail-ink-2: "#a9b4cc"
  debt: "#c42f26"
  debt-soft: "#fbe9e6"
  marker: "#f1df4a"
  stamp: "#5e43b8"
  stamp-soft: "#ece7fb"
  ok: "#2f7a4f"
  ok-soft: "#e3f1e8"
  warn: "#8a5f00"
  warn-soft: "#fbf3dc"
  whatsapp: "#177f45"
  whatsapp-bubble: "#e7f5ea"
  whatsapp-bubble-rule: "#cfe3d4"
typography:
  wordmark:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 92"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' on, 'lnum' on"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  section:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'ss01' on"
  table:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  meta:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 82"
rounded:
  sm: "2px"
  md: "3px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "#33383f"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.paper}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.sheet-2}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.debt}"
    rounded: "{rounded.sm}"
    height: "40px"
  button-danger-hover:
    backgroundColor: "{colors.debt-soft}"
  button-stamp:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  button-stamp-hover:
    backgroundColor: "#5038a3"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "32px"
  button-whatsapp-hover:
    backgroundColor: "#136a39"
  button-sm:
    typography: "{typography.meta}"
    padding: "0 10px"
    height: "32px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  input-disabled:
    backgroundColor: "{colors.sheet-2}"
  pill-vencida:
    backgroundColor: "{colors.debt}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  pill-pagada:
    backgroundColor: "{colors.stamp-soft}"
    textColor: "{colors.stamp}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  pill-abierto:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  pill-parcial:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  pill-neutral:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  agenda-chip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  agenda-chip-vencido:
    backgroundColor: "{colors.debt-soft}"
    textColor: "{colors.debt}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  agenda-chip-cobrado:
    backgroundColor: "{colors.stamp-soft}"
    textColor: "{colors.stamp}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  text-link:
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
  activity-node:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    size: "26px"
  command-palette:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    width: "600px"
  command-palette-input:
    typography: "{typography.body}"
    height: "56px"
    padding: "0 16px"
  whatsapp-preview:
    backgroundColor: "{colors.whatsapp-bubble}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  panel:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
  table-header:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    padding: "0 12px"
    height: "36px"
  table-cell:
    typography: "{typography.table}"
    padding: "10px 12px"
  rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-ink-2}"
    width: "232px"
  rail-item-active:
    backgroundColor: "{colors.rail-2}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    height: "40px"
  sheet-drawer:
    backgroundColor: "{colors.sheet}"
    width: "480px"
  stamp-mark:
    textColor: "{colors.stamp}"
    rounded: "{rounded.md}"
    padding: "0.05em 0.45em"
---

# Design System: Timbre

## Overview

**Creative North Star: "La liquidación del hall"**

Timbre se lee como la hoja de liquidación de expensas que se pega en el hall del edificio: papel obra blanco frío, tinta casi negra, filetes de un pixel y columnas de cifras alineadas a la derecha. Cada unidad es una fila con su código corto (AZC-8, PIN-1290), y la plata manda: saldo anterior, cuota, pagado, intereses y saldo, con la deuda en su propia columna. La densidad es la de una planilla de trabajo, no la de un dashboard: muchas filas a la vista, poco aire decorativo, todo a un clic de la acción.

Sobre ese papel actúan tres instrumentos de oficina, cada uno con un solo trabajo. La birome roja marca la deuda y lo vencido. El resaltador amarillo se pasa por detrás de lo que pide acción (la unidad morosa, el reclamo sin derivar, el texto seleccionado). El sello violeta cae, apenas torcido, sobre lo que se cobró. Un rail azul tinta sostiene la navegación y la marca, como la tapa de la carpeta.

El sistema rechaza el dashboard SaaS de tarjetas con métricas sueltas y gráficos decorativos: los totales van en una franja de celdas separadas por filetes, y las tablas son la superficie principal.

**Key Characteristics:**
- Papel, tinta y filetes de 1px; casi sin sombras.
- Una sola familia, Archivo, jugando con su eje de ancho: condensada en rótulos y sello, normal en el cuerpo.
- Cifras siempre tabulares y alineadas a la derecha; el total cierra con doble filete.
- Tres acentos con función fija: rojo deuda, amarillo acción, violeta cobrado.
- Radios casi rectos (2px); estados en cápsulas planas con borde.
- Dos movimientos propios: el resaltador que se dibuja y el sello que cae.

## Colors

Papel neutro levemente verdoso, tinta gris azulada y un rail azul tinta; los colores saturados aparecen solo cuando significan algo.

### Primary
- **Azul tinta del rail** (rail): fondo del rail lateral de 232px, de la barra superior en celular y en el portal, del panel izquierdo del login y del `themeColor` del navegador. Es la carpeta que contiene la planilla, nunca un acento dentro de ella.
- **Azul tinta claro** (rail-2): ítem activo y hover del rail, botonera decorativa del login.
- **Texto del rail** (rail-ink / rail-ink-2): blanco azulado para la marca y lo activo; gris azulado para los ítems en reposo.

### Secondary
- **Rojo birome** (debt): montos adeudados, días de atraso, cápsula "Vencida" (fondo lleno), prioridad urgente, mensajes de error y toast de error. Oscurecido para sostener 4.5:1 sobre su fondo rosado.
- **Rosado de aviso** (debt-soft): fondo de errores de formulario, de `ErrorState` y del hover del botón peligro.

### Tertiary
- **Resaltador amarillo** (marker): trazo detrás del código de las unidades morosas, cápsula "Abierto" de reclamos, contador del rail, `::selection` y la luz del pulsador en la marca. Siempre con tinta encima, nunca como texto.
- **Sello violeta** (stamp): el sello PAGADO / COBRADO / AL DÍA, el total cobrado del mes, el botón que confirma un cobro, el foco (`:focus-visible`, caret, borde de input enfocado).
- **Violeta lavado** (stamp-soft): cápsula "Pagada", estado "Derivado" y las burbujas propias en el hilo de un reclamo.

### Neutral
- **Papel obra** (paper): fondo de página, pie de la hoja lateral, hover de filas.
- **Hoja** (sheet): paneles, tablas, inputs, botones secundarios.
- **Hoja gris** (sheet-2): inputs deshabilitados, hover del botón fantasma, base del skeleton.
- **Tinta** (ink): texto principal, botón primario, filtro activo, doble filete del total.
- **Tinta media** (ink-2): subtítulos, etiquetas de campo, texto secundario.
- **Tinta suave** (ink-3): rótulos de columna, metadatos, montos en cero ("—").
- **Filete** (rule): divisores de fila, bordes de panel.
- **Filete fuerte** (rule-strong): bordes de inputs y botones secundarios, línea bajo los encabezados de tabla, scrollbar.

### Estados y canales
- **Verde resuelto** (ok / ok-soft): propiedad disponible y reclamo resuelto.
- **Ámbar parcial** (warn / warn-soft): cápsula de pago parcial, propiedad en mantenimiento y el aviso de pago parcial en la hoja de cobro. El texto ámbar va oscurecido para sostener 4.5:1 sobre su fondo crema.
- **Verde WhatsApp** (whatsapp): exclusivo de los botones que abren wa.me (avisar, derivar, escribir al dueño). Oscurecido para que el texto blanco pase 4.5:1.
- **Burbuja de WhatsApp** (whatsapp-bubble / whatsapp-bubble-rule): fondo verde lavado y filete verde de la vista previa del mensaje que se va a mandar (plantillas en Ajustes). Es la burbuja tal como la va a ver el inquilino, no un estado.

### Named Rules
**The Tres Instrumentos Rule.** Rojo, amarillo y violeta tienen un trabajo cada uno: deuda, acción y cobrado. Un acento que aparece sin esa función es ruido.

**The Violeta No Es Link Rule.** Los enlaces secundarios son tinta subrayada con filete fuerte; el violeta queda para lo cobrado y para el foco.

**The WhatsApp Es Canal Rule.** El verde WhatsApp marca el canal, no el éxito: solo va en controles que abren una conversación de WhatsApp y en la burbuja que previsualiza el mensaje.

**The Espera Neutral Rule.** Un pendiente que quien mira no puede resolver (el "Esperando confirmación" del inquilino) va en cápsula neutra: hoja, filete fuerte, tinta media. El resaltador queda para lo que esa persona sí puede hacer, como el "Mandó comprobante" que ve el administrador.

## Typography

**Display Font:** Archivo (variable con eje `wdth`, vía next/font; respaldo ui-sans-serif, system-ui)
**Body Font:** Archivo
**Label/Mono Font:** Archivo condensada (82–92% de ancho); no hay monoespaciada: las cifras usan `tnum` y `lnum`.

**Character:** Una grotesca de Buenos Aires que trabaja como tipografía de planilla: compacta, firme en las cifras, y que se angosta para los rótulos de columna y el sello sin cambiar de familia.

### Hierarchy
- **Wordmark** (800, 21px en el rail, 28px en el login, ancho 92%, -0.02em): solo la palabra Timbre junto a su marca.
- **Headline** (700, 26px, interlineado ajustado, -0.015em): título de página ("Liquidación de octubre 2026", "Hola, Juan"), con `text-wrap: balance`.
- **Figure** (600, 22px en desktop / 19px en celular, -0.01em, tabular): los totales del mes y el monto grande del portal.
- **Title** (700, 18px): título de la hoja lateral y del emisor en el recibo.
- **Section** (700, 15px): títulos de sección ("Planilla de unidades", "Timbres sin derivar").
- **Body** (400, 15px, 1.45, `ss01`): texto corriente, inputs y detalle de recibo.
- **Table** (400, 14px): celdas de la planilla; códigos de unidad en 700.
- **Meta** (400–600, 13px y 12.5px): subtítulos de fila, botones chicos, etiquetas de campo, ayudas y errores.
- **Label** (600, 11.5px, 0.04em, mayúsculas, ancho 82%, ink-3): rótulos de columna de tabla y nombres de cifras en las franjas de totales.

### Named Rules
**The Cifra Tabular Rule.** Todo monto, fecha numérica, contador y número de recibo lleva la clase de cifras tabulares, sin cortes de línea, y se alinea a la derecha en columnas. Los pesos van enteros en planillas, resúmenes, agenda, actividad y rentabilidad. Los centavos aparecen donde el monto funciona como comprobante: la hoja de cobro, el listado de cobros y el reporte de cobros, la revisión de comprobantes, los formularios de montos, las condiciones del contrato (alquiler y depósito), las cuotas del portal y el recibo.

**The Rótulo Es Columna Rule.** El estilo condensado en mayúsculas es para nombrar columnas y cifras, como en una liquidación. No se usa como encabezado decorativo arriba de un título.

## Layout

El admin es una grilla de dos columnas en `lg` (1024px): rail fijo de 232px a la izquierda y contenido con padding de 32px (24px en `sm`, 16px en celular). Debajo de `lg` el rail se vuelve una barra superior azul tinta de 56px con un cajón lateral de 264px. El portal del inquilino no tiene rail: barra azul tinta con pestañas subrayadas y contenido centrado de hasta 896px (`max-w-4xl`). El recibo es una hoja de hasta 672px; el reporte mensual imprimible, una hoja de hasta 960px que al imprimir pierde borde y padding.

El ritmo sale de la escala de 4px de Tailwind: 4/8/12/16/20/24/32/40. Las secciones de una página se separan 40px; los títulos de página cierran con un filete y 20px de aire; las celdas de tabla usan 12px horizontales y 10px verticales (16px en el primer y último borde). La planilla de nueve columnas se ve completa a 1440px; debajo de `md` (768px) cada fila se vuelve un ítem de lista con el código, el saldo y los botones Cobrar y WhatsApp a lo ancho.

Lo que pide acción va antes de la planilla: la tira de comprobantes para confirmar y los timbres sin derivar son grillas de tarjetas con filete (una columna en celular, dos en `md`, tres en `xl`) sobre la tabla. La agenda pone el calendario de siete columnas junto a una lista de 320px en `xl`; debajo de `md` queda solo la lista. La actividad es una columna de hasta 768px (`max-w-3xl`) agrupada por día.

**The Deuda Primero Rule.** Las listas de unidades se ordenan con los morosos arriba, y el total adeudado ocupa su propia celda en la franja de totales. En la agenda del mes, lo vencido sin cobrar encabeza la lista de lo que viene.

## Elevation & Depth

El sistema es plano: la profundidad se arma con tonos de papel (paper, sheet, sheet-2) y filetes de 1px. Las sombras aparecen solo en capas que flotan sobre la planilla, siempre difusas y teñidas de tinta.

### Shadow Vocabulary
- **Hoja lateral** (`box-shadow: -12px 0 32px -12px rgba(27,30,34,0.25)`): borde izquierdo de la hoja de cobro y de las hojas de alta, sobre un velo de tinta al 35% con 1px de blur.
- **Toast** (`box-shadow: 0 8px 24px -8px rgba(27,30,34,0.35)`): avisos abajo a la derecha.
- **Buscador** (`box-shadow: 0 24px 60px -20px rgba(27,30,34,0.45)`): la paleta de Ctrl+K, sobre un velo de tinta al 40%.
- **Ítem activo del rail** (`box-shadow: inset 2px 0 0 #fff`): indicador de la sección actual, solo dentro del rail.

### Named Rules
**The Filete Antes Que Sombra Rule.** Paneles, tarjetas de reclamo, franjas de totales y tablas se separan con filetes, nunca con sombra. Si algo no flota, no tiene sombra.

**The Doble Filete Rule.** La fila de totales de una tabla de dinero cierra con un filete doble de 3px en tinta, como el pie de una liquidación. La planilla, la tabla de gastos y la cabecera del reporte mensual lo usan.

## Shapes

Esquinas casi rectas: 2px para botones, inputs, paneles, cápsulas y burbujas; 3px solo para el sello. Los bordes son de 1px (2px en el sello y en el subrayado de pestañas del portal). Los únicos círculos son los puntos de la tira de etapas y la luz del pulsador; los nodos de la línea de tiempo de actividad son cuadrados de 26px con esquina de 2px. Las áreas para subir archivos usan borde punteado de filete fuerte que pasa a tinta en hover. El sello se gira -4° y se multiplica sobre el papel; nada más en la interfaz se rota.

## Components

### Buttons
Planos, firmes y de esquina recta; el color dice qué pasa al tocarlos.
- **Shape:** esquinas de 2px; alto 40px (32px en tamaño chico), semibold, 14px (13px chico).
- **Primary:** tinta con texto blanco; hover a un gris tinta más claro, active a negro. Es "Cobrar" en una fila morosa y el envío de formularios.
- **Stamp:** violeta con texto blanco; reservado para confirmar un cobro ("Cobrar $ 3.152.400,00").
- **WhatsApp:** verde WhatsApp con el ícono de burbuja; compacto a 32x32 en la planilla.
- **Secondary:** hoja con borde de filete fuerte; hover a papel con borde de tinta.
- **Ghost:** sin borde ni fondo, tinta media; hover a hoja gris. Cancelar, cerrar.
- **Danger:** hoja con texto y borde rojo al 40%; hover rosado.
- **Hover / Focus:** transición de color de 150ms; foco con contorno violeta de 2px separado 2px. Cargando: spinner y `aria-busy`.

### Chips
- **Style:** cápsulas planas de 24px de alto, 12px semibold, borde de 1px y esquina de 2px.
- **Etapas de cuota:** pendiente (hoja, filete fuerte), parcial (crema ámbar con borde ámbar al 40%), vencida (rojo lleno, texto blanco), pagada (violeta lavado).
- **Esperas:** "Esperando confirmación" y cualquier pendiente ajeno usan la cápsula neutra (hoja, filete fuerte, tinta media), nunca el resaltador.
- **Reclamos:** abierto (resaltador lleno con tinta), derivado (violeta lavado), en curso (hoja con borde de tinta), resuelto (verde lavado).
- **Filtros de la planilla:** botones de 32px; el activo es tinta llena con texto blanco y el contador de deuda pasa a amarillo. Las pestañas de Actividad y de Gastos usan el mismo segmento: 32px, hoja con filete fuerte en reposo, tinta llena cuando están activas.
- **Agenda:** fichas de 11.5px semibold con un ícono de 12px por tipo (cuotas, ajuste, fin de contrato, documento) y el código de la unidad o la cantidad de cuotas. Tinta sobre hoja para lo que viene; rojo lavado solo para lo vencido o lo que ya expiró; violeta lavado cuando el vencimiento quedó cobrado.

### Cards / Containers
- **Corner Style:** 2px.
- **Background:** hoja sobre papel.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** filete de 1px; el panel de deuda del portal pasa a borde rojo al 40%.
- **Internal Padding:** 12–16px en celdas de totales y tarjetas de reclamo, 20px en el panel del portal.

### Inputs / Fields
- **Style:** hoja, borde de filete fuerte, esquina de 2px, 40px de alto, 15px. Etiqueta arriba en 13px semibold tinta media; ayuda abajo en 13px tinta suave.
- **Focus:** borde violeta y anillo violeta al 20%; caret violeta.
- **Error / Disabled:** borde rojo y mensaje rojo debajo; deshabilitado en hoja gris.
- **Montos:** inputs numéricos nativos (teclado decimal) con el monto formateado en es-AR como ayuda debajo.

### Navigation
- **Enlace secundario:** 13px semibold en tinta, subrayado con filete fuerte a 4px que pasa a tinta en hover ("Todos", "Todos los reclamos").
- **Rail admin:** azul tinta, 232px, ítems de 40px con ícono de trazo 1.8 y texto 14.5px en rail-ink-2; hover en rail-2 al 60%; activo en rail-2, semibold blanco, con el indicador interno de 2px. El contador de reclamos sin derivar es un recuadro amarillo con tinta.
- **Portal:** barra azul tinta con pestañas de 14.5px semibold subrayadas 2px en blanco cuando están activas.
- **Celular:** barra de 56px y cajón de 264px que entra deslizando.
- **Buscador (Ctrl/⌘+K):** diálogo de hasta 600px a 12vh del borde superior, hoja con filete fuerte. Campo de 56px y 16px con la lupa en tinta suave; el campo no lleva anillo de foco porque el buscador abierto ya es la señal. Resultados agrupados bajo rótulos de columna (Ir a, Hacer, Unidades, Inquilinos, Reclamos); la opción activa se marca con fondo papel y el ícono de Enter. Pie en papel con los atajos.

### Tabla de liquidación (signature)
Encabezados en rótulo condensado sobre un filete fuerte; filas divididas por filete; cifras a la derecha. La unidad morosa lleva el trazo de resaltador detrás de su código, dibujado de izquierda a derecha en 520ms con 60ms de escalonado por fila. La fila de totales cierra con doble filete.

### Sello (signature)
Texto violeta 800 en mayúsculas, ancho 88%, tracking 0.08em, borde violeta de 2px, esquina de 3px, girado -4° y en `multiply`. Al registrar un cobro cae en 420ms (de 1.9x y -12° a su lugar). Se usa para PAGADA, COBRADO, AL DÍA y PAGADO en el recibo.

### Tira de etapas
Emitida, Vence dd/mm, Vencida y Pagada en 11.5px, unidas por guiones de 1px, cada una con un punto de 6px: tinta para lo alcanzado, rojo para vencida, violeta para pagada. En modo compacto quedan los cuatro puntos y solo el rótulo de la etapa actual; los demás pasan a texto para lectores de pantalla.

### Hoja lateral
Diálogo modal anclado a la derecha, de hasta 480px, que entra en 260ms. Cabecera con título y cierre fantasma, cuerpo con scroll y pie en papel con las acciones alineadas a la derecha.

### Revisión de comprobante
Hoja lateral con el archivo en un marco de papel con filete, los datos informados en una lista de dos columnas (rótulo en tinta suave, cifra tabular) y el monto a registrar. Confirmar es el botón sello ("Confirmar y emitir recibo") porque registra un pago; "Rechazar" es el botón peligro empujado a la izquierda y abre el motivo. Ya resuelto, muestra el sello CONFIRMADO o el motivo de rechazo en rojo. En la Liquidación, los comprobantes pendientes forman una tira de tarjetas con miniatura de 56px, inquilino, unidad, monto y un "Revisar" en tinta.

### Línea de tiempo de actividad
Un filete vertical de 1px del que cuelgan nodos cuadrados de 26px (hoja, filete, esquina de 2px) con el ícono del evento teñido por su significado: violeta para pagos, rojo para avisos de deuda, verde ok para lo resuelto, tinta para comprobantes y reclamos. Título semibold con el "hace" a la derecha en 12px tinta suave, detalle en 13px tinta media. Cada día es un panel con su título de sección.

### Fotos de la unidad
Grilla de tres columnas (cuatro en `sm`) con separación de 8px; la primera foto es la portada y ocupa 2x2, con una etiqueta "Portada" en tinta al 80%. El visor es un diálogo con la foto y una botonera chica debajo (anterior, siguiente, usar de portada, borrar, cerrar).

### Documentos del contrato
Lista dentro de un panel con filetes: ícono de archivo, nombre en semibold, peso y vencimiento en 12.5px tinta suave; un vencimiento a 45 días o menos pasa a rojo semibold. El alta se abre en el mismo panel sobre fondo papel.

## Do's and Don'ts

### Do:
- **Do** usar rojo birome solo para deuda, atraso y errores, y el resaltador solo detrás de lo que pide acción.
- **Do** poner toda cifra con cifras tabulares, alineada a la derecha y sin cortes de línea.
- **Do** separar superficies con filetes de 1px y tonos de papel; reservar la sombra para hojas laterales y toasts.
- **Do** mantener las esquinas en 2px (3px solo en el sello).
- **Do** usar el botón violeta solo para confirmar un cobro o un comprobante (registrar un pago), y el sello para marcar lo cobrado.
- **Do** poner los pendientes que el usuario no puede resolver en la cápsula neutra.
- **Do** mostrar pesos enteros, salvo en la hoja de cobro, los montos de cuota del portal y el recibo.
- **Do** respetar `prefers-reduced-motion`: el resaltador, el sello y las hojas solo se animan sin esa preferencia.

### Don't:
- **Don't** armar tarjetas de métricas sueltas ni gráficos decorativos: los totales son celdas de una franja con filetes.
- **Don't** usar el violeta para enlaces o navegación; los enlaces son tinta subrayada.
- **Don't** usar el verde WhatsApp para estados de éxito; lo resuelto usa el verde ok.
- **Don't** poner texto sobre el amarillo que no sea tinta.
- **Don't** pintar de rojo lo que solo está por venir: en la agenda lo próximo va en tinta y el rojo es para lo vencido o expirado.
- **Don't** usar el rótulo condensado en mayúsculas como encabezado decorativo encima de un título.
- **Don't** agregar una segunda familia tipográfica; las variaciones salen del eje de ancho de Archivo.
