/**
 * Obstáculos del desfiladero.
 *
 * Tres tipos con lectura visual distinta y una única resolución por cruce:
 *  - 'blade'    hoja pendular que se desliza por un carril y oscila.
 *  - 'palisade' estacada de madera con un hueco seguro definido en datos.
 *  - 'boulder'  peñasco desprendido con radio de peligro fijo.
 *
 * `evaluate()` decide si el cruce es un impacto; `markResolved()` garantiza que
 * un mismo obstáculo no vuelva a penalizar durante el mismo recorrido.
 *
 * Los tres son de época: nada de sierras circulares ni franjas de obra. La
 * trampa es una hoja de bronce colgada de una viga, la estacada es madera
 * clavada en la tierra y el peñasco viene de un derrumbe.
 */

import { COLORS, DEPTHS, FONT_DISPLAY, GAME_CONFIG, TRACK_CENTER } from '../config/gameConfig.js';

const INK = 0x120c08;

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
    this.bladeSprite = null;
    this.glow = null;
  }

  build() {
    switch (this.type) {
      case 'blade':
        this.buildBlade();
        break;
      case 'palisade':
        this.buildPalisade();
        break;
      case 'boulder':
        this.buildBoulder();
        break;
      default:
        throw new Error(`Tipo de obstáculo desconocido: ${String(this.type)}`);
    }
    return this;
  }

  // ---------------------------------------------------------------- etiqueta

  /** Rótulo de suelo: dice qué es el obstáculo sin gritar. */
  addLabel(x, y, text, color = '#c9702f') {
    this.objects.push(
      this.scene.add
        .text(x, y, text, {
          fontFamily: FONT_DISPLAY,
          fontSize: '19px',
          color,
        })
        .setOrigin(0.5)
        .setAlpha(0.8)
        .setDepth(DEPTHS.decoration),
    );
  }

  // ------------------------------------------------------- hoja pendular

  buildBlade() {
    const { trackLeft, trackRight } = GAME_CONFIG;
    const amplitude = this.config.amplitude ?? 170;
    const left = Math.max(trackLeft, this.baseX - amplitude - 56);
    const right = Math.min(trackRight, this.baseX + amplitude + 56);
    const beamY = this.y - 60;

    // Viga de madera con abrazaderas de bronce: el carril por el que corre la hoja.
    const band = this.scene.add.graphics().setDepth(DEPTHS.decoration);
    band.fillStyle(0x000000, 0.32);
    band.fillRect(left, beamY + 6, right - left, 16);
    band.fillStyle(INK, 1);
    band.fillRect(left, beamY, right - left, 20);
    band.fillStyle(0x5a3a22, 1);
    band.fillRect(left, beamY + 2, right - left, 15);
    band.fillStyle(0x6b4a2f, 1);
    band.fillRect(left, beamY + 2, right - left, 7);
    band.fillStyle(0x8a5f1e, 1);
    band.fillRect(left, beamY + 2, right - left, 3);
    for (let x = left + 10; x < right; x += 64) {
      band.fillStyle(0x120c08, 1);
      band.fillRect(x, beamY - 4, 10, 26);
      band.fillStyle(0xc98a3c, 1);
      band.fillRect(x + 1, beamY - 2, 8, 4);
    }
    // Zona de barrido: polvo removido, no rayas de peligro.
    band.fillStyle(0xc9702f, 0.09);
    band.fillRect(left, this.y - 30, right - left, 60);
    band.fillStyle(0x000000, 0.18);
    band.fillRect(left, this.y + 26, right - left, 4);
    this.band = band;
    this.objects.push(band);

    const glow = this.scene.add
      .image(this.currentX, this.y, 'glow')
      .setTint(0xffb066)
      .setAlpha(0.28)
      .setScale(1.2)
      .setDepth(DEPTHS.hazard - 1);
    this.glow = glow;
    this.objects.push(glow);

    const blade = this.scene.add.image(this.currentX, this.y, 'blade').setDepth(DEPTHS.hazard);
    this.bladeSprite = blade;
    this.objects.push(blade);

    this.addLabel(TRACK_CENTER, this.y + 56, 'HOJA');
  }

  // ------------------------------------------------------------ estacada

  buildPalisade() {
    const left = GAME_CONFIG.trackLeft;
    const right = GAME_CONFIG.trackRight;
    const gapWidth = this.config.gapWidth ?? 200;
    const gapCenter = this.config.gapCenter ?? TRACK_CENTER;
    const gapStart = gapCenter - gapWidth / 2;
    const gapEnd = gapCenter + gapWidth / 2;
    const height = 104;

    const g = this.scene.add.graphics().setDepth(DEPTHS.hazard);

    // Sombra de la empalizada sobre la calzada.
    g.fillStyle(0x000000, 0.4);
    g.fillRect(left, this.y + height, right - left, 14);

    // Estacas: madera clavada, puntas afiladas, tonos alternos.
    const stake = (x) => {
      g.fillStyle(INK, 1);
      g.fillRect(x - 1, this.y - 4, 18, height + 6);
      g.fillStyle(0x5a3a22, 1);
      g.fillRect(x + 1, this.y - 2, 14, height + 2);
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(x + 1, this.y - 2, 6, height + 2);
      g.fillStyle(0x8a5f1e, 1);
      g.fillRect(x + 2, this.y - 2, 4, height + 2);
      // Punta.
      g.fillStyle(INK, 1);
      g.fillTriangle(x - 1, this.y - 2, x + 17, this.y - 2, x + 8, this.y - 24);
      g.fillStyle(0x8d8271, 1);
      g.fillTriangle(x + 1, this.y - 3, x + 15, this.y - 3, x + 8, this.y - 21);
      // Veta.
      g.fillStyle(0x000000, 0.2);
      g.fillRect(x + 7, this.y + 6, 1.5, height - 12);
    };

    for (let x = left; x < gapStart - 10; x += 19) stake(x);
    for (let x = gapEnd + 10; x < right; x += 19) stake(x);

    // Travesaños horizontales.
    [this.y + 20, this.y + 68].forEach((y) => {
      g.fillStyle(0x000000, 0.28);
      g.fillRect(left, y + 3, Math.max(0, gapStart - left), 9);
      g.fillRect(gapEnd, y + 3, Math.max(0, right - gapEnd), 9);
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(left, y, Math.max(0, gapStart - left), 9);
      g.fillRect(gapEnd, y, Math.max(0, right - gapEnd), 9);
    });

    // Hueco: tierra pisada y dos postes con antorcha.
    g.fillStyle(0x8a5f1e, 0.1);
    g.fillRect(gapStart, this.y - 10, gapEnd - gapStart, height + 20);
    g.fillStyle(0xf2c879, 0.55);
    g.fillRect(gapStart - 4, this.y - 12, 4, height + 24);
    g.fillRect(gapEnd, this.y - 12, 4, height + 24);
    [-1, 1].forEach((side) => {
      const px = gapCenter + side * (gapWidth / 2 + 16);
      g.fillStyle(INK, 1);
      g.fillRect(px - 5, this.y - 30, 10, height + 26);
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(px - 3, this.y - 30, 6, height + 26);
      g.fillStyle(0xc4472f, 0.9);
      g.fillTriangle(px, this.y - 52, px + 7, this.y - 30, px - 7, this.y - 30);
      g.fillStyle(0xf2c879, 1);
      g.fillTriangle(px, this.y - 44, px + 4, this.y - 30, px - 4, this.y - 30);
    });

    this.band = g;
    this.objects.push(g);

    this.addLabel(gapCenter, this.y + height + 26, 'PASO', '#f2c879');
  }

  // ------------------------------------------------------------- peñasco

  buildBoulder() {
    const radius = this.config.radius ?? 70;
    const centerY = this.y + 46;

    const ring = this.scene.add.graphics().setDepth(DEPTHS.decoration);
    // Polvo del derrumbe, en lugar de un aro de neón.
    ring.fillStyle(0x8a5f1e, 0.1);
    ring.fillCircle(this.baseX, centerY, radius + 14);
    ring.fillStyle(0x000000, 0.2);
    ring.fillEllipse(this.baseX, centerY + radius * 0.55, radius * 1.8, radius * 0.7);
    this.band = ring;
    this.objects.push(ring);

    const boulder = this.scene.add.image(this.baseX, centerY, 'boulder').setDepth(DEPTHS.hazard);
    this.objects.push(boulder);

    // Esquirlas alrededor: el peñasco no está solo.
    const shard = this.scene.add.graphics().setDepth(DEPTHS.hazard - 1);
    shard.fillStyle(0x000000, 0.3);
    shard.fillEllipse(this.baseX - radius * 0.9, centerY + radius * 0.5, 26, 8);
    shard.fillEllipse(this.baseX + radius * 0.95, centerY + radius * 0.62, 22, 7);
    shard.fillStyle(0x5a4f3c, 1);
    shard.fillEllipse(this.baseX - radius * 0.9, centerY + radius * 0.42, 24, 14);
    shard.fillEllipse(this.baseX + radius * 0.95, centerY + radius * 0.54, 20, 12);
    shard.fillStyle(0x7f7261, 1);
    shard.fillEllipse(this.baseX - radius * 0.94, centerY + radius * 0.36, 12, 7);
    this.objects.push(shard);

    this.addLabel(this.baseX, centerY + radius + 34, 'PEÑASCO');
  }

  // ------------------------------------------------------------------ lógica

  /** Anima la hoja. `active` es false cuando la partida está detenida. */
  update(time, dt, active = true) {
    if (this.type !== 'blade' || !this.bladeSprite) return;
    if (active) {
      const seconds = time / 1000;
      const amplitude = this.config.amplitude ?? 170;
      const speed = this.config.speed ?? 1.2;
      const phase = this.config.phase ?? 0;
      this.currentX = this.baseX + amplitude * Math.sin(seconds * speed + phase);
      // Péndulo: la hoja se balancea mientras el carro recorre la viga.
      this.bladeSprite.rotation = 0.16 * Math.sin(seconds * speed * 2 + phase);
    }
    this.bladeSprite.x = this.currentX;
    if (this.glow) this.glow.x = this.currentX;
  }

  /** Cruce de la línea de activación (Y anterior > y >= Y actual). */
  isCrossed(previousY, currentY) {
    return !this.resolved && previousY > this.y && currentY <= this.y;
  }

  /** ¿El grupo impacta con este obstáculo en el momento del cruce? */
  evaluate(playerX, crowdHalfWidth = 20) {
    switch (this.type) {
      case 'blade': {
        const radius = this.config.radius ?? 54;
        return Math.abs(playerX - this.currentX) < radius + crowdHalfWidth * 0.5;
      }
      case 'palisade': {
        const gapWidth = this.config.gapWidth ?? 200;
        const gapCenter = this.config.gapCenter ?? TRACK_CENTER;
        const tolerance = Math.min(crowdHalfWidth * 0.35, 26);
        return Math.abs(playerX - gapCenter) > gapWidth / 2 - tolerance;
      }
      case 'boulder': {
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
          fontFamily: FONT_DISPLAY,
          fontSize: '36px',
          color: hit ? '#c4543a' : '#3fc9b0',
        })
        .setOrigin(0.5)
        .setDepth(DEPTHS.effects),
    );
  }

  destroy() {
    this.objects.forEach((obj) => obj.destroy());
    this.objects.length = 0;
    this.band = null;
    this.bladeSprite = null;
    this.glow = null;
  }
}
