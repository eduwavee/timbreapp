---
name: Brunito
description: Web pública de propiedades con el lenguaje de una desarrolladora porteña seria; la foto manda, el texto es grande y calmo, los datos van en mono.
colors:
  hueso: "#f1f0ed"
  hueso-2: "#e7e5e0"
  filete: "#d6d4ce"
  tinta: "#111110"
  tinta-2: "#55544f"
  tinta-3: "#6e6d67"
  gris-pie: "#a3a29c"
  error: "#b42318"
  whatsapp: "#177f45"
  whatsapp-hondo: "#126536"
  franja-ultramar: "#3f46c8"
  franja-ultramar-letra: "#ffffff"
  franja-rosa: "#f0d8d2"
  franja-rosa-letra: "#8a2b1d"
  franja-botella: "#1f3a31"
  franja-botella-letra: "#a6e3bd"
  franja-ocre: "#d9a441"
  franja-ocre-letra: "#2b1d05"
  franja-agua: "#d3eaec"
  franja-agua-letra: "#1d4d57"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(40px, 6.2vw, 96px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 104"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(40px, 5vw, 76px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 104"
  statement:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.6vw, 54px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 104"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
    fontFeature: "'tnum' 1"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 104"
  label:
    fontFamily: "Chivo Mono Variable, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0.02em"
rounded:
  none: "0px"
spacing:
  gutter-mobile: "16px"
  gutter: "32px"
  fila: "24px"
  bloque: "48px"
  seccion-mobile: "96px"
  seccion: "128px"
  contenedor: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.hueso}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.tinta-2}"
    textColor: "{colors.hueso}"
  button-primary-large:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.hueso}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "56px"
  button-contorno:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-contorno-hover:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.hueso}"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "48px"
  button-whatsapp-hover:
    backgroundColor: "{colors.whatsapp-hondo}"
  input-linea:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0"
    height: "44px"
  tag-reservada:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.hueso}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 10px"
  tag-sobre-foto:
    backgroundColor: "{colors.hueso}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 10px"
---

# Design System: Brunito

## Overview

**Creative North Star: "La Desarrolladora Porteña"**

Brunito se presenta como una desarrolladora seria de Buenos Aires, no como un portal de avisos. La foto real manda: aparece a sangre, grande, sin marcos. El texto acompaña grande y calmo, en una grotesca apretada que mezcla negrita y regular en la misma frase. Todo lo que es dato (barrio, operación, ambientes, m², navegación, botones, rótulos) va en una mono chica en mayúsculas, como el rótulo de un plano.

El suelo es hueso, la tinta casi negra, y las divisiones son filetes de 1px. No hay radios, no hay sombras, no hay viñetas de color. El color aparece en un solo lugar del sistema: las franjas del acordeón de recién publicadas, con una paleta propia (ultramar, rosa pálido, verde botella, ocre, celeste agua). Fuera de ahí, la página es hueso, tinta y foto.

La densidad es baja y generosa: secciones separadas por 96 a 128px, columnas que respiran, listas que son índices tipográficos con filetes. Rechaza el portal de filtros grises y cualquier disfraz gráfico.

**Key Characteristics:**
- Foto real a sangre como protagonista; el header va transparente sobre ella en el inicio.
- Archivo Variable apretada (700, tracking -0.035em, interlínea 0.98) para títulos; 700 y 400 mezclados en frases y en el H1 del listado.
- Chivo Mono en mayúsculas de 13px para todo dato, navegación, rótulo y botón.
- Hueso, tinta y filetes de 1px; sin radios, sin sombras.
- Color solo en las franjas del acordeón de recién publicadas.
- Movimiento lento y suave con una sola curva (ease-out-expo).

## Colors

Una paleta de papel y tinta: hueso cálido, negro casi puro y grises que bajan en el mismo tono, con una paleta de franjas aparte que vive en un solo componente.

### Primary
- **Tinta** (#111110): texto de lectura, títulos, filetes fuertes (el filete de 1px que abre cada lista o bloque) y el fondo de **todos** los botones principales. Es también el color de selección de texto y de la etiqueta Reservada.

### Tertiary
- **Verde WhatsApp** (#177f45, al pasar #126536): únicamente en el botón "¿Apurado? Escribinos vos" que aparece después de enviar la consulta y abre wa.me.

### Neutral
- **Hueso** (#f1f0ed): suelo de toda la página, de la barra de búsqueda apoyada sobre la foto y de las etiquetas sobre foto. También el `theme-color`.
- **Hueso Hondo** (#e7e5e0): fondo de espera de toda foto (tarjetas, galería, filas del acordeón en el celular) y del estado "sin fotos".
- **Filete** (#d6d4ce): las líneas de 1px que separan filas, tarjetas y el header de páginas internas.
- **Tinta Segunda** (#55544f): texto secundario, líneas de datos en mono, bajadas. Hover de los botones de tinta.
- **Tinta Tercera** (#6e6d67): rótulos de campo, placeholders, opciones no elegidas, la numeración 01/02/03.
- **Gris Pie** (#a3a29c): fondo del footer, con texto en tinta.
- **Error** (#b42318): mensajes de error y el filete inferior de un campo inválido. Nada más.

### Franjas (solo acordeón de recién publicadas)
Cinco pares fondo/letra, en orden: **Ultramar** (#3f46c8 con blanco), **Rosa Pálido** (#f0d8d2 con #8a2b1d), **Verde Botella** (#1f3a31 con #a6e3bd), **Ocre** (#d9a441 con #2b1d05), **Celeste Agua** (#d3eaec con #1d4d57). Cada franja usa siempre su par; la letra nunca va en tinta ni en blanco genérico salvo el ultramar.

### Named Rules
**The Color Solo En Las Franjas Rule.** La paleta de franjas vive únicamente en el acordeón de recién publicadas. No aparece en botones, fondos de sección, etiquetas ni estados.

**The Tinta Es La Acción Rule.** Todo botón principal es tinta con letra hueso, y pasa a tinta segunda al pasar el mouse. No hay color de acción.

**The Verde Solo WhatsApp Rule.** El verde aparece solo en el botón post-consulta que abre wa.me. Los demás links a WhatsApp (header, footer, "Escribinos por WhatsApp" del inicio) van en tinta, con el ícono.

## Typography

**Display Font:** Archivo Variable (eje wdth; con ui-sans-serif, system-ui)
**Body Font:** Archivo Variable al 104% de ancho
**Label/Mono Font:** Chivo Mono Variable (con ui-monospace)

**Character:** Una grotesca porteña apretada y negra para lo que se dice, contra una mono chica y espaciada para lo que se mide. El contraste de escala entre los dos es la jerarquía.

### Hierarchy
- **Display** (700, clamp(40px, 6.2vw, 96px), 0.98): el H1 del inicio en blanco sobre la foto, máximo 14ch; el del listado sube a clamp(44px, 6.4vw, 104px) y el del 404 a clamp(44px, 7vw, 112px). El H1 de la ficha va a clamp(36px, 5.2vw, 84px), máximo 22ch, balanceado.
- **Headline** (700, clamp(40px, 5vw, 76px), 0.98): títulos de sección ("Así de simple.", "Dónde estamos"). "Recién publicadas" va a clamp(36px, 4.4vw, 64px). Los barrios del índice van a clamp(26px, 3.4vw, 44px).
- **Statement** (400 con tramos en 700, clamp(28px, 3.6vw, 54px), 1.12, -0.025em): la frase de "qué es Brunito", máximo 26ch. La descripción de la ficha usa la misma voz a clamp(22px, 2vw, 28px), interlínea 1.3, máximo 34ch.
- **Title** (700, 28px, -0.03em): el precio en la tarjeta; 30px en el acordeón móvil, clamp(40px, 4vw, 56px) en el panel de consulta, 24px en la barra fija del celular. Debajo, el titular de la propiedad en 17px peso 500, interlínea ajustada.
- **Body** (400, 16px, 1.5): lectura y bajadas (15 a 18px), cifras tabulares, máximo 44 a 50ch.
- **Label** (Chivo Mono 400, 13px, 0.02em, mayúsculas): datos, navegación, rótulos de campo, botones (14px), etiquetas sobre foto (12px en el contador de fotos).

### Named Rules
**The Mezcla 700/400 Rule.** En frases y en el H1 del listado la jerarquía se hace mezclando 700 y 400 de la misma familia ("9 propiedades" en negrita, "en venta." en regular), no cambiando de tamaño ni de color.

**The Mono Siempre Mayúscula Rule.** Toda línea en mono va en mayúsculas, sin excepción. La clase de rótulo trae el uppercase; no se pisa.

**The Utilidad Pisa Tamaño Rule.** Las clases de título y de rótulo viven en la capa de componentes para que una utilidad de tamaño o tracking las pise. Se ajusta el tamaño en el lugar; la familia, el peso base y el tracking del sistema se respetan.

## Layout

Contenedor de 1440px centrado con márgenes de 16px en el celular y 32px desde 640px. Las secciones del inicio se separan con 96px de aire abajo en el celular y 128px desde 640px; el arranque de la primera sección de texto es 80/112px.

El inicio abre con la foto a sangre: 68svh en el celular (460 a 640px), pantalla completa desde 1024px (680 a 980px). El H1 se apoya abajo a la izquierda; la barra de búsqueda en hueso sube 132px sobre el pie de la foto en escritorio y queda debajo en el celular.

Las grillas de propiedades son de 1, 2 (640px) y 3 columnas (1280px), con 24px entre columnas y 48px entre filas. La ficha usa dos columnas desde 1024px: contenido a la izquierda y panel de precio y consulta de 420px pegajoso a la derecha, con 96px de separación. Las secciones partidas ("Así de simple", "Dónde estamos") van a dos mitades con 80px de calle.

Las listas son índices: un filete de tinta arriba y filetes hueso abajo de cada fila, con 16 a 24px de alto de fila.

### Named Rules
**The Pie Abajo Rule.** El body es una columna flex de alto mínimo de pantalla y el main crece; el footer siempre queda pegado abajo, aunque la página tenga poco contenido.

**The Datos Que No Se Parten Rule.** Una línea de datos (barrio · tipo · ambientes · m²) se arma con segmentos que no cortan, y el separador " ·" va dentro del segmento anterior. Si la línea pasa a dos renglones, ninguno empieza con un punto.

## Elevation & Depth

Plano por completo. No hay sombras en ningún elemento. La profundidad la dan la foto a sangre, el contraste de tinta sobre hueso y los filetes. La barra de búsqueda que pisa la foto se despega por su fondo hueso opaco, no por una sombra.

Los únicos degradados del sistema son velos negros sobre fotos para que se lea el texto blanco: el velo de la foto del inicio (más oscuro abajo, hasta 72%) y el velo del panel abierto del acordeón (42% arriba, 55% abajo, transparente al medio).

### Named Rules
**The Sin Sombras Rule.** Ningún elemento lleva sombra. Si algo necesita despegarse, se le da fondo opaco o un filete.

**The Velo Solo Para Leer Rule.** Un degradado solo existe como velo sobre una foto que lleva texto encima. Nunca como fondo, adorno ni botón.

## Shapes

Esquinas rectas en todo: botones, campos, etiquetas, fotos, franjas y paneles (0px). Los campos no son cajas: son una línea inferior de 1px en tinta que pasa a 2px al enfocar. Las fotos se recortan en 4:3 en tarjetas y en el acordeón móvil, 4:3 o 16:9 en la galería, 4:5 en la foto de "Así de simple". La única forma dibujada es el techo a dos aguas del logo.

## Components

### Buttons
Rectángulos de tinta, sin adorno, con el texto en mono y una flecha fina.
- **Shape:** esquinas rectas (0px).
- **Primary:** fondo tinta, letra hueso, mono 14px en mayúsculas, 48px de alto con 24px a los lados; la acción principal de la ficha ("Me interesa") y la del cierre del inicio van a 56px. Lleva flecha de 16px a la derecha cuando lleva a otra página.
- **Hover / Focus:** pasa a tinta segunda; la flecha se corre 4px en 500ms con ease-out-expo. Foco: contorno de 2px en el color del texto con 3px de separación. Deshabilitado: opacidad 70% y cursor de espera.
- **Contorno:** borde de 1px en tinta, fondo transparente; al pasar se llena de tinta con letra hueso. Para la acción alternativa ("Seguir mirando", ver la otra operación).
- **WhatsApp:** fondo verde WhatsApp, letra blanca, ícono de WhatsApp de 20px; solo después de enviar la consulta.

### Chips (selector de operación)
- **Style:** Comprar / Alquilar en mono 14px sobre la línea inferior del campo, sin caja.
- **State:** el elegido va en negrita tinta con subrayado de 1px separado 6px; los otros en tinta tercera, pasan a tinta al pasar. Las pestañas de operación del panel de la ficha usan el mismo tratamiento.

### Cards / Containers
- **Corner Style:** rectas (0px).
- **Background:** ninguno; la tarjeta es la foto 4:3 sobre hueso hondo y el texto sobre el suelo.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** un filete de 1px abajo cierra cada tarjeta.
- **Internal Padding:** 16px arriba y 20px abajo del texto. Orden: línea mono "Barrio · Operación" con el tipo a la derecha, precio en título de 28px, titular en 17px, línea mono de datos.
- **Hover:** la foto escala a 1.025 en 1200ms con ease-out-expo. Nada más se mueve.
- **Etiquetas sobre foto:** Reservada en tinta con letra hueso arriba a la izquierda; contador de fotos o dirección en hueso con letra tinta abajo.

### Inputs / Fields
- **Style:** sin caja: línea inferior de 1px en tinta, fondo transparente, 44px de alto, texto 16px; en el buscador el valor va en semibold. Rótulo en mono tinta tercera encima. Los selects llevan un chevron fino de 16px dibujado en tinta.
- **Focus:** la línea inferior pasa a 2px.
- **Error / Disabled:** línea en rojo error y mensaje debajo en 14px peso 500 en rojo error.

### Navigation
- **Header:** marca "brunito" a la izquierda (26px, 30px desde 640px) y Comprar, Alquilar, Publicar en mono a la derecha; 64px de alto (80px desde 640px). En el inicio va transparente con letra blanca sobre la foto; en el resto, sobre hueso con filete abajo. Publicar se oculta debajo de 768px.
- **Links en mono:** un subrayado de 1px que crece de izquierda a derecha en 400ms al pasar y queda completo en la página actual.
- **Footer:** fondo gris pie, texto tinta; arriba "Volver arriba" y el ©, separados por un filete de tinta; abajo la marca a 34px y columnas de links en mono.

### Marca
"brunito" en minúscula, Archivo 700 con tracking -0.045em, con un techo a dos aguas dibujado en trazo recto sobre la "br". Hereda el color del texto (blanco sobre foto, tinta sobre hueso).

### Acordeón de recién publicadas (componente firma)
- **Escritorio (desde 1024px):** una fila de franjas verticales de 52px de ancho, alto min(640px, 72vh), cada una con su par de color y la dirección en mono 14px escrita de abajo hacia arriba. La franja abierta cambia el texto a "Barrio · Operación" y se abre a lo ancho (flex-grow en 900ms con ease-out-expo) mostrando la foto con su velo, la dirección como título blanco de clamp(44px, 4.6vw, 72px) arriba, los datos en mono abajo a la izquierda y "Ver propiedad" con flecha abajo a la derecha. El contenido aparece subiendo 10px en 800ms. Al pasar, una franja cerrada baja su brillo al 95%.
- **Celular:** filas de color de 56px con la dirección a la izquierda y el barrio a la derecha; la fila elegida despliega la foto 4:3 y debajo, sobre hueso, la línea mono de datos, el precio en 30px, el titular y "Ver propiedad" subrayado.
- **Fotos:** el acordeón abre con la primera propiedad; la foto del inicio y la de "Así de simple" usan otras, nunca la misma.

### Entrada al inicio (intro)
Solo en el inicio y una vez por sesión (`sessionStorage` "brunito-intro"; un script inline marca `data-intro="visto"` en `html` antes de pintar). Sobre un telón hueso a pantalla completa se dibuja el techo de la marca (trazo en 700ms), "la choza" sube y aparece (800ms, desde 380ms), y a los 1050ms el telón se levanta con `clip-path` (950ms). Debajo, la foto de portada se acerca de 1.08 a 1 (2000ms) y entran el título (desde 1250ms) y la barra de búsqueda (desde 1400ms). Todo con ease-out-expo. En visitas siguientes no hay telón y el resto entra sin demora; con movimiento reducido no hay intro ni animaciones.

### Índice de barrios
Cada barrio es una fila con el nombre en título grande, la ciudad en mono tinta tercera al lado, y las cantidades en venta y alquiler en mono (atenuadas cuando son cero), con una flecha que se corre 4px al pasar. Toda la fila es el link.

### Panel de consulta
Precio grande, el formulario de campos de línea y el botón "Me interesa" de 56px. Al enviar, el formulario se reemplaza por "Consulta enviada." en título de 34px, la confirmación con nombre y teléfono, el botón WhatsApp y el de contorno. En el celular una barra fija abajo, sobre hueso con filete de tinta, lleva operación, precio y "Me interesa".

## Do's and Don'ts

### Do:
- **Do** dejar que la foto real ocupe el lugar grande: a sangre en el inicio, 4:3 en tarjetas, sin marcos.
- **Do** usar tinta (#111110) con letra hueso para toda acción principal, y tinta segunda al pasar.
- **Do** escribir todo dato, rótulo, navegación y botón en Chivo Mono 13 a 14px en mayúsculas.
- **Do** separar con filetes de 1px: tinta para abrir un bloque, filete (#d6d4ce) entre filas.
- **Do** mezclar 700 y 400 de Archivo en una misma frase para marcar lo importante.
- **Do** armar las líneas de datos con segmentos que no cortan y el separador dentro del segmento anterior.
- **Do** usar una sola curva de movimiento (cubic-bezier(0.16, 1, 0.3, 1)) y apagar transiciones y apariciones con movimiento reducido.

### Don't:
- **Don't** poner rótulos, antetítulos ni kickers encima de un título.
- **Don't** usar la paleta de franjas fuera del acordeón de recién publicadas.
- **Don't** usar el verde WhatsApp fuera del botón post-consulta que abre wa.me.
- **Don't** redondear esquinas ni usar sombras.
- **Don't** usar degradados salvo como velo sobre una foto que lleva texto.
- **Don't** escribir una línea en mono en minúsculas.
- **Don't** repetir la misma foto de propiedad en la portada, el acordeón y "Así de simple".
