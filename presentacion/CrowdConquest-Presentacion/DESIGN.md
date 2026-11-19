# DESIGN.md — Crowd Conquest: Gate Rush

> Taller T.05 · "El alma, el escaparate y la fábrica automática"
> Defensa de avance · Escuela Politécnica Nacional · 2026-B

## 0. Brief

| Dimensión | Decisión |
| --- | --- |
| Tema | Un juego web de sumar multitudes donde el enemigo solo sabe restar |
| Objetivo | Demostrar que el taller está cumplido: alma narrativa, escaparate y fábrica automática |
| Audiencia | Docente y compañeros de la asignatura (evalúan rúbrica del taller) |
| Duración | 12 páginas · ~12 minutos de exposición |
| Tono | Épico contenido: piedra, bronce y pergamino. Nada de neón ni "startup" |
| Idioma | Español (Ecuador) |

**Estilo elegido**: 极简编辑 / Editorial, con paleta propia de bronce y pergamino
en lugar de la azul de librería. Titulares en serifa (Georgia), cuerpo en
Segoe UI. Sin sombras, sin degradados decorativos, jerarquía por tamaño y por
una única línea de 1px bajo el titular.

---

## 1. Canvas y retícula

- Lienzo 1280×720. Padding 60 px en los cuatro lados.
- Área de contenido **1160×600** (y 60–660).
- Zona vertical:
  - **Kicker** (eyebrow): y 60, 14 px, versalitas, color acento.
  - **Titular**: y ≈ 82, 36 px Georgia Bold.
  - **Regla de 1 px**: y ≈ 156, ancho 1160.
  - **Cuerpo**: y 188–660 (alto 472–481).
  - **Pie**: y 670, 14 px. Solo en páginas de contenido. Nunca en cubierta,
    portadillas ni cierre.
- Sangrado total permitido solo en cubierta, portadillas y cierre.

## 2. Color

| Ranura | Valor | Uso |
| --- | --- | --- |
| Fondo | `#F6EFE3` | pergamino, fondo dominante |
| Superficie | `#EBE0CC` | bloques suaves, celdas de tabla |
| Línea | `#D6C7AE` | reglas de 1 px, separadores |
| Tinta | `#201709` | titulares |
| Secundario | `#4B3B29` | subtítulos, etiquetas |
| Cuerpo | `#3B2E20` | párrafos |
| Apagado | `#8B7860` | pie, notas, unidades |
| **Acento** | `#A6402A` | terracota: cifras clave, conclusión, kicker |
| Acento oscuro | `#7C2B1B` | acento sobre fondo claro en texto pequeño |
| Fondo profundo | `#17100A` | páginas oscuras (cubierta, portadillas, cierre) |
| Texto sobre profundo | `#F3E8D6` | cuerpo en página oscura |

**Colores de cohorte** (solo cuando se habla de ejércitos, nunca decorativos):
teal `#2E7266` (propio) · ámbar `#C08A2E` (colina) · azul `#3F5E9E` (vanguardia).

Disciplina: acento ≤ 5 % de la página (15–20 % solo en la cubierta y en la
página del umbral). Máximo 4 colores de texto por página.

## 3. Tipografía

- **Titulares / cifras**: `Georgia, 'Times New Roman', serif` — Bold.
- **Cuerpo / etiquetas**: `'Segoe UI', 'Trebuchet MS', sans-serif`.

| Nivel | px | Peso |
| --- | --- | --- |
| Titular de cubierta | 88 | Bold |
| Número de portadilla | 200 | Bold |
| Cifra ancla | 150–176 | Bold |
| Titular de página | 36 | Bold |
| Subtítulo / tarjeta | 22–24 | Bold |
| Cuerpo | 18–19 | Regular |
| Etiqueta / tabla | 16 | Regular |
| Kicker / pie | 14 | Regular |

Interlineado 1.55 en cuerpo, 1.2 en titulares. Espaciado de letras 2.4 px solo
en kicker y en el subtítulo "GATE RUSH".

## 4. Motivo visual

**Una sola regla horizontal de 1 px** (`#D6C7AE`) que atraviesa los 1160 px del
área de contenido, inmediatamente bajo el titular de página. Aparece únicamente
ahí: nunca bajo kickers, ni en tarjetas, ni en el pie. Es lo único que se repite
en las doce páginas y es lo que hace que el conjunto se lea como una pieza.

Segundo motivo, solo en páginas oscuras: el **filete vertical terracota de 3 px**
a la izquierda del bloque de texto de portadilla.

## 5. Inventario de imágenes

| Archivo | Uso | Origen | Contenido real | Páginas |
| --- | --- | --- | --- | --- |
| `assets/hero_concept.png` | ancla | ImageGen (recortada para eliminar la marca de agua) | Tres guerreros de perfil: casco teal con lanza, guerrero ámbar con hacha y capa, hoplita azul con escudo y cresta | P1 |
| `assets/game_portrait.png` | evidencia | Captura real del juego (recorte 9:16) | Nivel 3 con 238 efectivos, tres cohortes en bandas de color, puertas ×2 / +30 / −5 | P8 |
| `assets/game_full.png` | evidencia | Captura real 1920×1080 | El mismo nivel a pantalla completa: el desfiladero de roca y antorchas ocupa los laterales | P11 |
| `assets/landing.png` | ancla | Captura real de la landing | Héroe de la landing: logline, botón JUGAR AHORA, retícula de cohortes a la derecha | P10 |
| `assets/cohorts.png` | evidencia | Captura real ampliada | Detalle de las tres cohortes: teal con capa metálica, ámbar sin casco, azul con cresta y escudo | P8 |

Las tres capturas son del build real; no hay montajes.

## 6. Páginas

---

### P1 · Cubierta

| Campo | Valor |
| --- | --- |
| `type` | cover |
| `role` | hero |
| `rhythm` | peak |
| `layout` | 满版图 + 蒙层 degradado a la izquierda |
| `visual` | `hero_concept.png` a sangre, anclado al 68 % horizontal |
| `density` | palabras ~34 / imágenes 1 / vacío ~35 % |
| `anti_pattern` | Prohibido poner cifras o datos; prohibido el pie de página; prohibido centrar el título |
| `description` | Cubierta cinematográfica. Sobre la imagen a sangre, un degradado de `#17100A` cubre el 55 % izquierdo para que el texto tenga contraste ≥ 7:1. Kicker "TALLER T.05 · EL ALMA, EL ESCAPARATE Y LA FÁBRICA AUTOMÁTICA". Título "Crowd Conquest" a 88 px y debajo "GATE RUSH" a 22 px con 6 px de interletraje. Cierre: una línea de logline a 19 px y, al pie, autor, carrera y periodo. |

### P2 · Portadilla 01

| Campo | Valor |
| --- | --- |
| `type` | section |
| `role` | transition |
| `rhythm` | transition |
| `layout` | 章节大字 con número gigante a la izquierda |
| `visual` | Cifra "01" a 200 px en `#241812`, sangrada al borde izquierdo |
| `density` | palabras ~14 / imágenes 0 / vacío ~62 % |
| `anti_pattern` | Prohibido listar contenidos; prohibido poner tarjetas de vista previa |
| `description` | Página oscura. "01" gigante casi del color del fondo, encima el nombre del capítulo "El alma" a 56 px y una línea de 20 px: "por qué un juego de sumas necesita un rey que reste". Filete terracota de 3 px a la izquierda del bloque. |

### P3 · La premisa

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | supporting |
| `rhythm` | valley |
| `layout` | 宣言 a la izquierda (6) + tres reglas del mundo a la derecha (4) |
| `visual` | Comilla tipográfica de 120 px en `#D6C7AE` detrás del bloque izquierdo |
| `density` | palabras ~150 / imágenes 0 / vacío ~28 % |
| `anti_pattern` | Prohibido el 50:50; prohibido meter el logline en una tarjeta con borde |
| `description` | Izquierda: el logline completo a 30 px en Georgia, con "la única operación que él prohibió" en terracota. Derecha: tres reglas del mundo separadas por reglas de 1 px — "Cada persona es una cifra", "El rey solo resta", "Tú multiplicas". Cada regla con su etiqueta de 16 px en apagado. |

### P4 · Resonancia ludonarrativa

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | supporting |
| `rhythm` | valley |
| `layout` | Tres filas de correspondencia mecánica ↔ ficción |
| `visual` | Glifo de operación a 44 px en la primera columna de cada fila |
| `density` | palabras ~180 / imágenes 0 / vacío ~22 % |
| `anti_pattern` | Prohibido usar tarjetas de igual ancho; prohibido explicar la mecánica sin su lectura narrativa |
| `description` | Encabezado de tres columnas: "Lo que haces", "Lo que significa", "Lo que el jugador siente". Fila 1: sumar refuerzos → reclutar pueblos → crecer se siente como una obligación moral. Fila 2: restar bajas → el rey te desgasta → perder se siente como una derrota, no como un error. Fila 3: multiplicar → la única operación prohibida → la ventaja se siente como una transgresión. Conclusión de una línea al pie del bloque. |

### P5 · Las tres operaciones

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | supporting |
| `rhythm` | valley |
| `layout` | 三栏 no iguales (5:3:3), la columna de multiplicar destacada |
| `visual` | Las tres puertas dibujadas como rectángulos de 1 px con su glifo dentro |
| `density` | palabras ~160 / imágenes 0 / vacío ~24 % |
| `anti_pattern` | Prohibido el reparto equitativo de columnas; prohibido poner iconos decorativos |
| `description` | Tres puertas en la pista. Izquierda, más ancha: "MULTIPLICA ×2" en terracota, con la explicación de que duplica el ejército y es la única que el rey no puede usar. Centro: "REFUERZOS +40". Derecha: "BAJAS −5". Bajo las tres, una línea que explica que las puertas aparecen en el orden que decide el nivel, y que elegir es el juego. |

### P6 · El umbral

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | hero |
| `rhythm` | peak |
| `layout` | 巨型数字 + 洞察 |
| `visual` | "150" a 176 px en `#F3E8D6` sobre fondo profundo |
| `density` | palabras ~95 / imágenes 0 / vacío ~46 % |
| `anti_pattern` | Prohibido acompañar la cifra con una tarjeta; prohibido poner la cifra y su lectura en la misma línea |
| `description` | Página oscura. "150" ocupa la mitad izquierda. Debajo, alineado a la izquierda, el subtítulo "la lección está en el número 150". A la derecha, tres líneas que explican por qué: por debajo de 150 el ejército se extingue antes de la ciudadela; por encima, la multiplicación se vuelve una tentación; el nivel está calibrado para que solo una decisión correcta cruce el umbral. |

### P7 · Portadilla 02

| Campo | Valor |
| --- | --- |
| `type` | section |
| `role` | transition |
| `rhythm` | transition |
| `layout` | 章节大字 con número gigante a la izquierda |
| `visual` | Cifra "02" a 200 px |
| `density` | palabras ~14 / imágenes 0 / vacío ~62 % |
| `anti_pattern` | Prohibido repetir la retícula de P2 con otro color; prohibido añadir imagen |
| `description` | Misma retícula que P2 pero invertida: el número a la derecha y el texto a la izquierda, para que las dos portadillas no se lean como la misma página. "02 — La campaña y la fábrica": "tres reinos que se suman y un tubo que publica solo". |

### P8 · La campaña y las cohortes

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | supporting |
| `rhythm` | valley |
| `layout` | 左图右文 6:4 con captura vertical |
| `visual` | `game_portrait.png` a 300×533 a la izquierda |
| `density` | palabras ~170 / imágenes 1 / vacío ~20 % |
| `anti_pattern` | Prohibido recortar la captura en horizontal; prohibido taparla con texto |
| `description` | Izquierda, la captura vertical del nivel 3 con las tres cohortes en bandas. Derecha: tres reinos conquistados (Colina, Vanguardia, Ciudadela) y la regla de Poros — el rey vencido conserva su trono y su gente se suma con su propio color. Cierre: la cifra "3 pueblos en marcha" del HUD como prueba de que el mosaico no es decorativo. |

### P9 · Marco legal y muro de honor

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | supporting |
| `rhythm` | valley |
| `layout` | 对比式: dos bloques separados por un filete vertical |
| `visual` | Insignia PEGI 3 dibujada en SVG a 96×118 |
| `density` | palabras ~190 / imágenes 0 / vacío ~18 % |
| `anti_pattern` | Prohibido usar el logo oficial de PEGI; prohibido listar licencias sin decir qué se usó |
| `description` | Izquierda: insignia PEGI 3 propia (no el logo oficial) y tres razones de la calificación — sin sangre, sin lenguaje soez, la violencia es una cifra que sube o baja. Derecha: "Muro de Honor" con cuatro entradas y su licencia: Phaser 4 (MIT), Vite (MIT), texturas procedurales generadas en tiempo de ejecución (0 assets externos), tipografías del sistema. Al pie, la nota de privacidad: el progreso vive en localStorage, no hay servidor ni cuentas. |

### P10 · El escaparate

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | hero |
| `rhythm` | peak |
| `layout` | 左图右文 6:4 con la landing como ancla |
| `visual` | `landing.png` a 660×412 a la izquierda, con borde de 1 px |
| `density` | palabras ~120 / imágenes 1 / vacío ~26 % |
| `anti_pattern` | Prohibido poner la captura a sangre completa; prohibido explicar la landing con una lista de secciones |
| `description` | Página oscura. Arriba, la captura de la landing con su titular y su botón. Debajo, tres lecturas: "el logline está en la primera pantalla, no en un párrafo", "el botón JUGAR ocupa 380 px de ancho", "la sección legal está en la misma página, no en un pie diminuto". Cierre: la landing y el juego son el mismo producto, no dos entregas. |

### P11 · La fábrica automática

| Campo | Valor |
| --- | --- |
| `type` | content |
| `role` | supporting |
| `rhythm` | valley |
| `layout` | 流程链 de cuatro etapas con flechas |
| `visual` | `game_band.png` como banda inferior de 1160×270, mostrando el desfiladero |
| `density` | palabras ~165 / imágenes 1 / vacío ~16 % |
| `anti_pattern` | Prohibido dibujar la cadena como cuatro tarjetas iguales; prohibido omitir el paso de pruebas |
| `description` | Cadena horizontal: `git push` → GitHub Actions (npm test, 59 pruebas; npm run build) → dos destinos en paralelo: GitHub Pages y Butler → itch.io. Cada etapa con su salida concreta. Debajo, la captura a pantalla completa que demuestra el punto de la izquierda: el desfiladero ocupa el espacio que el formato 9:16 deja libre. |

### P12 · Cierre

| Campo | Valor |
| --- | --- |
| `type` | ending |
| `role` | hero |
| `rhythm` | peak |
| `layout` | 收束金句 + 落款 con QR |
| `visual` | Código QR de 180 px a la derecha |
| `density` | palabras ~40 / imágenes 0 / vacío ~58 % |
| `anti_pattern` | Prohibido poner solo "Gracias"; prohibido repetir la imagen de la cubierta |
| `description` | Página oscura. Frase de cierre a 54 px: "El rey resta. Tú multiplicas." Debajo, el enlace al juego, el enlace al repositorio y un QR que lleva al juego publicado, con la instrucción de escanearlo. Al pie, autor y asignatura. |
