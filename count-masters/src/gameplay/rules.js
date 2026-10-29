/**
 * Reglas puras del juego.
 *
 * Este módulo NO importa Phaser y no toca `localStorage`: recibe valores y
 * devuelve valores. Eso permite probar toda la lógica de población, combate,
 * recompensas y progresión con `node:test`, sin levantar el motor.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';
import { UPGRADES, getUpgrade, upgradeCost } from '../data/upgrades.js';

export const MAX_POPULATION = GAME_CONFIG.maxPopulation;
export const MAX_COINS = 9_999_999;

/** Operaciones válidas de una puerta matemática. */
export const GATE_OPS = Object.freeze({
  ADD: 'add',
  SUB: 'sub',
  MUL: 'mul',
});

/** Parámetros del cálculo de recompensas al ganar un nivel. */
export const REWARD_CONFIG = Object.freeze({
  survivorBonusDivisor: 2,
  survivorBonusCap: 150,
  coinBonusPerLevel: 0.2,
});

function assertPopulation(value, label = 'population') {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} debe ser un entero no negativo (recibido: ${String(value)})`);
  }
}

function assertSafeMax(max) {
  return Number.isSafeInteger(max) && max >= 0 ? max : MAX_POPULATION;
}

/**
 * Convierte cualquier número finito en una población válida:
 * entero, nunca negativo y nunca superior al máximo.
 */
export function normalizePopulation(value, max = MAX_POPULATION) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Población no finita: ${String(value)}`);
  }
  const upper = assertSafeMax(max);
  return Math.min(Math.max(Math.floor(value), 0), upper);
}

/** Texto legible de una operación: "+12", "-8", "×2". */
export function describeGate(gate) {
  if (!gate || typeof gate !== 'object') return '?';
  switch (gate.op) {
    case GATE_OPS.ADD:
      return `+${gate.value}`;
    case GATE_OPS.SUB:
      return `-${gate.value}`;
    case GATE_OPS.MUL:
      return `×${gate.value}`;
    default:
      return '?';
  }
}

/** Etiqueta textual del tipo de operación (accesibilidad: no depender del color). */
export function gateOperationLabel(gate) {
  if (!gate || typeof gate !== 'object') return 'DESCONOCIDA';
  switch (gate.op) {
    case GATE_OPS.ADD:
      return 'SUMA';
    case GATE_OPS.SUB:
      return 'RESTA';
    case GATE_OPS.MUL:
      return 'MULTIPLICA';
    default:
      return 'DESCONOCIDA';
  }
}

/**
 * Aplica exactamente una operación de puerta a la población.
 *
 * - Suma: population + value
 * - Resta: max(0, population - value)
 * - Multiplicación: population * value (redondeada hacia abajo)
 *
 * Lanza un error explícito si la operación o el valor no son válidos, en lugar
 * de devolver un resultado silenciosamente incorrecto.
 */
export function applyGateOperation(population, gate, max = MAX_POPULATION) {
  assertPopulation(population);
  if (!gate || typeof gate !== 'object') {
    throw new TypeError('La puerta debe ser un objeto con { op, value }');
  }

  const { op, value } = gate;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Valor de puerta no válido: ${String(value)}`);
  }

  let raw;
  switch (op) {
    case GATE_OPS.ADD:
      if (value < 0) throw new RangeError('La suma requiere un valor no negativo');
      raw = population + value;
      break;
    case GATE_OPS.SUB:
      if (value < 0) throw new RangeError('La resta requiere un valor no negativo');
      raw = population - value;
      break;
    case GATE_OPS.MUL:
      if (value <= 0) throw new RangeError('El factor de multiplicación debe ser positivo');
      raw = population * value;
      break;
    default:
      throw new Error(`Operación de puerta desconocida: ${String(op)}`);
  }

  return normalizePopulation(raw, max);
}

/**
 * Pérdida provocada por un obstáculo: daño fijo + porcentaje opcional de la
 * población actual. Nunca supera la población existente.
 */
export function computeHazardLoss(population, hazard) {
  assertPopulation(population);
  if (!hazard || typeof hazard !== 'object') {
    throw new TypeError('El obstáculo debe ser un objeto con configuración de daño');
  }

  const flat = Number.isFinite(hazard.damage) ? Math.max(0, Math.floor(hazard.damage)) : 0;
  const ratio = Number.isFinite(hazard.damageRatio)
    ? Math.min(1, Math.max(0, hazard.damageRatio))
    : 0;

  return Math.min(population, flat + Math.floor(population * ratio));
}

/** Aplica una pérdida ya calculada. El resultado nunca es negativo. */
export function applyHazardDamage(population, damage, max = MAX_POPULATION) {
  assertPopulation(population);
  if (typeof damage !== 'number' || !Number.isFinite(damage) || damage < 0) {
    throw new TypeError(`Daño no válido: ${String(damage)}`);
  }
  return normalizePopulation(population - Math.floor(damage), max);
}

/**
 * Combate determinista uno contra uno.
 *
 *   Pf = max(0, Pi - Ei)
 *   Ef = max(0, Ei - Pi)
 *
 * Gana el jugador solo si Pi > Ei. En caso de empate ambos quedan a cero y el
 * combate se considera derrota del jugador (no quedan aliados para continuar).
 */
export function resolveBattle(playerCount, enemyCount) {
  assertPopulation(playerCount, 'playerCount');
  assertPopulation(enemyCount, 'enemyCount');

  const playerSurvivors = Math.max(0, playerCount - enemyCount);
  const enemySurvivors = Math.max(0, enemyCount - playerCount);
  const playerWon = playerCount > enemyCount;

  return Object.freeze({
    playerSurvivors,
    enemySurvivors,
    playerWon,
    winner: playerWon ? 'player' : 'enemy',
  });
}

/**
 * Recompensa de una victoria: monedas recogidas + recompensa del nivel
 * (afectada por la mejora de bonificación) + bonus por supervivientes.
 */
export function calculateRewards({
  runCoins = 0,
  levelReward = 0,
  survivors = 0,
  coinBonusLevel = 0,
} = {}) {
  const safeRunCoins = Math.max(0, Math.floor(Number(runCoins) || 0));
  const safeLevelReward = Math.max(0, Math.floor(Number(levelReward) || 0));
  const safeSurvivors = Math.max(0, Math.floor(Number(survivors) || 0));
  const bonusLevel = Math.max(0, Math.floor(Number(coinBonusLevel) || 0));

  const multiplier = 1 + bonusLevel * REWARD_CONFIG.coinBonusPerLevel;
  const survivorBonus = Math.min(
    REWARD_CONFIG.survivorBonusCap,
    Math.floor(safeSurvivors / REWARD_CONFIG.survivorBonusDivisor),
  );

  const levelBonus = Math.floor(safeLevelReward * multiplier);
  const survivorBonusTotal = Math.floor(survivorBonus * multiplier);

  return {
    runCoins: safeRunCoins,
    levelBonus,
    survivorBonus: survivorBonusTotal,
    multiplier,
    total: safeRunCoins + levelBonus + survivorBonusTotal,
  };
}

/** Estructura de progreso por defecto (también usada al recuperar datos corruptos). */
export function createDefaultProgress() {
  const upgrades = {};
  for (const upgrade of UPGRADES) upgrades[upgrade.id] = 0;

  return {
    version: 1,
    coins: 0,
    highestUnlockedLevel: 1,
    completedLevels: [],
    bestResults: {},
    upgrades,
    settings: { soundEnabled: true },
    totalRuns: 0,
    totalWins: 0,
    lastReward: null,
  };
}

function toSafeInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.floor(num);
}

/**
 * Valida y normaliza el progreso leído de `localStorage`.
 * Cualquier campo corrupto se sustituye por su valor por defecto, sin lanzar.
 */
export function sanitizeProgress(raw, { levelCount = 3, catalog = UPGRADES } = {}) {
  const progress = createDefaultProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return progress;

  const safeLevelCount = Math.max(1, Math.floor(Number(levelCount) || 1));

  progress.coins = Math.min(MAX_COINS, Math.max(0, toSafeInt(raw.coins, 0)));

  const unlocked = toSafeInt(raw.highestUnlockedLevel, 1);
  progress.highestUnlockedLevel = Math.min(safeLevelCount, Math.max(1, unlocked));

  const completed = Array.isArray(raw.completedLevels) ? raw.completedLevels : [];
  progress.completedLevels = [
    ...new Set(
      completed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= safeLevelCount),
    ),
  ].sort((a, b) => a - b);

  for (const upgrade of catalog) {
    const level = toSafeInt(raw.upgrades?.[upgrade.id], 0);
    progress.upgrades[upgrade.id] = Math.min(upgrade.maxLevel, Math.max(0, level));
  }

  progress.settings.soundEnabled =
    typeof raw.settings?.soundEnabled === 'boolean' ? raw.settings.soundEnabled : true;

  progress.totalRuns = Math.max(0, toSafeInt(raw.totalRuns, 0));
  progress.totalWins = Math.max(0, toSafeInt(raw.totalWins, 0));

  if (raw.bestResults && typeof raw.bestResults === 'object') {
    for (const [key, value] of Object.entries(raw.bestResults)) {
      const levelId = Number(key);
      if (!Number.isInteger(levelId) || levelId < 1 || levelId > safeLevelCount) continue;
      if (!value || typeof value !== 'object') continue;
      progress.bestResults[levelId] = {
        survivors: Math.max(0, toSafeInt(value.survivors, 0)),
        coins: Math.max(0, toSafeInt(value.coins, 0)),
      };
    }
  }

  if (raw.lastReward && typeof raw.lastReward === 'object') {
    const runId = raw.lastReward.runId;
    const levelId = toSafeInt(raw.lastReward.levelId, 0);
    if (typeof runId === 'string' && runId.length > 0) {
      progress.lastReward = { runId, levelId };
    }
  }

  // Coherencia: completar un nivel implica tener desbloqueado el siguiente.
  const highestCompleted = progress.completedLevels.length
    ? Math.max(...progress.completedLevels)
    : 0;
  progress.highestUnlockedLevel = Math.max(
    progress.highestUnlockedLevel,
    Math.min(safeLevelCount, highestCompleted + 1),
  );

  return progress;
}

/** Un nivel está disponible si no supera el máximo desbloqueado. */
export function isLevelUnlocked(progress, levelId) {
  const id = Number(levelId);
  if (!Number.isInteger(id) || id < 1) return false;
  return id <= (progress?.highestUnlockedLevel ?? 1);
}

/** Bonus de población inicial aportado por la mejora "Refuerzos iniciales". */
export function getStartingCrowdBonus(progress, catalog = UPGRADES) {
  const upgrade = getUpgrade('startingCrowd', catalog);
  if (!upgrade) return 0;
  const level = Math.max(0, toSafeInt(progress?.upgrades?.[upgrade.id], 0));
  return level * upgrade.effectPerLevel;
}

/** Nivel actual de la mejora de monedas (multiplicador = 1 + nivel * 0.2). */
export function getCoinBonusLevel(progress) {
  return Math.max(0, toSafeInt(progress?.upgrades?.coinBonus, 0));
}

/**
 * Comprueba si una mejora puede comprarse. No modifica nada.
 * Devuelve { ok, reason, cost, level, maxLevel }.
 */
export function canPurchaseUpgrade(progress, upgradeId, catalog = UPGRADES) {
  const upgrade = getUpgrade(upgradeId, catalog);
  if (!upgrade) {
    return { ok: false, reason: 'unknown-upgrade', cost: Infinity, level: 0, maxLevel: 0 };
  }

  const level = Math.max(0, toSafeInt(progress?.upgrades?.[upgrade.id], 0));
  if (level >= upgrade.maxLevel) {
    return { ok: false, reason: 'max-level', cost: Infinity, level, maxLevel: upgrade.maxLevel };
  }

  const cost = upgradeCost(upgrade, level);
  const coins = Math.max(0, toSafeInt(progress?.coins, 0));
  if (coins < cost) {
    return { ok: false, reason: 'insufficient-coins', cost, level, maxLevel: upgrade.maxLevel };
  }

  return { ok: true, reason: null, cost, level, maxLevel: upgrade.maxLevel };
}

/**
 * Devuelve un NUEVO progreso con la mejora comprada y las monedas descontadas.
 * Si la compra no es válida, devuelve el progreso original sin cambios.
 */
export function applyUpgradePurchase(progress, upgradeId, catalog = UPGRADES) {
  const check = canPurchaseUpgrade(progress, upgradeId, catalog);
  if (!check.ok) return { progress, purchased: false, reason: check.reason };

  const base = progress ?? createDefaultProgress();
  const next = {
    ...base,
    coins: Math.max(0, toSafeInt(base.coins, 0) - check.cost),
    upgrades: { ...base.upgrades, [upgradeId]: check.level + 1 },
  };

  return { progress: next, purchased: true, reason: null, cost: check.cost };
}

/**
 * Consolida la recompensa de una partida ganada.
 *
 * `runId` identifica la partida: si ya se registró una recompensa con ese mismo
 * identificador, la operación no se repite. Es la garantía de que un doble clic
 * o una recreación de escena no dupliquen monedas.
 */
export function applyLevelReward(
  progress,
  { levelId, coinsEarned = 0, survivors = 0, runId = null, levelCount = 3 } = {},
) {
  const base = progress ?? createDefaultProgress();
  const id = Number(levelId);

  if (!Number.isInteger(id) || id < 1) {
    return { progress: base, applied: false, reason: 'invalid-level', reward: 0 };
  }

  if (runId && base.lastReward?.runId === runId) {
    return { progress: base, applied: false, reason: 'already-rewarded', reward: 0 };
  }

  const safeLevelCount = Math.max(1, Math.floor(Number(levelCount) || 1));
  const reward = Math.min(MAX_COINS, Math.max(0, toSafeInt(coinsEarned, 0)));
  const safeSurvivors = Math.max(0, toSafeInt(survivors, 0));

  const completedLevels = [...new Set([...(base.completedLevels ?? []), id])].sort(
    (a, b) => a - b,
  );

  const previousBest = base.bestResults?.[id];
  const bestResults = {
    ...(base.bestResults ?? {}),
    [id]: {
      survivors: Math.max(previousBest?.survivors ?? 0, safeSurvivors),
      coins: Math.max(previousBest?.coins ?? 0, reward),
    },
  };

  const next = {
    ...base,
    coins: Math.min(MAX_COINS, Math.max(0, toSafeInt(base.coins, 0)) + reward),
    completedLevels,
    bestResults,
    highestUnlockedLevel: Math.min(
      safeLevelCount,
      Math.max(base.highestUnlockedLevel ?? 1, id + 1),
    ),
    totalWins: Math.max(0, toSafeInt(base.totalWins, 0)) + 1,
    lastReward: { runId: runId ?? `level-${id}-${Date.now()}`, levelId: id },
  };

  return { progress: next, applied: true, reason: null, reward };
}
