/**
 * Persistencia del progreso en `localStorage`.
 *
 * - Valida los datos al leerlos (`sanitizeProgress`).
 * - Si el almacenamiento no está disponible (modo privado, bloqueo del
 *   navegador, SSR) cae a un almacenamiento en memoria para que el juego siga
 *   siendo jugable durante la sesión.
 * - Solo escribe cuando algo cambia realmente: nunca en cada fotograma.
 */

import { STORAGE_KEY } from '../config/gameConfig.js';
import { UPGRADES } from '../data/upgrades.js';
import {
  applyLevelReward,
  applyUpgradePurchase,
  canPurchaseUpgrade,
  createDefaultProgress,
  isLevelUnlocked,
  sanitizeProgress,
} from '../gameplay/rules.js';

/** Almacenamiento de respaldo cuando `localStorage` no está disponible. */
export class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }
}

function resolveStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return new MemoryStorage();
    const probe = '__crowd_conquest_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return new MemoryStorage();
  }
}

export class ProgressManager {
  constructor({ storage = null, levelCount = 3, key = STORAGE_KEY, catalog = UPGRADES } = {}) {
    this.storage = storage ?? resolveStorage();
    this.levelCount = levelCount;
    this.key = key;
    this.catalog = catalog;
    this.data = createDefaultProgress();
    this.load();
  }

  /** Lee y sanea el progreso guardado. Nunca lanza. */
  load() {
    let parsed = null;
    try {
      const raw = this.storage.getItem(this.key);
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null; // JSON corrupto: se descarta y se usan los valores por defecto
    }
    this.data = sanitizeProgress(parsed, { levelCount: this.levelCount, catalog: this.catalog });
    return this.data;
  }

  /** Escribe el progreso. Devuelve false si el almacenamiento falló. */
  save() {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }

  get() {
    return this.data;
  }

  getCoins() {
    return this.data.coins;
  }

  isLevelUnlocked(levelId) {
    return isLevelUnlocked(this.data, levelId);
  }

  setSoundEnabled(enabled) {
    this.data = {
      ...this.data,
      settings: { ...this.data.settings, soundEnabled: Boolean(enabled) },
    };
    this.save();
    return this.data.settings.soundEnabled;
  }

  toggleSound() {
    return this.setSoundEnabled(!this.data.settings.soundEnabled);
  }

  /** Intenta comprar una mejora. Devuelve el resultado de la operación. */
  purchaseUpgrade(upgradeId) {
    const check = canPurchaseUpgrade(this.data, upgradeId, this.catalog);
    if (!check.ok) return { ok: false, reason: check.reason, cost: check.cost };

    const result = applyUpgradePurchase(this.data, upgradeId, this.catalog);
    if (!result.purchased) return { ok: false, reason: result.reason, cost: check.cost };

    this.data = result.progress;
    this.save();
    return { ok: true, reason: null, cost: check.cost, level: this.data.upgrades[upgradeId] };
  }

  /**
   * Consolida la recompensa de una victoria. Idempotente por `runId`:
   * repetir la llamada con el mismo identificador no vuelve a sumar monedas.
   */
  commitLevelReward(payload) {
    const result = applyLevelReward(this.data, { ...payload, levelCount: this.levelCount });
    if (result.applied) {
      this.data = result.progress;
      this.save();
    }
    return result;
  }

  /** Registra una derrota (sin recompensas). */
  recordDefeat() {
    this.data = {
      ...this.data,
      totalRuns: Math.max(0, (this.data.totalRuns ?? 0) + 1),
    };
    this.save();
  }

  /** Borra todo el progreso persistente. Requiere confirmación en la interfaz. */
  reset() {
    this.data = createDefaultProgress();
    try {
      this.storage.removeItem(this.key);
    } catch {
      // Si falla el borrado, al menos la copia en memoria ya está limpia.
    }
    return this.data;
  }
}
