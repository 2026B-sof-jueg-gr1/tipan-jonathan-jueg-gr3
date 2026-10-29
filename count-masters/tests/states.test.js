import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GAME_STATES,
  GAME_TRANSITIONS,
  GameStateMachine,
  TERMINAL_STATES,
} from '../src/gameplay/states.js';

test('la partida comienza en READY', () => {
  const machine = new GameStateMachine();
  assert.equal(machine.state, GAME_STATES.READY);
  assert.equal(machine.isTerminal, false);
});

test('el flujo normal de una partida es válido', () => {
  const machine = new GameStateMachine();
  machine.transition(GAME_STATES.RUNNING);
  machine.transition(GAME_STATES.BATTLE);
  machine.transition(GAME_STATES.RUNNING);
  machine.transition(GAME_STATES.WIN_ANIMATION);
  machine.transition(GAME_STATES.WON);

  assert.equal(machine.state, GAME_STATES.WON);
  assert.equal(machine.isTerminal, true);
  assert.deepEqual(machine.history, [
    'ready',
    'running',
    'battle',
    'running',
    'winAnimation',
    'won',
  ]);
});

test('se puede pausar y reanudar tanto en carrera como en combate', () => {
  const running = new GameStateMachine();
  running.transition(GAME_STATES.RUNNING);
  running.transition(GAME_STATES.PAUSED);
  running.transition(GAME_STATES.RUNNING);
  assert.equal(running.state, GAME_STATES.RUNNING);

  const battle = new GameStateMachine();
  battle.transition(GAME_STATES.RUNNING);
  battle.transition(GAME_STATES.BATTLE);
  battle.transition(GAME_STATES.PAUSED);
  battle.transition(GAME_STATES.BATTLE);
  assert.equal(battle.state, GAME_STATES.BATTLE);
});

test('las transiciones no permitidas lanzan un error', () => {
  const machine = new GameStateMachine();
  assert.throws(() => machine.transition(GAME_STATES.WON), /Transición no permitida/);

  machine.transition(GAME_STATES.RUNNING);
  assert.throws(() => machine.transition(GAME_STATES.READY), /no permitida/);
});

test('un estado terminal no permite volver a jugar', () => {
  const machine = new GameStateMachine();
  machine.transition(GAME_STATES.RUNNING);
  machine.transition(GAME_STATES.LOST);

  assert.equal(machine.isTerminal, true);
  assert.throws(() => machine.transition(GAME_STATES.RUNNING), /no permitida/);
  assert.equal(machine.tryTransition(GAME_STATES.RUNNING), false);
});

test('el resultado no se puede establecer dos veces', () => {
  const machine = new GameStateMachine();
  machine.transition(GAME_STATES.RUNNING);
  machine.transition(GAME_STATES.LOST);
  // Repetir el mismo estado es una operación nula, no una segunda transición.
  machine.transition(GAME_STATES.LOST);

  assert.equal(machine.state, GAME_STATES.LOST);
  assert.equal(machine.history.filter((state) => state === GAME_STATES.LOST).length, 1);
});

test('tryTransition informa sin lanzar', () => {
  const machine = new GameStateMachine();
  assert.equal(machine.tryTransition(GAME_STATES.PAUSED), true);
  assert.equal(machine.tryTransition(GAME_STATES.WON), false);
  assert.equal(machine.state, GAME_STATES.PAUSED);
});

test('onChange recibe el estado nuevo y el anterior', () => {
  const events = [];
  const machine = new GameStateMachine(GAME_STATES.READY, {
    onChange: (next, previous) => events.push([previous, next]),
  });
  machine.transition(GAME_STATES.RUNNING);
  assert.deepEqual(events, [['ready', 'running']]);
});

test('todos los estados declarados tienen entrada en el grafo', () => {
  for (const state of Object.values(GAME_STATES)) {
    assert.ok(Array.isArray(GAME_TRANSITIONS[state]), `Falta el estado ${state}`);
  }
  assert.deepEqual(GAME_TRANSITIONS[GAME_STATES.WON], []);
  assert.deepEqual(GAME_TRANSITIONS[GAME_STATES.LOST], []);
  assert.deepEqual(TERMINAL_STATES, [GAME_STATES.WON, GAME_STATES.LOST]);
});

test('un estado inicial desconocido se rechaza', () => {
  assert.throws(() => new GameStateMachine('inventado'), /Estado inicial desconocido/);
});
