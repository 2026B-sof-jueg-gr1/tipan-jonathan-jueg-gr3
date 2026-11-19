/**
 * Gestión de la multitud aliada.
 *
 * Separa estrictamente dos conceptos:
 *  - `population`: número lógico de integrantes (puede ser 99999).
 *  - sprites: como máximo `maxRendered` personajes dibujados.
 *
 * Los sprites se crean UNA vez (pool reutilizable) y solo se actualizan
 * posición, escala y visibilidad. Nunca se crean objetos ni texturas en update.
 */

import { CROWD_CONFIG, DEPTHS, GAME_CONFIG } from '../config/gameConfig.js';
import { normalizePopulation } from '../gameplay/rules.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default class CrowdManager {
  constructor(
    scene,
    {
      x,
      y,
      population,
      texture = 'ally',
      maxRendered = CROWD_CONFIG.maxRenderedAllies,
      depth = DEPTHS.crowd,
      onChange = null,
      composition = null,
    },
  ) {
    this.scene = scene;
    this.texture = texture;
    this.maxRendered = maxRendered;
    this.depth = depth;
    this.onChange = onChange;

    this.population = Math.max(0, Math.floor(Number(population) || 0));
    this.x = x;
    this.y = y;

    this.sprites = [];
    this.visualOverride = null;
    this.columns = 1;
    this.rows = 1;
    this.scaleValue = 1;
    this.pulse = 0;
    this.bobTime = 0;

    // Mosaico de cohortes: qué pueblo ocupa cada banda de filas.
    this.cohortPlan = this.buildCohortPlan(composition);
    this.densityFactor = 1;

    this.createPool();
    this.rebuildFormation();
  }

  /**
   * Convierte `[{ texture, weight }]` en bandas acumuladas [0..1].
   * El pueblo propio va siempre delante (primeras filas) y los aliados detrás.
   */
  buildCohortPlan(composition) {
    const valid = Array.isArray(composition)
      ? composition.filter((part) => part && part.texture && Number(part.weight) > 0)
      : [];
    const list = valid.length > 0 ? valid : [{ texture: this.texture, weight: 1 }];

    const total = list.reduce((sum, part) => sum + Number(part.weight), 0);
    let acc = 0;

    return list.map((part) => {
      const from = acc / total;
      acc += Number(part.weight);
      return { texture: part.texture, from, to: acc / total };
    });
  }

  /** Textura que corresponde a una fila concreta de la formación. */
  textureForRow(row, rows) {
    if (this.cohortPlan.length === 1) return this.cohortPlan[0].texture;
    const fraction = (row + 0.5) / Math.max(1, rows);
    for (const band of this.cohortPlan) {
      if (fraction >= band.from && fraction < band.to) return band.texture;
    }
    return this.cohortPlan[this.cohortPlan.length - 1].texture;
  }

  /**
   * Reasigna la textura de cada sprite según su fila. Solo cambia la textura
   * cuando de verdad hace falta, y nunca durante `update`.
   */
  applyCohorts() {
    const count = this.renderedCount;
    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / this.columns);
      const key = this.textureForRow(row, this.rows);
      const sprite = this.sprites[i];
      if (sprite.texture.key !== key) sprite.setTexture(key);
    }
  }

  createPool() {
    for (let i = 0; i < this.maxRendered; i += 1) {
      const sprite = this.scene.add
        .image(this.x, this.y, this.texture)
        .setOrigin(0.5, 1)
        .setDepth(this.depth)
        .setVisible(false)
        .setActive(false);
      this.sprites.push(sprite);
    }
  }

  /** Número de personajes que deben dibujarse para la población actual. */
  get renderedCount() {
    if (this.visualOverride !== null) return this.visualOverride;
    if (this.population <= 0) return 0;
    return Math.min(this.population, this.maxRendered);
  }

  get displayPopulation() {
    return this.population;
  }

  /** Mitad del ancho efectivo de la formación (para límites de pista). */
  get halfWidth() {
    const spacing = CROWD_CONFIG.horizontalSpacing * this.scaleValue;
    // 19 = mitad del ancho de la textura horneada (44 px a 1,4×).
    return ((this.columns - 1) / 2) * spacing + 19 * this.scaleValue;
  }

  /** Rango horizontal permitido para el centro de la formación. */
  getLateralBounds() {
    const maxHalf = (GAME_CONFIG.trackRight - GAME_CONFIG.trackLeft) / 2 - 10;
    const half = Math.min(this.halfWidth, maxHalf);
    return {
      min: GAME_CONFIG.trackLeft + half,
      max: GAME_CONFIG.trackRight - half,
    };
  }

  rebuildFormation() {
    const count = this.renderedCount;
    const effective = Math.max(1, count);

    this.columns = clamp(
      Math.ceil(Math.sqrt(effective * 1.35)),
      1,
      CROWD_CONFIG.maxColumns,
    );
    this.rows = Math.max(1, Math.ceil(effective / this.columns));
    this.scaleValue = clamp(
      1 - (count - 14) * 0.0035,
      CROWD_CONFIG.minVisibleScale,
      CROWD_CONFIG.maxVisibleScale,
    );

    for (let i = 0; i < this.sprites.length; i += 1) {
      const visible = i < count;
      this.sprites[i].setVisible(visible).setActive(visible);
    }

    // Densidad honesta: cuando la población lógica supera los sprites
    // disponibles, la formación se aprieta en lugar de crecer. La multitud se
    // ve más compacta, no más alta, y la cifra del HUD sigue siendo creíble.
    const overflow = Math.max(0, this.population - this.maxRendered);
    this.densityFactor = clamp(1 - overflow / (this.maxRendered * 8), 0.88, 1);

    this.applyCohorts();
  }

  /** Cambia la población lógica y reajusta la representación. */
  setPopulation(value) {
    const previous = this.population;
    const next = normalizePopulation(value);
    this.population = next;
    this.visualOverride = null;
    this.rebuildFormation();
    this.pulse = 1;
    if (next !== previous) this.onChange?.(next, previous);
    return next;
  }

  /**
   * Fuerza temporalmente cuántos sprites se dibujan (solo para la animación de
   * combate). No altera `population`.
   */
  setVisualCount(count) {
    this.visualOverride = clamp(Math.floor(count), 0, this.maxRendered);
    this.rebuildFormation();
  }

  clearVisualOverride() {
    this.visualOverride = null;
    this.rebuildFormation();
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  update(time, dt) {
    this.bobTime += dt;
    this.pulse = Math.max(0, this.pulse - dt * 3.2);
    this.layout();
  }

  layout() {
    const count = this.renderedCount;
    if (count === 0) return;

    const scale = this.scaleValue;
    const spacingX = CROWD_CONFIG.horizontalSpacing * scale * this.densityFactor;
    const spacingY = CROWD_CONFIG.verticalSpacing * scale * this.densityFactor;
    const spread = 1 + this.pulse * 0.3;
    const halfCols = (this.columns - 1) / 2;

    for (let i = 0; i < count; i += 1) {
      const sprite = this.sprites[i];
      const col = i % this.columns;
      const row = Math.floor(i / this.columns);
      const jitter = (((i * 37) % 7) - 3) * 0.7 * scale;
      const bob = Math.sin(this.bobTime * 9 + i * 0.85) * 2.1 * scale;

      sprite.setPosition(
        this.x + (col - halfCols) * spacingX * spread + jitter,
        this.y + row * spacingY * spread + bob,
      );
      sprite.setScale(scale * (i === 0 ? 1.07 : 1));
      sprite.setDepth(this.depth + row);
    }
  }

  /** Pequeña animación de celebración (no toca la población). */
  celebrate() {
    this.pulse = 1;
  }

  destroy() {
    this.sprites.forEach((sprite) => sprite.destroy());
    this.sprites.length = 0;
  }
}
