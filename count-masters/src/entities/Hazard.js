/**
 * Obstáculos.
 *
 * Tres tipos con lectura visual distinta y una única resolución por cruce:
 *  - 'saw'     sierra que oscila horizontalmente dentro de la pista.
 *  - 'barrier' barrera con un hueco seguro definido en datos.
 *  - 'block'   bloque de impacto fijo con radio de peligro.
 *
 * `evaluate()` decide si el cruce es un impacto; `markResolved()` garantiza que
 * un mismo obstáculo no vuelva a penalizar durante el mismo recorrido.
 */

import { COLORS, DEPTHS, FONT_FAMILY, GAME_CONFIG, TRACK_CENTER } from '../config/gameConfig.js';

export class Hazard {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.type = config.type;
    this.y = config.y;
    this.resolved = false;

    this.baseX = Number.isFinite(config.x) ? config.x : TRACK_CENTER;
    this.currentX = this.baseX;
    this.objects = [];
    this.band = null;
    this.sawSprite = null;
    this.glow = null;
  }

  build() {
    switch (this.type) {
      case 'saw':
        this.buildSaw();
        break;
      case 'barrier':
        this.buildBarrier();
        break;
      case 'block':
        this.buildBlock();
        break;
      default:
        throw new Error(`Tipo de obstáculo desconocido: ${String(this.type)}`);
    }
    return this;
  }

  // ------------------------------------------------------------------ sierra

  buildSaw() {
    const { trackLeft, trackRight } = GAME_CONFIG;
    const amplitude = this.config.amplitude ?? 170;
    const left = Math.max(trackLeft, this.baseX - amplitude - 60);
    const right = Math.min(trackRight, this.baseX + amplitude + 60);

    const band = this.scene.add.graphics().setDepth(DEPTHS.decoration);
    band.fillStyle(COLORS.hazard, 0.12);
    band.fillRect(left, this.y - 34, right - left, 68);
    for (let x = left; x < right; x += 36) {
      band.fillStyle(COLORS.hazard, 0.35);
      band.fillRect(x, this.y - 34, 16, 68);
    }
    band.lineStyle(2, COLORS.hazard, 0.55);
    band.strokeRect(left, this.y - 34, right - left, 68);
    this.band = band;
    this.objects.push(band);

    const glow = this.scene.add
      .image(this.currentX, this.y, 'glow')
      .setTint(COLORS.hazard)
      .setAlpha(0.45)
      .setScale(1.15)
      .setDepth(DEPTHS.hazard - 1);
    this.glow = glow;
    this.objects.push(glow);

    const saw = this.scene.add.image(this.currentX, this.y, 'saw').setDepth(DEPTHS.hazard);
    this.sawSprite = saw;
    this.objects.push(saw);

    this.objects.push(
      this.scene.add
        .text(TRACK_CENTER, this.y + 52, 'SIERRA', {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: '#ffb07a',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.7)
        .setDepth(DEPTHS.decoration),
    );
  }

  // ----------------------------------------------------------------- barrera

  buildBarrier() {
    const left = GAME_CONFIG.trackLeft;
    const right = GAME_CONFIG.trackRight;
    const gapWidth = this.config.gapWidth ?? 200;
    const gapCenter = this.config.gapCenter ?? TRACK_CENTER;
    const gapStart = gapCenter - gapWidth / 2;
    const gapEnd = gapCenter + gapWidth / 2;
    const height = 96;

    const g = this.scene.add.graphics().setDepth(DEPTHS.hazard);
    g.fillStyle(COLORS.hazardDark, 1);
    g.fillRect(left, this.y, Math.max(0, gapStart - left), height);
    g.fillRect(gapEnd, this.y, Math.max(0, right - gapEnd), height);

    for (let x = left; x < gapStart; x += 34) {
      g.fillStyle(COLORS.hazard, 0.85);
      g.fillRect(x, this.y, 15, height);
    }
    for (let x = gapEnd; x < right; x += 34) {
      g.fillStyle(COLORS.hazard, 0.85);
      g.fillRect(x, this.y, 15, height);
    }

    g.fillStyle(COLORS.hazard, 1);
    g.fillRect(left, this.y, Math.max(0, gapStart - left), 9);
    g.fillRect(gapEnd, this.y, Math.max(0, right - gapEnd), 9);

    // Marco luminoso del hueco seguro.
    g.fillStyle(COLORS.gain, 0.95);
    g.fillRect(gapStart - 5, this.y - 8, 10, height + 16);
    g.fillRect(gapEnd - 5, this.y - 8, 10, height + 16);
    g.fillStyle(COLORS.gain, 0.16);
    g.fillRect(gapStart, this.y, gapEnd - gapStart, height);
    g.fillStyle(COLORS.gain, 0.9);
    g.fillTriangle(gapCenter, this.y + 24, gapCenter - 18, this.y + 56, gapCenter + 18, this.y + 56);

    this.band = g;
    this.objects.push(g);

    this.objects.push(
      this.scene.add
        .text(gapCenter, this.y + height + 20, 'PASO', {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: '#7cf5d2',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.8)
        .setDepth(DEPTHS.decoration),
    );
  }

  // ------------------------------------------------------------------- bloque

  buildBlock() {
    const radius = this.config.radius ?? 70;
    const centerY = this.y + 46;

    const ring = this.scene.add.graphics().setDepth(DEPTHS.decoration);
    ring.fillStyle(COLORS.hazard, 0.1);
    ring.fillCircle(this.baseX, centerY, radius + 10);
    ring.lineStyle(3, COLORS.hazard, 0.65);
    ring.strokeCircle(this.baseX, centerY, radius + 10);
    this.band = ring;
    this.objects.push(ring);

    const block = this.scene.add
      .image(this.baseX, centerY, 'block')
      .setDepth(DEPTHS.hazard);
    this.objects.push(block);

    this.objects.push(
      this.scene.add
        .text(this.baseX, centerY + radius + 30, 'IMPACTO', {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: '#ffb07a',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.7)
        .setDepth(DEPTHS.decoration),
    );
  }

  // ------------------------------------------------------------------ lógica

  /** Anima la sierra. `active` es false cuando la partida está detenida. */
  update(time, dt, active = true) {
    if (this.type !== 'saw' || !this.sawSprite) return;
    if (active) {
      const seconds = time / 1000;
      const amplitude = this.config.amplitude ?? 170;
      const speed = this.config.speed ?? 1.2;
      const phase = this.config.phase ?? 0;
      this.currentX = this.baseX + amplitude * Math.sin(seconds * speed + phase);
      this.sawSprite.rotation += dt * 7;
    }
    this.sawSprite.x = this.currentX;
    if (this.glow) this.glow.x = this.currentX;
  }

  /** Cruce de la línea de activación (Y anterior > y >= Y actual). */
  isCrossed(previousY, currentY) {
    return !this.resolved && previousY > this.y && currentY <= this.y;
  }

  /** ¿El grupo impacta con este obstáculo en el momento del cruce? */
  evaluate(playerX, crowdHalfWidth = 20) {
    switch (this.type) {
      case 'saw': {
        const radius = this.config.radius ?? 54;
        return Math.abs(playerX - this.currentX) < radius + crowdHalfWidth * 0.5;
      }
      case 'barrier': {
        const gapWidth = this.config.gapWidth ?? 200;
        const gapCenter = this.config.gapCenter ?? TRACK_CENTER;
        const tolerance = Math.min(crowdHalfWidth * 0.35, 26);
        return Math.abs(playerX - gapCenter) > gapWidth / 2 - tolerance;
      }
      case 'block': {
        const radius = this.config.radius ?? 70;
        return Math.abs(playerX - this.baseX) < radius + crowdHalfWidth * 0.45;
      }
      default:
        return false;
    }
  }

  /** Marca el obstáculo como consumido y deja una señal visual. */
  markResolved(hit) {
    this.resolved = true;
    this.band?.setAlpha(0.4);

    this.objects.push(
      this.scene.add
        .text(this.currentX, this.y - 26, hit ? '✕' : '✓', {
          fontFamily: FONT_FAMILY,
          fontSize: '34px',
          color: hit ? '#ff5f6d' : '#2ee6a8',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(DEPTHS.effects),
    );
  }

  destroy() {
    this.objects.forEach((obj) => obj.destroy());
    this.objects.length = 0;
    this.band = null;
    this.sawSprite = null;
    this.glow = null;
  }
}
