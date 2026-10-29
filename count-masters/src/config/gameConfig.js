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
  worldWidth: 1600,
  worldHeight: 4600,
  worldCenterX: 800,

  // Pista transitable (centrada en worldCenterX).
  trackLeft: 540,
  trackRight: 1060,

  // Recorrido: se avanza desde startY (abajo) hacia finishY (arriba).
  startY: 4300,
  finishY: 450,

  // Población.
  maxPopulation: 99999,
  maxRenderedAllies: 100,
  maxRenderedEnemies: 80,

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
  maxPopulation: 99999,
  maxRenderedAllies: 100,
  maxRenderedEnemies: 80,

  horizontalSpacing: 20,
  verticalSpacing: 22,
  maxColumns: 10,

  minVisibleScale: 0.55,
  maxVisibleScale: 1.0,
});

export const COLORS = Object.freeze({
  background: 0x0b0f1c,
  backgroundHex: '#0b0f1c',
  terrain: 0x111731,
  terrainAlt: 0x151c3a,
  terrainEdge: 0x0a0e19,

  road: 0x232c47,
  roadInner: 0x2b3554,
  roadLine: 0x3d4870,
  shoulder: 0x1b2340,
  curbA: 0x2ee6a8,
  curbB: 0x1c2340,

  ally: 0x35e0d0,
  allyDark: 0x0f8f92,
  allyLight: 0xa8fff5,
  skin: 0xffe9d2,

  enemy: 0xff6b5b,
  enemyDark: 0xb0342c,
  enemyLight: 0xffc2b8,

  coin: 0xffc93c,
  coinDark: 0xb8860b,

  gain: 0x2ee6a8,
  loss: 0xff5f6d,
  multiply: 0xffc93c,
  hazard: 0xff8a3d,
  hazardDark: 0x7a2f12,
  boss: 0xb04cff,

  textHex: '#ffffff',
  textMutedHex: '#9fb0d0',
  textDarkHex: '#0b0f1c',

  panel: 0x141a30,
  panelLight: 0x1e2745,
  panelStroke: 0x33406b,
  accent: 0x5b7cfa,
  accentLight: 0x7f9bff,
  overlay: 0x05070f,
  gold: 0xffd166,
});

/** Capas de renderizado. Todo lo que comparte capa se dibuja por orden de creación. */
export const DEPTHS = Object.freeze({
  background: 0,
  track: 10,
  decoration: 20,
  gate: 30,
  hazard: 35,
  collectible: 40,
  enemy: 45,
  crowd: 50, // + fila (máx. 10) => 50..60
  effects: 70,
  hud: 1000,
  overlay: 1100,
  toast: 1200,
});

export const FONT_FAMILY =
  '"Trebuchet MS", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif';

export const STORAGE_KEY = 'crowd-conquest.progress.v1';
