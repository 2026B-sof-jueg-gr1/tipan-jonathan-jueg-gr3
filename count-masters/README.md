# CROWD CONQUEST: GATE RUSH

Runner 2D de multitudes para navegador, construido con **Phaser 4.2.1**, **Vite** y **JavaScript (ES2022)**.
Atraviesa una pista llena de puertas matemáticas, esquiva obstáculos, recoge monedas y llega con la
multitud más grande que la del rival para conquistar el castillo.

> Proyecto original e independiente. No está afiliado a *Count Masters* ni a sus autores.
> Todo el arte y el sonido se generan por código: no hay imágenes ni audios externos.

---

## 1. Qué es el juego

Eres una multitud que avanza automáticamente por una pista vertical. No controlas la velocidad:
solo decides **por dónde pasar**. Cada línea de puertas ofrece dos operaciones (`+n`, `−n`, `×n`) y
debes elegir la que más te convenga antes de cruzarla. Los obstáculos restan integrantes y las
monedas se acumulan entre partidas para comprar mejoras.

El objetivo de cada nivel es llegar al enfrentamiento final con más población que el rival. En el
último nivel el rival es el **rey del castillo**: si ganas, el castillo se rinde y queda conquistado.

El juego incluye seis pantallas: arranque, menú, selección de nivel, mejoras, partida y resultados.

## 2. Mecánicas incluidas

- **Avance automático** sobre una pista de 520 px de ancho dentro de un mundo de 1600 × 4600.
- **Control lateral** por arrastre (ratón o dedo) y por teclado (`←` `→`, `A` `D`), con aceleración
  y velocidad máxima, nunca teletransporte.
- **Cámara** que sigue al grupo solo en vertical; el HUD queda fijo en pantalla.
- **Puertas matemáticas** por parejas: suma, resta y multiplicación. Cada pareja se resuelve **una
  sola vez** y solo cuenta la puerta del lado por el que pasas.
- **Tres tipos de obstáculo**: sierra oscilante, barrera con hueco practicable y bloque de impacto.
- **Monedas** repartidas por el recorrido, recogidas una sola vez cada una.
- **Combate determinista**: `Pf = max(0, Pi − Ei)` y `Ef = max(0, Ei − Pi)`. Empate ⇒ pierde el jugador.
- **Jefe final y conquista del castillo** en el nivel 3.
- **Tres niveles** con datos, velocidades, recompensas y dificultad propias.
- **Mejoras persistentes**: refuerzos iniciales (+5 integrantes por nivel) y bonificación de monedas
  (+20 % por nivel).
- **Pausa** con continuar, reiniciar nivel y volver al menú; **reintento directo** tras la derrota.
- **Progreso guardado** en `localStorage`, con recompensas que nunca se duplican.
- **Sonido procedural** opcional (WebAudio), desactivable desde el menú.

### Controles

| Acción | Ratón / táctil | Teclado |
| --- | --- | --- |
| Mover la multitud | Arrastrar en horizontal | `←` `→` o `A` `D` |
| Pausar | Botón `II` del HUD | — |

Los punteros que nacen en la franja superior (HUD) no arrastran a la multitud, para que el botón de
pausa sea siempre pulsable.

## 3. Versión de Phaser

**Phaser 4.2.1**, fijada exactamente en `package.json` (`"phaser": "4.2.1"`, sin `^` ni `~`).

El proyecto usa exclusivamente API de Phaser 4. Dos diferencias importantes respecto a Phaser 3 que
condicionaron la implementación:

- `setScrollFactor(x, y)` **ya no acepta** el tercer argumento `updateChildren`. El hit-test de un
  hijo de `Container` usa el `scrollFactor` del **hijo**, no el del contenedor, así que hay que
  propagarlo a mano (`UI.fixScrollFactor`). Sin esto, un HUD fijo deja de responder en cuanto la
  cámara se desplaza.
- Al cerrar una escena, los *plugins* de Phaser 4 ya han destruido los GameObjects y han anulado
  `physics.world` **antes** de que se ejecute el manejador `SHUTDOWN` del usuario. Por eso el cierre
  de `GameScene` solo suelta referencias y no vuelve a destruir nada.

## 4. Cómo instalar las dependencias

```bash
npm install
```

Requiere Node.js 20 o superior (probado con Node 22).

## 5. Cómo iniciar el servidor local

```bash
npm run dev
```

Vite sirve el juego en `http://localhost:5173/`. Para ver la compilación de producción ya generada:

```bash
npm run preview
```

## 6. Cómo ejecutar las pruebas

```bash
npm test
```

Ejecuta `node --test`, que descubre automáticamente los archivos `*.test.js` del proyecto. La suite
es pura: **no necesita navegador ni instancia de Phaser**, porque las reglas viven en módulos sin
dependencias del motor.

| Archivo | Qué cubre |
| --- | --- |
| `tests/rules.test.js` | Operaciones de puerta, daño, combate, recompensas, compras y desbloqueos |
| `tests/states.test.js` | Máquina de estados: transiciones válidas, ilegales y bloqueo final |
| `tests/levels.test.js` | Validación de datos de nivel y simulación de mejor/peor ruta |
| `tests/progressManager.test.js` | Persistencia, datos corruptos, reinicio y recompensa única |

## 7. Cómo crear la compilación de producción

```bash
npm run build
```

Genera `dist/` con `base: './'` (rutas relativas, aptas para abrir desde un subdirectorio o un
servidor estático). Phaser se separa en su propio *chunk* mediante `manualChunks` en
`vite.config.js` — en Vite 8 (rolldown) esa opción **debe ser una función**, no un objeto.

## 8. Qué archivos contienen las reglas de puertas y combate

Todas las reglas son funciones puras, sin Phaser, y están en:

- **`src/gameplay/rules.js`** — el corazón matemático:
  - `applyGateOperation(population, { op, value })`: suma, resta (con suelo en 0) y multiplicación
    (redondeo hacia abajo), con recorte al máximo de población.
  - `resolveBattle(playerPopulation, enemyPopulation)`: devuelve un resultado congelado
    `{ playerSurvivors, enemySurvivors, playerWon, winner }`. Empate ⇒ gana el enemigo.
  - `computeHazardLoss` / `applyHazardDamage`, `calculateRewards`, `applyLevelReward`,
    `applyUpgradePurchase`, `sanitizeProgress`.
- **`src/gameplay/states.js`** — máquina de estados explícita
  (`READY → RUNNING → PAUSED / BATTLE → WIN_ANIMATION / WON / LOST`). Una transición ilegal lanza
  error; los estados terminales no se pueden abandonar.
- **`src/entities/Gate.js`** — la *detección de cruce*: `GatePair.isCrossed(previousY, currentY)`
  compara la Y anterior con la actual (`previousY > gate.y && currentY <= gate.y`), de modo que un
  salto grande entre fotogramas no se salta la línea. `resolve(playerX)` decide el lado y marca la
  pareja como resuelta.
- **`src/entities/Hazard.js`** — `evaluate(playerX, crowdHalfWidth)` decide si el cruce impacta,
  según el tipo de obstáculo.
- **`src/scenes/GameScene.js`** — orquesta: aplica las reglas anteriores una sola vez por objeto y
  nunca reimplementa la matemática.

## 9. Cómo añadir un cuarto nivel

1. Abre **`src/data/levels.js`** y añade un objeto al final del arreglo `LEVELS`:

```js
{
  id: 4,
  name: 'Nombre del nivel',
  subtitle: 'Subtítulo corto',
  description: 'Texto que aparece en la pantalla de selección.',
  startPopulation: 12,
  forwardSpeed: 170,
  startY: 4300,
  finishY: 450,
  reward: 160,
  hasCastle: false,
  theme: { curb: 0x9b5cff, accent: 0x9b5cff },

  gates: [
    { id: 'l4-g1', y: 3900, left: { op: 'add', value: 15 }, right: { op: 'mul', value: 2 } },
    // ...
  ],

  hazards: [
    { id: 'l4-h1', type: 'saw', y: 3300, x: 800, radius: 60, amplitude: 180, speed: 1.2, damage: 8 },
    // type: 'saw' | 'barrier' | 'block'
  ],

  collectibles: [
    { x: 760, y: 4000, value: 1 },
    // ...
  ],

  enemies: [
    { id: 'l4-e1', name: 'Rivales del desfiladero', y: 1200, triggerY: 1400, population: 120, isBoss: false },
  ],
}
```

2. No hay que tocar nada más: `LEVEL_COUNT`, el desbloqueo progresivo y las tarjetas de selección se
   derivan de `LEVELS`. El recorte de `highestUnlockedLevel` también usa la longitud del arreglo.

3. Ejecuta `npm test`. `tests/levels.test.js` valida automáticamente el nivel nuevo: contenido
   obligatorio, puertas ordenadas y separadas al menos 250 px, obstáculos dentro del mundo y lejos de
   las puertas, hueco de barrera dentro de la pista, monedas dentro de la pista, `triggerY` por encima
   del grupo enemigo e identificadores únicos. Además simula la **mejor** ruta (debe ganar) y la
   **peor** (debe perder); si tu nivel es imposible o trivial, la prueba falla y te dice cuál.

## 10. Cómo ajustar los valores de balanceo

| Qué quieres cambiar | Dónde |
| --- | --- |
| Velocidad de avance | `forwardSpeed` de cada nivel en `src/data/levels.js` |
| Población inicial | `startPopulation` del nivel |
| Dificultad del combate final | `population` del enemigo y `isBoss` |
| Recompensa en monedas | `reward` del nivel |
| Potencia de las puertas | `value` de cada `op` en `gates` |
| Castigo de los obstáculos | `damage` en `hazards` |
| Ritmo de las sierras | `amplitude` y `speed` en `hazards` |
| Agresividad del hueco | `gapCenter` y `gapWidth` de la barrera |
| Velocidad y aceleración lateral | `lateralMaxSpeed`, `lateralAcceleration` en `src/config/gameConfig.js` |
| Sensación de cámara | `cameraFollowRatio`, `cameraSmoothing` en `gameConfig.js` |
| Límite de sprites | `maxRenderedAllies`, `maxRenderedEnemies` en `gameConfig.js` |
| Coste y efecto de mejoras | `baseCost`, `costStep`, `effectPerLevel` en `src/data/upgrades.js` |
| Topes de población y monedas | `MAX_POPULATION`, `MAX_COINS` en `src/gameplay/rules.js` |

Después de cualquier cambio de balanceo, `npm test` vuelve a comprobar que cada nivel sigue siendo
ganable con buena ruta y perdedor con mala ruta.

## 11. Cómo funciona la representación limitada de la multitud

La **población lógica** y los **sprites dibujados** son cosas distintas. `CrowdManager` guarda un
número (`population`) que puede crecer hasta 99 999 y crea, como máximo, **100 sprites de aliados**
(y `EnemyCrowd` como máximo **80 de enemigos**).

- Los sprites se crean una vez y se reutilizan; nunca se instancian personajes durante la partida.
- `renderedCount` es `min(population, maxRendered)`, salvo que exista un `visualOverride` (lo usa la
  animación del combate para interpolar bajas).
- La formación se reconstruye con `columns = ceil(sqrt(n * 1.35))`, limitado a 10 columnas, y la
  escala de cada personaje se reduce hasta 0.55 cuando hay mucha gente, para que quepan en la pista.
- El HUD siempre muestra la **población real**, no el número de sprites.
- `halfWidth` de la formación alimenta la detección de obstáculos, de modo que una multitud grande
  ocupa más pista y le cuesta más esquivar.

Así el juego puede manejar cifras de miles sin degradar los fotogramas.

## 12. Cómo se guarda el progreso

- Clave de `localStorage`: **`crowd-conquest.progress.v1`** (definida en `src/config/gameConfig.js`).
- Lo gestiona `src/systems/ProgressManager.js`, que **sanea** todo lo que lee: si el JSON está
  corrupto o trae valores imposibles (monedas negativas, niveles fuera de rango, mejoras inventadas),
  vuelve a un progreso por defecto en lugar de romper el juego.
- Si `localStorage` no está disponible (modo privado, permisos), cae automáticamente en un
  almacenamiento en memoria para que la sesión siga siendo jugable.
- Estructura guardada:

```js
{
  version: 1,
  coins: 0,                    // monedas acumuladas, nunca negativas
  highestUnlockedLevel: 1,     // recortado a la cantidad real de niveles
  completedLevels: [],         // ids completados
  bestResults: {},             // mejores resultados por nivel
  upgrades: { startingCrowd: 0, coinBonus: 0 },
  settings: { soundEnabled: true },
  totalRuns: 0,
  totalWins: 0,
  lastReward: null,            // { runId, ... } para evitar recompensas duplicadas
}
```

- **Recompensas idempotentes**: cada partida genera un `runId`; `applyLevelReward` compara con
  `lastReward.runId` y, si coincide, no vuelve a pagar (`reason: 'already-rewarded'`). Así un doble
  clic o una recreación de escena no duplican monedas.
- **Derrota** ⇒ no se otorgan monedas ni se desbloquea nada; solo se registra la partida.
- **Reiniciar progreso** está protegido por un diálogo de confirmación y borra la clave del
  almacenamiento.

---

## Estructura del proyecto

```text
count-masters/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── src/
│   ├── main.js                  # Instancia de Phaser y arranque
│   ├── config/gameConfig.js     # Dimensiones, mundo, pista, velocidades, colores, profundidades
│   ├── data/
│   │   ├── levels.js            # Los tres niveles
│   │   └── upgrades.js          # Catálogo de mejoras y costes
│   ├── gameplay/
│   │   ├── rules.js             # Reglas puras: puertas, combate, recompensas, progreso
│   │   └── states.js            # Máquina de estados
│   ├── entities/
│   │   ├── CrowdManager.js      # Población lógica + formación de sprites
│   │   ├── EnemyCrowd.js        # Multitud rival y jefe
│   │   ├── Gate.js              # Puerta y pareja de puertas
│   │   ├── Hazard.js            # Sierra, barrera y bloque
│   │   └── Collectible.js       # Monedas
│   ├── systems/
│   │   ├── TrackRenderer.js     # Pista, líneas, decoración y castillo
│   │   ├── InputController.js   # Teclado, arrastre y límites
│   │   ├── LevelFactory.js      # Construye un nivel a partir de sus datos
│   │   ├── ProgressManager.js   # Persistencia
│   │   ├── AudioManager.js      # Tonos procedurales con WebAudio
│   │   └── TextureFactory.js    # Texturas generadas con Graphics
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MainMenuScene.js
│   │   ├── LevelSelectScene.js
│   │   ├── UpgradeScene.js
│   │   ├── GameScene.js
│   │   └── ResultScene.js
│   ├── ui/UIComponents.js       # Paneles, botones, chips, barras, textos flotantes
│   └── styles/main.css
└── tests/
    ├── rules.test.js
    ├── states.test.js
    ├── levels.test.js
    └── progressManager.test.js
```

## Estados de la partida

```text
READY ──▶ RUNNING ──▶ BATTLE ──▶ RUNNING ──▶ WIN_ANIMATION ──▶ WON
  │           │  ▲        │
  │           │  └────────┘
  ├───────────┴──▶ PAUSED ──▶ RUNNING | BATTLE
  │
  └───────────┴──▶ LOST  (terminal)
```

- `READY`: cuenta regresiva, sin movimiento.
- `RUNNING`: avance automático y control lateral.
- `PAUSED`: el tiempo, los *tweens* y la física quedan congelados; la entrada se desactiva. Al
  reanudar se vuelve exactamente al estado desde el que se pausó.
- `BATTLE`: resolución determinista con animación de bajas.
- `WIN_ANIMATION` / `WON` / `LOST`: `WON` y `LOST` son terminales; la partida ya no se puede reanudar.

---

## Resultados verificados

Ejecutado realmente en este proyecto:

| Comprobación | Resultado |
| --- | --- |
| `npm test` | **59 pruebas, 59 correctas, 0 fallos** |
| `npm run build` | **Correcto** — `index` ≈ 81.7 kB, `phaser` ≈ 1 367 kB, CSS ≈ 0.9 kB |
| Partida completa en navegador (Chromium, WebGL) | **28/28 comprobaciones** |
| Navegación entre pantallas, mejoras y reinicio | **15/15 comprobaciones** |
| Niveles 2 y 3 jugados de principio a fin | Victoria, jefe derrotado y castillo conquistado |

Las comprobaciones de navegador se hicieron con un script externo (protocolo DevTools de Chrome)
que no forma parte del repositorio: no hay dependencia de Playwright ni de ningún *runner* de
navegador en `package.json`.

## Limitaciones conocidas

- **Sin audio grabado**: los sonidos son tonos sintetizados con WebAudio. Algunos navegadores
  requieren una primera interacción del usuario antes de permitir audio; por eso el desbloqueo
  ocurre al pulsar el primer botón.
- **Sin guardado en la nube**: el progreso vive en `localStorage`, por navegador y por origen.
  Borrar los datos del sitio lo elimina.
- **Una sola pista por nivel**: la geometría es fija (no hay ramificaciones); la variedad viene de
  las puertas, los obstáculos y las monedas.
- **La dificultad no se adapta**: los tres niveles tienen valores fijos; no hay escalado dinámico.
- **Sin tabla de récords ni multijugador**: `bestResults` guarda el mejor resultado local por nivel.
- **El límite de 100/80 sprites es visual**: la población lógica no tiene ese tope, así que una
  multitud de 5000 se ve igual que una de 100, pero se comporta como 5000 en puertas y combate.
- **Accesibilidad parcial**: hay contraste alto, etiquetas con texto además de color y objetivos
  táctiles amplios, pero no hay navegación por teclado en los menús ni lector de pantalla.
