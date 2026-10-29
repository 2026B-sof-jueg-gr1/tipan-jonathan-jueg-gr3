import test from 'node:test';
import assert from 'node:assert/strict';

import { MemoryStorage, ProgressManager } from '../src/systems/ProgressManager.js';
import { STORAGE_KEY } from '../src/config/gameConfig.js';

function createManager(storage) {
  return new ProgressManager({ storage, levelCount: 3 });
}

test('el progreso se guarda y se recupera en una sesión nueva', () => {
  const storage = new MemoryStorage();
  const first = createManager(storage);

  first.commitLevelReward({
    levelId: 1,
    coinsEarned: 100,
    survivors: 20,
    runId: 'run-1',
  });

  const second = createManager(storage);
  assert.equal(second.getCoins(), 100);
  assert.deepEqual(second.get().completedLevels, [1]);
  assert.equal(second.get().highestUnlockedLevel, 2);
  assert.equal(second.isLevelUnlocked(2), true);
  assert.equal(second.isLevelUnlocked(3), false);
});

test('un JSON corrupto no rompe el arranque', () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, '{ esto no es json');
  const manager = createManager(storage);

  assert.equal(manager.getCoins(), 0);
  assert.equal(manager.get().highestUnlockedLevel, 1);
  assert.deepEqual(manager.get().completedLevels, []);
});

test('un progreso con valores imposibles se sanea', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      coins: -999,
      highestUnlockedLevel: 42,
      completedLevels: ['1', 7, null],
      upgrades: { startingCrowd: -4, coinBonus: 99 },
    }),
  );

  const manager = createManager(storage);
  const data = manager.get();
  assert.equal(data.coins, 0);
  assert.equal(data.highestUnlockedLevel, 3);
  assert.deepEqual(data.completedLevels, [1]);
  assert.equal(data.upgrades.startingCrowd, 0);
  assert.equal(data.upgrades.coinBonus, 5);
});

test('la recompensa no se duplica al repetir el mismo runId', () => {
  const storage = new MemoryStorage();
  const manager = createManager(storage);
  const payload = { levelId: 1, coinsEarned: 80, survivors: 30, runId: 'run-x' };

  const first = manager.commitLevelReward(payload);
  assert.equal(first.applied, true);
  assert.equal(manager.getCoins(), 80);

  const second = manager.commitLevelReward(payload);
  assert.equal(second.applied, false);
  assert.equal(manager.getCoins(), 80);
});

test('una compra persiste y nunca deja saldo negativo', () => {
  const storage = new MemoryStorage();
  const manager = createManager(storage);

  manager.commitLevelReward({ levelId: 1, coinsEarned: 50, survivors: 5, runId: 'a' });

  const buy = manager.purchaseUpgrade('startingCrowd');
  assert.equal(buy.ok, true);
  assert.equal(manager.getCoins(), 0);
  assert.equal(manager.get().upgrades.startingCrowd, 1);

  const rejected = manager.purchaseUpgrade('startingCrowd');
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'insufficient-coins');
  assert.equal(manager.getCoins(), 0);

  const reloaded = createManager(storage);
  assert.equal(reloaded.get().upgrades.startingCrowd, 1);
  assert.equal(reloaded.getCoins(), 0);
});

test('la derrota no concede monedas', () => {
  const storage = new MemoryStorage();
  const manager = createManager(storage);

  manager.commitLevelReward({ levelId: 1, coinsEarned: 40, survivors: 5, runId: 'a' });
  const coinsBefore = manager.getCoins();

  manager.recordDefeat();
  assert.equal(manager.getCoins(), coinsBefore);
  assert.equal(manager.get().totalRuns, 1);
  assert.deepEqual(manager.get().completedLevels, [1]);
});

test('el sonido se puede alternar y persiste', () => {
  const storage = new MemoryStorage();
  const manager = createManager(storage);

  assert.equal(manager.get().settings.soundEnabled, true);
  assert.equal(manager.toggleSound(), false);
  assert.equal(manager.toggleSound(), true);

  manager.setSoundEnabled(false);
  const reloaded = createManager(storage);
  assert.equal(reloaded.get().settings.soundEnabled, false);
});

test('reiniciar el progreso lo deja limpio', () => {
  const storage = new MemoryStorage();
  const manager = createManager(storage);

  manager.commitLevelReward({ levelId: 2, coinsEarned: 300, survivors: 60, runId: 'b' });
  manager.reset();

  assert.equal(manager.getCoins(), 0);
  assert.equal(manager.get().highestUnlockedLevel, 1);
  assert.deepEqual(manager.get().completedLevels, []);
  assert.equal(storage.getItem(STORAGE_KEY), null);

  const reloaded = createManager(storage);
  assert.equal(reloaded.getCoins(), 0);
});

test('el almacenamiento no disponible no rompe el juego', () => {
  const brokenStorage = {
    getItem() {
      throw new Error('bloqueado');
    },
    setItem() {
      throw new Error('bloqueado');
    },
    removeItem() {
      throw new Error('bloqueado');
    },
  };

  const manager = new ProgressManager({ storage: brokenStorage, levelCount: 3 });
  assert.equal(manager.getCoins(), 0);
  assert.equal(manager.save(), false);

  const result = manager.commitLevelReward({
    levelId: 1,
    coinsEarned: 30,
    survivors: 10,
    runId: 'c',
  });
  assert.equal(result.applied, true);
  assert.equal(manager.getCoins(), 30);
});
