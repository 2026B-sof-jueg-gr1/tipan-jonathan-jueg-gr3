/**
 * Datos de los niveles jugables.
 *
 * Convenciones:
 * - El recorrido avanza desde `startY` (abajo) hacia `finishY` (arriba), por lo
 *   que las posiciones se ordenan de mayor a menor Y.
 * - Cada puerta (`gates`) define la pareja izquierda/derecha de una misma línea
 *   de activación. `op` puede ser 'add', 'sub' o 'mul'.
 * - Cada obstáculo (`hazards`) define su tipo ('saw', 'barrier' o 'block'), su
 *   posición, su penalización y sus parámetros de colisión.
 * - Cada enemigo (`enemies`) define su población y la línea que dispara la
 *   batalla (`triggerY`, siempre por debajo del grupo enemigo).
 *
 * Los valores están balanceados con `tests/levels.test.js`, que simula la mejor
 * ruta posible de cada nivel y comprueba que la población sobrevive al combate
 * final, y una ruta desfavorable que debe terminar en derrota.
 */

export const LEVELS = [
  {
    id: 1,
    name: 'Primer avance',
    subtitle: 'Aprende a elegir',
    description:
      'Puertas sencillas, un obstáculo fijo y una barrera con hueco. Ideal para dominar el control lateral.',
    startPopulation: 1,
    forwardSpeed: 145,
    startY: 4300,
    finishY: 450,
    reward: 40,
    hasCastle: false,
    theme: { curb: 0x2ee6a8, accent: 0x2ee6a8 },

    gates: [
      { id: 'l1-g1', y: 3850, left: { op: 'add', value: 10 }, right: { op: 'add', value: 5 } },
      { id: 'l1-g2', y: 3400, left: { op: 'mul', value: 2 }, right: { op: 'add', value: 8 } },
      { id: 'l1-g3', y: 2600, left: { op: 'add', value: 12 }, right: { op: 'sub', value: 6 } },
      { id: 'l1-g4', y: 1900, left: { op: 'add', value: 20 }, right: { op: 'mul', value: 2 } },
    ],

    hazards: [
      {
        id: 'l1-h1',
        type: 'barrier',
        y: 3050,
        gapCenter: 900,
        gapWidth: 230,
        damage: 6,
      },
      {
        id: 'l1-h2',
        type: 'block',
        y: 2250,
        x: 650,
        radius: 78,
        damage: 5,
      },
    ],

    collectibles: [
      { x: 760, y: 4050, value: 1 },
      { x: 650, y: 3700, value: 1 },
      { x: 930, y: 3620, value: 1 },
      { x: 700, y: 3300, value: 2 },
      { x: 880, y: 3150, value: 1 },
      { x: 620, y: 2820, value: 1 },
      { x: 960, y: 2700, value: 1 },
      { x: 760, y: 2400, value: 2 },
      { x: 640, y: 2100, value: 1 },
      { x: 900, y: 1780, value: 1 },
      { x: 760, y: 1600, value: 2 },
      { x: 620, y: 1450, value: 1 },
    ],

    enemies: [
      {
        id: 'l1-e1',
        name: 'Rivales de la colina',
        y: 1150,
        triggerY: 1350,
        population: 35,
        isBoss: false,
      },
    ],
  },

  {
    id: 2,
    name: 'Doble sierra',
    subtitle: 'Ritmo y anticipación',
    description:
      'Sierras en movimiento, barrera con hueco y dos enfrentamientos. Necesitarás posicionarte antes de cada línea.',
    startPopulation: 5,
    forwardSpeed: 158,
    startY: 4300,
    finishY: 450,
    reward: 70,
    hasCastle: false,
    theme: { curb: 0x5b7cfa, accent: 0x5b7cfa },

    gates: [
      { id: 'l2-g1', y: 4100, left: { op: 'mul', value: 2 }, right: { op: 'add', value: 15 } },
      { id: 'l2-g2', y: 3500, left: { op: 'add', value: 25 }, right: { op: 'add', value: 10 } },
      { id: 'l2-g3', y: 3050, left: { op: 'sub', value: 5 }, right: { op: 'add', value: 18 } },
      { id: 'l2-g4', y: 2500, left: { op: 'mul', value: 2 }, right: { op: 'add', value: 30 } },
      { id: 'l2-g5', y: 1850, left: { op: 'add', value: 40 }, right: { op: 'mul', value: 2 } },
      { id: 'l2-g6', y: 1450, left: { op: 'add', value: 25 }, right: { op: 'sub', value: 10 } },
    ],

    hazards: [
      {
        id: 'l2-h1',
        type: 'saw',
        y: 3800,
        x: 800,
        amplitude: 165,
        speed: 1.15,
        phase: 0,
        radius: 54,
        damage: 10,
      },
      {
        id: 'l2-h2',
        type: 'barrier',
        y: 2800,
        gapCenter: 950,
        gapWidth: 205,
        damage: 15,
      },
      {
        id: 'l2-h3',
        type: 'saw',
        y: 2150,
        x: 800,
        amplitude: 205,
        speed: 1.55,
        phase: 1.9,
        radius: 58,
        damage: 12,
      },
    ],

    collectibles: [
      { x: 700, y: 4200, value: 1 },
      { x: 900, y: 3950, value: 2 },
      { x: 640, y: 3650, value: 1 },
      { x: 960, y: 3300, value: 2 },
      { x: 780, y: 3200, value: 1 },
      { x: 620, y: 2900, value: 1 },
      { x: 900, y: 2600, value: 2 },
      { x: 700, y: 2350, value: 1 },
      { x: 960, y: 2250, value: 1 },
      { x: 640, y: 2050, value: 2 },
      { x: 820, y: 1750, value: 1 },
      { x: 700, y: 1600, value: 1 },
      { x: 940, y: 1550, value: 2 },
      { x: 780, y: 1380, value: 1 },
    ],

    enemies: [
      {
        id: 'l2-e1',
        name: 'Guardia intermedia',
        y: 1100,
        triggerY: 1300,
        population: 45,
        isBoss: false,
      },
      {
        id: 'l2-e2',
        name: 'Vanguardia enemiga',
        y: 700,
        triggerY: 900,
        population: 90,
        isBoss: false,
      },
    ],
  },

  {
    id: 3,
    name: 'La conquista',
    subtitle: 'El rey del castillo',
    description:
      'Recorrido largo, obstáculos severos y un ejército real de 400 integrantes custodiando el castillo.',
    startPopulation: 10,
    forwardSpeed: 165,
    startY: 4300,
    finishY: 450,
    reward: 120,
    hasCastle: true,
    theme: { curb: 0xb04cff, accent: 0xffc93c },

    gates: [
      { id: 'l3-g1', y: 4100, left: { op: 'add', value: 20 }, right: { op: 'sub', value: 5 } },
      { id: 'l3-g2', y: 3520, left: { op: 'mul', value: 2 }, right: { op: 'add', value: 30 } },
      { id: 'l3-g3', y: 3100, left: { op: 'add', value: 40 }, right: { op: 'mul', value: 1.5 } },
      { id: 'l3-g4', y: 2480, left: { op: 'sub', value: 15 }, right: { op: 'add', value: 35 } },
      { id: 'l3-g5', y: 1900, left: { op: 'mul', value: 2 }, right: { op: 'add', value: 50 } },
      { id: 'l3-g6', y: 1300, left: { op: 'add', value: 150 }, right: { op: 'mul', value: 2 } },
    ],

    hazards: [
      {
        id: 'l3-h1',
        type: 'saw',
        y: 3820,
        x: 800,
        amplitude: 175,
        speed: 1.35,
        phase: 0.6,
        radius: 56,
        damage: 15,
        damageRatio: 0.03,
      },
      {
        id: 'l3-h2',
        type: 'barrier',
        y: 2800,
        gapCenter: 660,
        gapWidth: 200,
        damage: 20,
      },
      {
        id: 'l3-h3',
        type: 'block',
        y: 2200,
        x: 900,
        radius: 82,
        damage: 18,
      },
      {
        id: 'l3-h4',
        type: 'saw',
        y: 1600,
        x: 800,
        amplitude: 215,
        speed: 1.8,
        phase: 2.4,
        radius: 60,
        damage: 25,
        damageRatio: 0.05,
      },
    ],

    collectibles: [
      { x: 700, y: 4220, value: 2 },
      { x: 920, y: 4000, value: 1 },
      { x: 640, y: 3700, value: 2 },
      { x: 900, y: 3600, value: 1 },
      { x: 760, y: 3300, value: 2 },
      { x: 980, y: 3200, value: 1 },
      { x: 620, y: 2960, value: 3 },
      { x: 860, y: 2650, value: 2 },
      { x: 700, y: 2350, value: 1 },
      { x: 960, y: 2100, value: 2 },
      { x: 640, y: 1980, value: 1 },
      { x: 840, y: 1720, value: 3 },
      { x: 700, y: 1450, value: 2 },
      { x: 960, y: 1380, value: 1 },
      { x: 760, y: 1180, value: 2 },
      { x: 620, y: 1060, value: 2 },
    ],

    enemies: [
      {
        id: 'l3-boss',
        name: 'Rey del Castillo',
        y: 750,
        triggerY: 950,
        population: 400,
        isBoss: true,
      },
    ],
  },
];

export const LEVEL_COUNT = LEVELS.length;

/** Devuelve la configuración de un nivel por id, o null si no existe. */
export function getLevel(levelId) {
  const id = Number(levelId);
  return LEVELS.find((level) => level.id === id) ?? null;
}

/** Id del siguiente nivel, o null si es el último. */
export function getNextLevelId(levelId) {
  const index = LEVELS.findIndex((level) => level.id === Number(levelId));
  if (index < 0 || index >= LEVELS.length - 1) return null;
  return LEVELS[index + 1].id;
}
