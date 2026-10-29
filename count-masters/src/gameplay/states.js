/**
 * Máquina de estados explícita del ciclo de una partida.
 *
 * Todo el flujo de GameScene pasa por aquí: no se usan combinaciones sueltas de
 * banderas (`isGameOver`, `isPaused`, `isFighting`...). Cada estado declara a
 * qué estados puede ir; cualquier transición no declarada lanza un error, lo
 * que convierte un fallo de lógica en un fallo visible durante el desarrollo.
 */

export const GAME_STATES = Object.freeze({
  READY: 'ready',
  RUNNING: 'running',
  PAUSED: 'paused',
  BATTLE: 'battle',
  WIN_ANIMATION: 'winAnimation',
  WON: 'won',
  LOST: 'lost',
});

/**
 * Grafo de transiciones permitidas.
 *
 * ready        -> running (tras la cuenta regresiva), paused, lost
 * running      -> paused, battle, lost, winAnimation
 * paused       -> running o battle (se vuelve al estado desde el que se pausó;
 *                 el reinicio recrea la escena y la máquina)
 * battle       -> running (combate ganado), paused, lost
 * winAnimation -> won
 * won / lost   -> terminales
 */
export const GAME_TRANSITIONS = Object.freeze({
  [GAME_STATES.READY]: Object.freeze([GAME_STATES.RUNNING, GAME_STATES.PAUSED, GAME_STATES.LOST]),
  [GAME_STATES.RUNNING]: Object.freeze([
    GAME_STATES.PAUSED,
    GAME_STATES.BATTLE,
    GAME_STATES.LOST,
    GAME_STATES.WIN_ANIMATION,
  ]),
  [GAME_STATES.PAUSED]: Object.freeze([GAME_STATES.RUNNING, GAME_STATES.BATTLE]),
  [GAME_STATES.BATTLE]: Object.freeze([GAME_STATES.RUNNING, GAME_STATES.PAUSED, GAME_STATES.LOST]),
  [GAME_STATES.WIN_ANIMATION]: Object.freeze([GAME_STATES.WON]),
  [GAME_STATES.WON]: Object.freeze([]),
  [GAME_STATES.LOST]: Object.freeze([]),
});

export const TERMINAL_STATES = Object.freeze([GAME_STATES.WON, GAME_STATES.LOST]);

export class GameStateMachine {
  constructor(initialState = GAME_STATES.READY, { onChange = null } = {}) {
    if (!Object.values(GAME_STATES).includes(initialState)) {
      throw new Error(`Estado inicial desconocido: ${String(initialState)}`);
    }
    this._state = initialState;
    this._onChange = onChange;
    this.history = [initialState];
  }

  get state() {
    return this._state;
  }

  get isTerminal() {
    return TERMINAL_STATES.includes(this._state);
  }

  /** ¿Es posible pasar de `from` a `to`? (sin argumento usa el estado actual) */
  can(nextState, fromState = this._state) {
    const allowed = GAME_TRANSITIONS[fromState];
    return Array.isArray(allowed) && allowed.includes(nextState);
  }

  /** Comprueba si el estado actual es alguno de los indicados. */
  is(...states) {
    return states.includes(this._state);
  }

  /**
   * Ejecuta una transición. Lanza si no está permitida o si el estado actual es
   * terminal, evitando que un resultado se establezca dos veces.
   */
  transition(nextState) {
    if (!Object.values(GAME_STATES).includes(nextState)) {
      throw new Error(`Estado destino desconocido: ${String(nextState)}`);
    }
    if (nextState === this._state) return this._state;

    if (!this.can(nextState)) {
      throw new Error(
        `Transición no permitida: ${this._state} -> ${nextState}`,
      );
    }

    const previous = this._state;
    this._state = nextState;
    this.history.push(nextState);
    this._onChange?.(nextState, previous);
    return this._state;
  }

  /** Intenta una transición sin lanzar; devuelve true si se aplicó. */
  tryTransition(nextState) {
    if (!this.can(nextState)) return false;
    this.transition(nextState);
    return true;
  }
}
