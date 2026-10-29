import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_POPULATION,
  applyGateOperation,
  applyHazardDamage,
  applyLevelReward,
  applyUpgradePurchase,
  calculateRewards,
  canPurchaseUpgrade,
  computeHazardLoss,
  createDefaultProgress,
  getCoinBonusLevel,
  getStartingCrowdBonus,
  isLevelUnlocked,
  normalizePopulation,
  resolveBattle,
  sanitizeProgress,
} from '../src/gameplay/rules.js';
import { UPGRADES } from '../src/data/upgrades.js';

// ------------------------------------------------------------------ puertas

test('una suma incrementa la población', () => {
  assert.equal(applyGateOperation(10, { op: 'add', value: 12 }), 22);
  assert.equal(applyGateOperation(0, { op: 'add', value: 5 }), 5);
});

test('una resta nunca produce población negativa', () => {
  assert.equal(applyGateOperation(5, { op: 'sub', value: 8 }), 0);
  assert.equal(applyGateOperation(20, { op: 'sub', value: 6 }), 14);
  assert.equal(applyGateOperation(0, { op: 'sub', value: 3 }), 0);
});

test('una multiplicación produce un entero válido', () => {
  assert.equal(applyGateOperation(12, { op: 'mul', value: 3 }), 36);
  // 7 * 1.5 = 10.5 -> se redondea hacia abajo, nunca hacia arriba.
  assert.equal(applyGateOperation(7, { op: 'mul', value: 1.5 }), 10);
  assert.ok(Number.isSafeInteger(applyGateOperation(9, { op: 'mul', value: 1.5 })));
});

test('una operación inválida lanza un error explícito', () => {
  assert.throws(() => applyGateOperation(10, { op: 'pow', value: 2 }), /Operación de puerta desconocida/);
  assert.throws(() => applyGateOperation(10, { op: 'add', value: Number.NaN }), /no válido/);
  assert.throws(() => applyGateOperation(10, { op: 'mul', value: 0 }), /positivo/);
  assert.throws(() => applyGateOperation(10, { op: 'sub', value: -5 }), /no negativo/);
  assert.throws(() => applyGateOperation(10, null), /objeto/);
  assert.throws(() => applyGateOperation(-3, { op: 'add', value: 1 }), /entero no negativo/);
  assert.throws(() => applyGateOperation(1.5, { op: 'add', value: 1 }), /entero no negativo/);
});

test('la población no supera el límite configurado', () => {
  assert.equal(applyGateOperation(MAX_POPULATION - 5, { op: 'add', value: 500 }), MAX_POPULATION);
  assert.equal(applyGateOperation(500, { op: 'mul', value: 1000 }), MAX_POPULATION);
  assert.equal(applyGateOperation(99990, { op: 'add', value: 500 }, 100), 100);
});

test('una población cero permanece en cero al multiplicar', () => {
  assert.equal(applyGateOperation(0, { op: 'mul', value: 5 }), 0);
});

test('normalizePopulation sanea decimales y negativos', () => {
  assert.equal(normalizePopulation(-10), 0);
  assert.equal(normalizePopulation(3.9), 3);
  assert.equal(normalizePopulation(200000), MAX_POPULATION);
  assert.throws(() => normalizePopulation(Number.POSITIVE_INFINITY), /no finita/);
});

// ------------------------------------------------------------------ combate

test('la victoria aliada produce la diferencia exacta como supervivientes', () => {
  const result = resolveBattle(100, 40);
  assert.equal(result.playerSurvivors, 60);
  assert.equal(result.enemySurvivors, 0);
  assert.equal(result.playerWon, true);
  assert.equal(result.winner, 'player');
});

test('la victoria enemiga produce la diferencia exacta como supervivientes', () => {
  const result = resolveBattle(40, 100);
  assert.equal(result.playerSurvivors, 0);
  assert.equal(result.enemySurvivors, 60);
  assert.equal(result.playerWon, false);
  assert.equal(result.winner, 'enemy');
});

test('una igualdad termina en derrota del jugador', () => {
  const result = resolveBattle(50, 50);
  assert.equal(result.playerSurvivors, 0);
  assert.equal(result.enemySurvivors, 0);
  assert.equal(result.playerWon, false);
});

test('ningún grupo obtiene supervivientes negativos', () => {
  const cases = [
    [1, 9999],
    [9999, 1],
    [0, 0],
    [0, 10],
  ];
  for (const [player, enemy] of cases) {
    const result = resolveBattle(player, enemy);
    assert.ok(result.playerSurvivors >= 0);
    assert.ok(result.enemySurvivors >= 0);
  }
});

test('el combate rechaza valores inválidos', () => {
  assert.throws(() => resolveBattle(-1, 10), /entero no negativo/);
  assert.throws(() => resolveBattle(10, 2.5), /entero no negativo/);
  assert.throws(() => resolveBattle(Number.NaN, 10), /entero no negativo/);
});

// -------------------------------------------------------------- obstáculos

test('la penalización normal se calcula correctamente', () => {
  assert.equal(computeHazardLoss(100, { damage: 8 }), 8);
  assert.equal(applyHazardDamage(100, 8), 92);
  assert.equal(computeHazardLoss(1000, { damage: 20, damageRatio: 0.05 }), 70);
});

test('una penalización no reduce la población por debajo de cero', () => {
  assert.equal(applyHazardDamage(5, 8), 0);
  assert.equal(applyHazardDamage(0, 8), 0);
  assert.equal(computeHazardLoss(10, { damage: 50 }), 10);
});

test('una pérdida que alcanza cero permite reconocer la derrota', () => {
  const remaining = applyHazardDamage(8, 8);
  assert.equal(remaining, 0);
  assert.ok(remaining <= 0);
});

test('el daño inválido se rechaza', () => {
  assert.throws(() => applyHazardDamage(10, -1), /Daño no válido/);
  assert.throws(() => computeHazardLoss(10, null), /objeto/);
});

// -------------------------------------------------------------- recompensas

test('la recompensa suma monedas, bonus de nivel y bonus por supervivientes', () => {
  const reward = calculateRewards({
    runCoins: 12,
    levelReward: 40,
    survivors: 28,
    coinBonusLevel: 0,
  });
  assert.equal(reward.levelBonus, 40);
  assert.equal(reward.survivorBonus, 14);
  assert.equal(reward.total, 66);
  assert.equal(reward.multiplier, 1);
});

test('la mejora de monedas multiplica los bonus de nivel', () => {
  const reward = calculateRewards({
    runCoins: 12,
    levelReward: 40,
    survivors: 28,
    coinBonusLevel: 2,
  });
  assert.equal(reward.multiplier, 1.4);
  assert.equal(reward.levelBonus, 56);
  assert.equal(reward.survivorBonus, 19);
  assert.equal(reward.total, 87);
});

test('la recompensa nunca es negativa ni fraccionaria', () => {
  const reward = calculateRewards({ runCoins: -5, levelReward: -10, survivors: -1 });
  assert.equal(reward.total, 0);
  assert.ok(Number.isInteger(reward.total));
});

// -------------------------------------------------------------- progresión

test('el progreso por defecto está limpio', () => {
  const progress = createDefaultProgress();
  assert.equal(progress.coins, 0);
  assert.equal(progress.highestUnlockedLevel, 1);
  assert.deepEqual(progress.completedLevels, []);
  assert.equal(progress.upgrades.startingCrowd, 0);
  assert.equal(progress.upgrades.coinBonus, 0);
  assert.equal(progress.settings.soundEnabled, true);
});

test('el progreso corrupto se sustituye por valores predeterminados válidos', () => {
  for (const corrupt of [null, undefined, 'texto', 42, []]) {
    const progress = sanitizeProgress(corrupt, { levelCount: 3 });
    assert.equal(progress.coins, 0);
    assert.equal(progress.highestUnlockedLevel, 1);
  }

  const sanitized = sanitizeProgress(
    {
      coins: -500,
      highestUnlockedLevel: 99,
      completedLevels: [0, 1, 2, 2, 9],
      upgrades: { startingCrowd: 99, coinBonus: -3 },
      settings: { soundEnabled: 'sí' },
    },
    { levelCount: 3 },
  );

  assert.equal(sanitized.coins, 0);
  assert.equal(sanitized.highestUnlockedLevel, 3);
  assert.deepEqual(sanitized.completedLevels, [1, 2]);
  assert.equal(sanitized.upgrades.startingCrowd, 5);
  assert.equal(sanitized.upgrades.coinBonus, 0);
  assert.equal(sanitized.settings.soundEnabled, true);
});

test('una compra no se permite sin saldo suficiente', () => {
  const progress = { ...createDefaultProgress(), coins: 10 };
  const check = canPurchaseUpgrade(progress, 'startingCrowd');
  assert.equal(check.ok, false);
  assert.equal(check.reason, 'insufficient-coins');

  const result = applyUpgradePurchase(progress, 'startingCrowd');
  assert.equal(result.purchased, false);
  assert.equal(result.progress.coins, 10);
  assert.equal(result.progress.upgrades.startingCrowd, 0);
});

test('una compra válida descuenta monedas y sube el nivel', () => {
  const progress = { ...createDefaultProgress(), coins: 60 };
  const result = applyUpgradePurchase(progress, 'startingCrowd');

  assert.equal(result.purchased, true);
  assert.equal(result.progress.coins, 10);
  assert.equal(result.progress.upgrades.startingCrowd, 1);
  // El objeto original no se muta.
  assert.equal(progress.coins, 60);
  assert.equal(getStartingCrowdBonus(result.progress), 5);
});

test('una mejora al máximo no se puede volver a comprar', () => {
  const progress = {
    ...createDefaultProgress(),
    coins: 99999,
    upgrades: { startingCrowd: 5, coinBonus: 0 },
  };
  const check = canPurchaseUpgrade(progress, 'startingCrowd');
  assert.equal(check.ok, false);
  assert.equal(check.reason, 'max-level');
});

test('las monedas no se incrementan dos veces por la misma recompensa', () => {
  const payload = { levelId: 1, coinsEarned: 66, survivors: 28, runId: 'run-abc', levelCount: 3 };

  const first = applyLevelReward(createDefaultProgress(), payload);
  assert.equal(first.applied, true);
  assert.equal(first.progress.coins, 66);

  const second = applyLevelReward(first.progress, payload);
  assert.equal(second.applied, false);
  assert.equal(second.reason, 'already-rewarded');
  assert.equal(second.progress.coins, 66);
});

test('completar un nivel desbloquea el siguiente sin saltarse niveles', () => {
  const result = applyLevelReward(createDefaultProgress(), {
    levelId: 1,
    coinsEarned: 40,
    survivors: 10,
    runId: 'run-1',
    levelCount: 3,
  });

  assert.deepEqual(result.progress.completedLevels, [1]);
  assert.equal(result.progress.highestUnlockedLevel, 2);
  assert.equal(isLevelUnlocked(result.progress, 1), true);
  assert.equal(isLevelUnlocked(result.progress, 2), true);
  assert.equal(isLevelUnlocked(result.progress, 3), false);
});

test('los niveles bloqueados no se desbloquean por error', () => {
  const progress = createDefaultProgress();
  assert.equal(isLevelUnlocked(progress, 1), true);
  assert.equal(isLevelUnlocked(progress, 2), false);
  assert.equal(isLevelUnlocked(progress, 3), false);
  assert.equal(isLevelUnlocked(progress, 0), false);
  assert.equal(isLevelUnlocked(progress, -1), false);
  assert.equal(isLevelUnlocked(progress, 1.5), false);
});

test('las mejoras exponen sus efectos reales', () => {
  const progress = {
    ...createDefaultProgress(),
    upgrades: { startingCrowd: 3, coinBonus: 4 },
  };
  assert.equal(getStartingCrowdBonus(progress), 15);
  assert.equal(getCoinBonusLevel(progress), 4);
  assert.equal(UPGRADES.length, 2);
});
