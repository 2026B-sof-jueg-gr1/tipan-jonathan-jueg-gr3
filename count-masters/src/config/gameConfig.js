/**
 * Parámetros globales de CROWD CONQUEST: GATE RUSH.
 *
 * Este módulo es deliberadamente puro (no importa Phaser) para que las reglas
 * de juego y las pruebas unitarias puedan reutilizarlo en Node sin crear una
 * instancia del motor.
 *
 * Nota de diseño: la pista original propuesta (460..1140) ocupaba 680 px de un
 * viewport de 720 px, dejando apenas 20 px de decoración lateral. Se ajustó a
 * 540..1060 (520 px de ancho) manteniendo el centro en `worldCenterX` = 800,
 * de modo que la cámara fija en X muestra 100 px de escenario a cada lado y la
 * multitud sigue teniendo 520 px de pista real para desplazarse.
 */

export const GAME_CONFIG = Object.freeze({
  // Área lógica (formato vertical 9:16).
  width: 720,
  height: 1280,

  // Mundo. Mucho más alto que el viewport para que la cámara tenga recorrido.
  // Se amplió para que cada nivel dure cerca de un minuto: la pista corta hacía
  // que el juego se sintiera como una demo.
  worldWidth: 1600,
  worldHeight: 7600,
  worldCenterX: 800,

  // Pista transitable (centrada en worldCenterX).
  trackLeft: 540,
  trackRight: 1060,

  // Recorrido por defecto: se avanza desde startY (abajo) hacia finishY
  // (arriba). Cada nivel puede sobrescribirlo.
  startY: 6900,
  finishY: 560,

  // Población. El techo se fija en 5 000 para que las cifras se mantengan en el
  // orden de magnitud de un ejército antiguo real: un número creíble de personas
  // en vez de una cifra abstracta imposible de representar.
  maxPopulation: 5000,
  maxRenderedAllies: 60,
  maxRenderedEnemies: 48,

  // Movimiento (unidades de mundo por segundo).
  forwardSpeed: 145,
  lateralMaxSpeed: 660,
  lateralAcceleration: 4600,
  pointerDeadZone: 4,

  // Cámara.
  cameraFollowRatio: 0.66, // el grupo queda al 66 % de la altura de pantalla
  cameraSmoothing: 7, // constante de suavizado exponencial (1/s)

  // Reglas de interacción.
  gatePanelDepth: 200, // altura visual del panel de puerta
  battleTriggerDistance: 240,
  pickupPadding: 26,
  countdownStep: 620,

  // Zona superior reservada al HUD: los punteros que nacen aquí no arrastran.
  hudTopInset: 200,
});

export const TRACK_WIDTH = GAME_CONFIG.trackRight - GAME_CONFIG.trackLeft;
export const TRACK_CENTER = (GAME_CONFIG.trackLeft + GAME_CONFIG.trackRight) / 2;
export const TRACK_LENGTH = GAME_CONFIG.startY - GAME_CONFIG.finishY;
export const CAMERA_SCROLL_X = GAME_CONFIG.worldCenterX - GAME_CONFIG.width / 2;

/**
 * Límites de representación de la multitud. La población lógica es
 * independiente del número de sprites: nunca se instancian más de
 * `maxRenderedAllies` / `maxRenderedEnemies` personajes.
 */
export const CROWD_CONFIG = Object.freeze({
  maxPopulation: 5000,
  // El número de sprites se recortó al crecer cada figura a 1,4×. Con 100
  // personajes de 64 px de alto la formación medía más de 440 px —un tercio de
  // la pantalla— y tapaba puertas y obstáculos. Con 60 la multitud sigue
  // leyéndose como hueste y deja ver la pista.
  maxRenderedAllies: 60,
  maxRenderedEnemies: 48,

  // Los espaciados acompañan al horneado de personajes a 1,4×. La separación
  // vertical (44 px) es casi la altura de la figura (64 px × 0,8), así que las
  // filas apenas se solapan y cada soldado conserva su silueta.
  horizontalSpacing: 24,
  verticalSpacing: 44,
  maxColumns: 10,

  // La escala mínima se mantiene alta a propósito: una multitud grande debe
  // ocupar más pista, no encogerse hasta parecer un detalle del escenario.
  minVisibleScale: 0.8,
  maxVisibleScale: 1.0,
});

/**
 * Paleta del juego.
 *
 * Es la MISMA que la landing page (`index.html`): piedra, bronce y pergamino.
 * El objetivo es que la portada y el juego se lean como una sola pieza, no como
 * dos productos distintos. Nada de azul corporativo ni de verde neón.
 */
export const COLORS = Object.freeze({
  // Fondo y terreno.
  background: 0x0a0806,
  backgroundHex: '#0a0806',
  terrain: 0x1c130c,
  terrainAlt: 0x241a12,
  terrainDeep: 0x120c08,
  terrainEdge: 0x0d0906,

  // Calzada de tierra apisonada.
  road: 0x3a2b1c,
  roadInner: 0x453322,
  roadLine: 0x6b5136,
  shoulder: 0x2a1e14,
  curbA: 0xc98a3c,
  curbB: 0x4a3624,

  // Personajes.
  ally: 0x35e0d0,
  allyDark: 0x0f8f92,
  allyLight: 0xa8fff5,
  skin: 0xf0c9a0,

  enemy: 0xc4472f,
  enemyDark: 0x6e1f12,
  enemyLight: 0xe89a80,

  // Objetos.
  coin: 0xf2c879,
  coinDark: 0x8a5f1e,

  // Semántica de juego.
  gain: 0x3fc9b0,
  loss: 0xc4543a,
  multiply: 0xf2c879,
  hazard: 0xc9702f,
  hazardDark: 0x4a2410,
  boss: 0x8e2f4a,

  // Texto.
  textHex: '#efe4d2',
  textMutedHex: '#a2937e',
  textDimHex: '#7d6f5d',
  textDarkHex: '#0a0806',

  // Superficies de interfaz.
  panel: 0x16100b,
  panelLight: 0x241a12,
  panelStroke: 0x4a3624,
  accent: 0xb4552f,
  accentLight: 0xd4713f,
  overlay: 0x050302,
  gold: 0xf2c879,
  bronze: 0xc98a3c,
  bone: 0xefe4d2,
  teal: 0x35e0d0,
});

/**
 * Cohortes aliadas.
 *
 * Cada pueblo que se suma a la campaña aporta una silueta y un color de
 * estandarte propios. El color NUNCA cambia el comportamiento: solo indica a
 * qué pueblo pertenece cada integrante. La cifra del HUD sigue siendo la única
 * fuente de verdad sobre el tamaño de la multitud.
 *
 * `own` es el pueblo del jugador; los demás se desbloquean al conquistar.
 */
export const COHORTS = Object.freeze({
  own: {
    id: 'own',
    name: 'Tu pueblo',
    texture: 'ally',
    body: 0x35e0d0,
    dark: 0x0f8f92,
    light: 0xa8fff5,
    headband: 0x0d5f66,
    helmet: 'cap',
    weapon: 'spear',
    shield: false,
    cape: null,
  },
  hill: {
    id: 'hill',
    name: 'Clan de la colina',
    texture: 'ally_hill',
    body: 0xf0a63c,
    dark: 0x9a5f14,
    light: 0xffd79a,
    headband: 0x6b3f08,
    helmet: 'none',
    weapon: 'axe',
    shield: false,
    cape: 0x7a4a12,
  },
  vanguard: {
    id: 'vanguard',
    name: 'Vanguardia',
    texture: 'ally_vanguard',
    body: 0x5b8cf5,
    dark: 0x2b4a9e,
    light: 0xb9ccff,
    headband: 0x1c2f6b,
    helmet: 'crest',
    weapon: 'spear',
    shield: true,
    cape: null,
  },
});

/** Orden estable de cohortes: sirve para comparar y para el saneado del progreso. */
export const COHORT_IDS = Object.freeze(Object.keys(COHORTS).filter((id) => id !== 'own'));

/**
 * Peso visual de cada cohorte dentro de la formación. El pueblo propio ocupa
 * siempre la vanguardia; los aliados se reparten la retaguardia.
 */
export const COHORT_WEIGHTS = Object.freeze({ own: 3, hill: 2, vanguard: 2 });

/** Capas de renderizado. Todo lo que comparte capa se dibuja por orden de creación. */
export const DEPTHS = Object.freeze({
  background: 0,
  track: 10,
  decoration: 20,
  collectible: 40,
  enemy: 45,
  crowd: 50, // + fila (máx. 10) => 50..60
  // Puertas y obstáculos van POR ENCIMA de la multitud. La cifra de la puerta
  // es la información que decide la partida: si la multitud la tapa justo
  // cuando hay que elegir, el jugador elige a ciegas. Que la formación pase por
  // detrás del estandarte es además lo que hacen los runners del género.
  gate: 64,
  hazard: 66,
  effects: 70,
  hud: 1000,
  overlay: 1100,
  toast: 1200,
});

export const FONT_FAMILY =
  '"Segoe UI", system-ui, -apple-system, "Trebuchet MS", Roboto, sans-serif';

/**
 * Tipografía de titulares. Es la misma serifa de la landing page: la que
 * convierte una cifra en una inscripción y un título en un rótulo de piedra.
 */
export const FONT_DISPLAY = 'Georgia, "Times New Roman", "Iowan Old Style", serif';

export const STORAGE_KEY = 'crowd-conquest.progress.v1';
