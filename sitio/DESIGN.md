---
name: La Choza
description: Web pública de propiedades que se lee como el cartel VENDE / ALQUILA colgado del balcón.
colors:
  pared: "#e6e7e2"
  chapa: "#fbfbf8"
  chapa-2: "#f0f1ec"
  tinta: "#141414"
  tinta-2: "#45484d"
  tinta-3: "#6a6e74"
  rule: "#c9cbc4"
  rojo: "#d52b1e"
  rojo-hondo: "#a91f15"
  azul: "#1a43a8"
  azul-hondo: "#122f7a"
  faja: "#ffd21f"
  whatsapp: "#177f45"
typography:
  verbo:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, sans-serif"
    fontSize: "clamp(84px, 13.4vw, 212px)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.01em"
    textTransform: uppercase
  cartel:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, sans-serif"
    fontSize: "34px a 88px"
    fontWeight: 900
    lineHeight: 0.82
    textTransform: uppercase
  rotulo:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, sans-serif"
    fontSize: "13px a 17px"
    fontWeight: 800
    letterSpacing: "0.04em"
    textTransform: uppercase
  titulo:
    fontFamily: "Sofia Sans Variable, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 46px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Sofia Sans Variable, sans-serif"
    fontSize: "16px a 18px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' on"
rounded:
  chapa: "3px"
  todo-lo-demas: "0"
spacing:
  gutter-mobile: "12px"
  gutter: "24px"
  grid-gap: "20px"
  section: "56px a 80px"
components:
  cartel-hero:
    backgroundColor: "{colors.rojo} | {colors.azul}"
    textColor: "{colors.chapa}"
    rounded: "{rounded.chapa}"
  boton-principal:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.chapa}"
    height: "64px"
    typography: "{typography.cartel}"
  boton-principal-hover:
    backgroundColor: "rojo-hondo | azul-hondo"
  boton-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "#ffffff"
  campo:
    backgroundColor: "{colors.chapa}"
    border: "2px solid {colors.tinta}"
    height: "48px"
  faja:
    backgroundColor: "{colors.faja}"
    textColor: "{colors.tinta}"
    border: "2px solid {colors.tinta} arriba y abajo"
    rotate: "-9deg"
---

# Design System: La Choza

## Overview

La Choza es la web pública de propiedades que alimenta a Timbre. El mundo es el cartel de inmobiliaria que cuelga del balcón en cualquier barrio argentino: una chapa con un verbo enorme (VENDE o ALQUILA), el dato justo y una sola forma de contactar. Rechaza el portal de fotos con filtros grises, banners y sombras suaves.

Escena: alguien busca depto desde el celular, de día en la calle o de noche en el sillón. La página es clara: pared de revoque gris frío, chapas blancas y la chapa grande en el color de la operación.

## Colors

### Primary

- **Rojo cartel** `#d52b1e`: la venta. Rellena la chapa del hero, la franja de cada tarjeta y el panel de la ficha cuando la operación es venta. `#a91f15` es su hover.
- **Azul cartel** `#1a43a8`: el alquiler. Mismo trabajo que el rojo. `#122f7a` es su hover.

Los dos viven en la variable `--op`, que cambia con `data-op="venta|alquiler"` en cualquier contenedor. Nunca se usan a la vez en el mismo bloque.

### Secondary

- **Faja amarilla** `#ffd21f`: solo para las fajas cruzadas que se pegan sobre el cartel (RESERVADO, ¡CONSULTA ENVIADA!) y para la selección de texto y el foco. Nunca como fondo de sección.

### Neutral

- **Pared** `#e6e7e2`: fondo de página, gris frío de revoque. No es crema.
- **Chapa** `#fbfbf8` y **chapa-2** `#f0f1ec`: superficies de tarjetas, campos y bandas claras.
- **Tinta** `#141414`, `#45484d`, `#6a6e74`: texto principal, secundario y terciario. El negro también dibuja todos los filetes de 2px.
- **WhatsApp** `#177f45`: solo en botones que abren `wa.me`.

### Named Rules

- **Un verbo, un color.** Venta es rojo y alquiler es azul en toda la página; el color siempre dice la operación.
- **El amarillo se pega, no se pinta.** Solo aparece como faja diagonal o como foco.

## Typography

Una superfamilia argentina-friendly en dos anchos: **Sofia Sans Extra Condensed** 800/900 en mayúsculas para todo lo que es letra de cartel (verbos, precios, títulos de sección, botones, rótulos) y **Sofia Sans** variable para lectura (títulos de propiedad, descripciones, formularios). Se sirven desde el propio proyecto con `@fontsource`, sin pedir a Google Fonts.

### Hierarchy

- **Verbo** (hero y banda del listado): 84 a 212px, interlínea 0.82.
- **Cartel** (precios, títulos de sección, botones): 34 a 88px.
- **Rótulo** (etiquetas de campos, nav, metadatos): 13 a 17px, tracking 0.04em.
- **Título de propiedad**: Sofia Sans 800, 30 a 46px.
- **Cuerpo**: 16 a 18px, cifras tabulares, medida máxima 68ch.

### Named Rules

- **El precio es letra de cartel.** Nunca en la fuente de lectura.
- **Sin eyebrows.** Ningún rótulo encima de un título; el dato va en la línea de abajo.

## Layout

Contenedor de 1440px con 12px de margen en celular y 24px desde 640px. Grillas de tarjetas de 1, 2 y 3 columnas con 20px de separación. La ficha usa dos columnas en desktop (galería y texto a la izquierda, panel-cartel fijo de 420px a la derecha) y en celular apila galería, título, panel-cartel y descripción, con una barra fija abajo que lleva el precio y "Me interesa".

## Elevation & Depth

Plano. Profundidad solo donde el objeto la tiene: la faja pegada lleva una sombra corta y difusa (`0 6px 14px -6px`). Nada de sombras de tarjeta ni sombras duras desplazadas.

## Shapes

Chapas con esquinas de 3px; todo lo demás es recto. Filetes de 2px en tinta. Los remaches son agujeros planos (círculo del color de la pared con aro de tinta), sin brillo falso.

## Components

### Cartel del hero (signature)

La chapa grande en el color de la operación, atada con dos alambres a la línea del header y con cuatro remaches. Los verbos VENDE / ALQUILA son el selector (role tablist): el activo va lleno, el otro en contorno. Al cambiar, la chapa se mece colgada de los alambres (1.1s, ease-out-expo) y la página cambia de color. Debajo, la línea del buscador y, al pie, el nombre de la inmobiliaria y las ciudades.

### Línea del buscador

Un formulario GET (funciona sin JavaScript) en una franja de chapa con filetes de 2px: barrio, tipo, ambientes, precio máximo y el botón negro "VER N" con flecha dibujada.

### Tarjeta de propiedad

Foto 4:3 arriba, franja del cartel en el color de la operación con el verbo y el precio, y abajo título, datos (ambientes, m², baños, cochera) y "barrio · calle al 1200". Reservada lleva la faja amarilla cruzada sobre la foto. Hover: sube 4px y la foto se acerca.

### Panel-cartel de la ficha

Cabecera en color con remaches, pestañas VENTA / ALQUILER si tiene las dos, verbo de 88px y precio de 56px. Tabla de datos en 2 columnas con filetes. Formulario "¿Te interesa?" (nombre, WhatsApp, mail opcional, mensaje precargado) y botón negro "ME INTERESA". Al enviar se pega la faja "¡CONSULTA ENVIADA!" y aparece el atajo a WhatsApp.

### Faja (signature)

Banda amarilla con filete negro arriba y abajo, rotada -9°, en letra de cartel. Entra con un golpe de escala (520ms).

### Barrios

Chapitas con el nombre del barrio en letra de cartel y la cantidad en el color de la operación.

## Do's and Don'ts

### Do:

- Usá `data-op` para que el color siga a la operación.
- Mostrá la altura de la calle ("Azcuénaga al 1200"), nunca el número exacto ni datos del inquilino.
- Etiquetá los datos de demostración en el pie.

### Don't:

- No uses gradientes, vidrio ni sombras suaves de tarjeta.
- No pongas rojo y azul juntos en el mismo bloque.
- No imites metal con brillos o biseles; la chapa es plana.
- No uses glifos Unicode como íconos: las flechas son SVG.
