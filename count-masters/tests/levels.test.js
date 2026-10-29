import test from 'node:test';
import assert from 'node:assert/strict';

import { GAME_CONFIG, TRACK_WIDTH } from '../src/config/gameConfig.js';
import { LEVELS, LEVEL_COUNT, getLevel, getNextLevelId } from '../src/data/levels.js';
import {
  applyGateOperation,
  applyHazardDamage,
  computeHazardLoss,
  resolveBattle,
} from '../src/gameplay/rules.js';

/**
 * Simula un recorrido completo aplicando los eventos en orden de avance
 * (Y descendente). `mode: 'best'` elige siempre la puerta más favorable;
 * `mode: 'worst'` elige la menos favorable y recibe todo el daño posible.
 */
function simulate(level, { mode = 'best', applyAllHazards = false } = {}) {
  const events = [
    ...level.gates.map((gate) => ({ type: 'gate', y: gate.y, data: gate })),
    ...level.hazards.map((hazard) => ({ type: 'hazard', y: hazard.y, data: hazard })),
    ...level.enemies.map((enemy) => ({ type: 'enemy', y: enemy.triggerY, data: enemy })),
  ].sort((a, b) => b.y - a.y);

  let population = level.startPopulation;
  const trail = [];

  for (const event of events) {
    if (population <= 0) break;

    if (event.type === 'gate') {
      const left = applyGateOperation(population, event.data.left);
      const right = applyGateOperation(population, event.data.right);
      population = mode === 'best' ? Math.max(left, right) : Math.min(left, right);
      trail.push({ event: 'gate', id: event.data.id, population });
    } else if (event.type === 'hazard') {
      if (applyAllHazards) {
        const loss = computeHazardLoss(population, event.data);
        population = applyHazardDamage(population, loss);
        trail.push({ event: 'hazard', id: event.data.id, loss, population });
      }
    } else {
      const result = resolveBattle(population, event.data.population);
      trail.push({
        event: 'battle',
        id: event.data.id,
        won: result.playerWon,
        population: result.playerSurvivors,
      });
      if (!result.playerWon) {
        return { won: false, population: 0, trail };
      }
      population = result.playerSurvivors;
    }
  }

  return { won: population > 0, population, trail };
}

// ------------------------------------------------------- validación de datos

test('existen al menos tres niveles jugables', () => {
  assert.ok(LEVEL_COUNT >= 3);
  assert.deepEqual(
    LEVELS.map((level) => level.id),
    [1, 2, 3],
  );
  assert.equal(getLevel(1)?.id, 1);
  assert.equal(getLevel(99), null);
  assert.equal(getNextLevelId(1), 2);
  assert.equal(getNextLevelId(3), null);
});

test('cada nivel define el contenido mínimo exigido', () => {
  for (const level of LEVELS) {
    assert.ok(level.name.length > 0);
    assert.ok(level.startPopulation >= 1, `Nivel ${level.id}: población inicial inválida`);
    assert.ok(level.startY > level.finishY, `Nivel ${level.id}: recorrido invertido`);
    assert.ok(level.forwardSpeed > 0);
    assert.ok(level.reward > 0);
    assert.ok(level.gates.length >= 2, `Nivel ${level.id}: faltan puertas`);
    assert.ok(level.hazards.length >= 1, `Nivel ${level.id}: faltan obstáculos`);
    assert.ok(level.collectibles.length >= 4, `Nivel ${level.id}: faltan monedas`);
    assert.ok(level.enemies.length >= 1, `Nivel ${level.id}: falta el combate final`);
  }
});

test('las puertas están ordenadas y no se solapan', () => {
  for (const level of LEVELS) {
    const ys = level.gates.map((gate) => gate.y);
    const sorted = [...ys].sort((a, b) => b - a);
    assert.deepEqual(ys, sorted, `Nivel ${level.id}: puertas desordenadas`);

    for (let i = 1; i < ys.length; i += 1) {
      assert.ok(
        ys[i - 1] - ys[i] >= 250,
        `Nivel ${level.id}: puertas demasiado juntas (${ys[i - 1]} y ${ys[i]})`,
      );
    }

    for (const gate of level.gates) {
      for (const side of [gate.left, gate.right]) {
        assert.ok(['add', 'sub', 'mul'].includes(side.op), `Operación inválida en ${gate.id}`);
        assert.ok(side.value > 0, `Valor inválido en ${gate.id}`);
        if (side.op !== 'mul') assert.ok(Number.isInteger(side.value));
      }
      assert.ok(level.startY > gate.y && gate.y > level.finishY);
    }
  }
});

test('los obstáculos son alcanzables y están separados de las puertas', () => {
  for (const level of LEVELS) {
    for (const hazard of level.hazards) {
      assert.ok(level.startY > hazard.y && hazard.y > level.finishY);
      assert.ok(hazard.damage > 0, `${hazard.id}: daño inválido`);

      for (const gate of level.gates) {
        assert.ok(
          Math.abs(gate.y - hazard.y) >= 150,
          `${hazard.id} demasiado cerca de ${gate.id}`,
        );
      }

      if (hazard.type === 'saw') {
        assert.ok(hazard.amplitude > 0);
        assert.ok(hazard.speed > 0);
        assert.ok(hazard.radius > 0);
      }
      if (hazard.type === 'barrier') {
        assert.ok(hazard.gapWidth >= 150 && hazard.gapWidth <= 400);
        assert.ok(
          hazard.gapCenter - hazard.gapWidth / 2 > GAME_CONFIG.trackLeft &&
            hazard.gapCenter + hazard.gapWidth / 2 < GAME_CONFIG.trackRight,
          `${hazard.id}: el hueco se sale de la pista`,
        );
      }
      if (hazard.type === 'block') {
        assert.ok(hazard.x >= GAME_CONFIG.trackLeft && hazard.x <= GAME_CONFIG.trackRight);
        assert.ok(hazard.radius > 0);
      }
    }
  }
});

test('las monedas están dentro de la pista y del recorrido', () => {
  for (const level of LEVELS) {
    for (const coin of level.collectibles) {
      assert.ok(coin.x > GAME_CONFIG.trackLeft && coin.x < GAME_CONFIG.trackRight);
      assert.ok(coin.y < level.startY && coin.y > level.finishY);
      assert.ok(coin.value >= 1);
    }
  }
});

test('los enemigos se disparan antes de la meta y después de su grupo', () => {
  for (const level of LEVELS) {
    for (const enemy of level.enemies) {
      assert.ok(enemy.population > 0, `${enemy.id}: población inválida`);
      assert.ok(enemy.triggerY > enemy.y, `${enemy.id}: el disparo está detrás del grupo`);
      assert.ok(enemy.y > level.finishY, `${enemy.id}: el grupo está fuera del recorrido`);
      assert.ok(enemy.triggerY < level.startY);
    }
  }
});

test('los identificadores de entidades son únicos por nivel', () => {
  for (const level of LEVELS) {
    const ids = [
      ...level.gates.map((gate) => gate.id),
      ...level.hazards.map((hazard) => hazard.id),
      ...level.enemies.map((enemy) => enemy.id),
    ];
    assert.equal(new Set(ids).size, ids.length, `Nivel ${level.id}: ids duplicados`);
  }
});

// ---------------------------------------------------------------- balanceo

test('cada nivel tiene una ruta favorable que gana el combate final', () => {
  for (const level of LEVELS) {
    const result = simulate(level, { mode: 'best' });
    assert.equal(result.won, true, `Nivel ${level.id}: la mejor ruta no gana`);
    assert.ok(
      result.population > 0,
      `Nivel ${level.id}: no sobrevive nadie en la mejor ruta`,
    );
  }
});

test('cada nivel tiene una ruta desfavorable que termina en derrota', () => {
  for (const level of LEVELS) {
    const result = simulate(level, { mode: 'worst', applyAllHazards: true });
    assert.equal(result.won, false, `Nivel ${level.id}: la peor ruta no pierde`);
  }
});

test('la mejor ruta sobrevive incluso recibiendo todos los obstáculos del nivel 1', () => {
  // El nivel 1 es el tutorial: un jugador que elige bien las puertas debe poder
  // terminar aunque toque todos los obstáculos.
  const level = getLevel(1);
  const result = simulate(level, { mode: 'best', applyAllHazards: true });
  assert.equal(result.won, true);
  assert.ok(result.population > 0);
});

test('el nivel 3 exige aprovechar las puertas: la ruta ingenua pierde', () => {
  const level = getLevel(3);
  const naive = simulate(level, { mode: 'worst', applyAllHazards: true });
  assert.equal(naive.won, false);

  const smart = simulate(level, { mode: 'best' });
  assert.equal(smart.won, true);
  assert.ok(smart.population > level.enemies.at(-1).population / 4);
});

test('la pista y el mundo tienen dimensiones coherentes', () => {
  assert.ok(GAME_CONFIG.worldHeight > GAME_CONFIG.height);
  assert.ok(GAME_CONFIG.worldWidth > GAME_CONFIG.width);
  assert.ok(TRACK_WIDTH > 200 && TRACK_WIDTH < GAME_CONFIG.width);
  assert.ok(GAME_CONFIG.trackLeft > 0);
  assert.ok(GAME_CONFIG.trackRight < GAME_CONFIG.worldWidth);
  assert.ok(GAME_CONFIG.startY < GAME_CONFIG.worldHeight);
  assert.ok(GAME_CONFIG.finishY > 0);
});
