/**
 * Dibujo de la pista, el terreno, la decoración, la salida, la meta y el castillo.
 *
 * Todo se dibuja una única vez por nivel con `Graphics` (recursos procedurales
 * originales). No se generan texturas ni se crean objetos dentro de `update()`.
 */

import { GAME_CONFIG, COLORS, DEPTHS, TRACK_CENTER, TRACK_WIDTH, FONT_FAMILY } from '../config/gameConfig.js';

/** PRNG determinista: la decoración es idéntica en cada partida del nivel. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class TrackRenderer {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.castleFlags = [];
    this.castleGlow = null;
    this.level = null;
  }

  build(level) {
    this.level = level;
    this.drawTerrain();
    this.drawRoad();
    this.drawDecorations(level);
    this.drawStartLine();
    if (level.hasCastle) this.drawCastle(level);
    this.drawFinishLine(level);
    return this;
  }

  addObject(obj) {
    this.objects.push(obj);
    return obj;
  }

  graphics(depth) {
    return this.addObject(this.scene.add.graphics().setDepth(depth));
  }

  // ---------------------------------------------------------------- terreno

  drawTerrain() {
    const g = this.graphics(DEPTHS.background);
    const width = GAME_CONFIG.worldWidth;
    const height = GAME_CONFIG.worldHeight;

    g.fillStyle(COLORS.terrainEdge, 1);
    g.fillRect(0, 0, width, height);

    // Bandas horizontales: dan sensación de avance sin coste por fotograma.
    const bands = 14;
    const bandHeight = height / bands;
    for (let i = 0; i < bands; i += 1) {
      g.fillStyle(i % 2 === 0 ? COLORS.terrain : COLORS.terrainAlt, 1);
      g.fillRect(0, i * bandHeight, width, bandHeight);
    }

    // Laterales más oscuros para centrar la atención en la pista.
    g.fillStyle(0x05070f, 0.45);
    g.fillRect(0, 0, 400, height);
    g.fillRect(width - 400, 0, 400, height);

    // Halo suave alrededor de la calzada.
    g.fillStyle(0x1c2547, 0.5);
    g.fillRect(GAME_CONFIG.trackLeft - 120, 0, TRACK_WIDTH + 240, height);
  }

  // ------------------------------------------------------------------ pista

  drawRoad() {
    const g = this.graphics(DEPTHS.track);
    const left = GAME_CONFIG.trackLeft;
    const right = GAME_CONFIG.trackRight;
    const width = right - left;
    const top = GAME_CONFIG.finishY - 300;
    const bottom = GAME_CONFIG.startY + 260;
    const height = bottom - top;

    // Arcén.
    g.fillStyle(COLORS.shoulder, 1);
    g.fillRect(left - 34, top, width + 68, height);

    // Calzada y banda central iluminada (ilusión de profundidad).
    g.fillStyle(COLORS.road, 1);
    g.fillRect(left, top, width, height);
    g.fillStyle(COLORS.roadInner, 0.5);
    g.fillRect(left + 52, top, width - 104, height);
    g.fillStyle(0x354069, 0.28);
    g.fillRect(left + width * 0.32, top, width * 0.36, height);

    // Bordillos alternos.
    const curbColor = this.level?.theme?.curb ?? COLORS.curbA;
    for (let y = top, index = 0; y < bottom; y += 84, index += 1) {
      g.fillStyle(index % 2 === 0 ? curbColor : COLORS.curbB, index % 2 === 0 ? 0.9 : 1);
      g.fillRect(left - 18, y, 18, 84);
      g.fillRect(right, y, 18, 84);
    }

    // Línea central discontinua.
    for (let y = top; y < bottom; y += 150) {
      g.fillStyle(COLORS.roadLine, 0.8);
      g.fillRect(TRACK_CENTER - 4, y, 8, 66);
    }

    // Guías laterales tenues.
    g.fillStyle(0xffffff, 0.07);
    g.fillRect(left + width / 3, top, 3, height);
    g.fillRect(left + (width * 2) / 3, top, 3, height);

    // Flechas de dirección.
    for (let y = top + 260; y < bottom; y += 560) {
      g.fillStyle(0xffffff, 0.06);
      g.fillTriangle(TRACK_CENTER, y - 30, TRACK_CENTER - 30, y + 12, TRACK_CENTER + 30, y + 12);
      g.fillTriangle(TRACK_CENTER, y - 92, TRACK_CENTER - 30, y - 50, TRACK_CENTER + 30, y - 50);
    }
  }

  // ------------------------------------------------------------- decoración

  drawDecorations(level) {
    const g = this.graphics(DEPTHS.decoration);
    const random = mulberry32(1337 + level.id * 977);
    const startY = GAME_CONFIG.finishY - 240;
    const endY = GAME_CONFIG.startY + 220;

    for (let y = startY; y < endY; y += 108) {
      const roll = random();
      if (roll < 0.46) {
        const leftSide = random() < 0.5;
        const x = leftSide ? 452 + random() * 36 : 1096 + random() * 36;
        const radius = 14 + random() * 8;
        g.fillStyle(0x0d1220, 0.95);
        g.fillRect(x - 3, y, 6, 20);
        g.fillStyle(0x1b6b5a, 1);
        g.fillCircle(x, y - radius * 0.5, radius);
        g.fillStyle(0x2a9a7d, 0.7);
        g.fillCircle(x - radius * 0.28, y - radius * 0.75, radius * 0.52);
      } else if (roll < 0.66) {
        const leftSide = random() < 0.5;
        const x = leftSide ? 468 : 1132;
        g.fillStyle(0x0d1220, 1);
        g.fillRect(x - 3, y - 46, 6, 66);
        g.fillStyle(level.theme?.curb ?? COLORS.curbA, 0.18);
        g.fillCircle(x, y - 50, 18);
        g.fillStyle(level.theme?.curb ?? COLORS.curbA, 0.9);
        g.fillCircle(x, y - 50, 6);
      } else if (roll < 0.78) {
        const leftSide = random() < 0.5;
        const x = leftSide ? 470 : 1128;
        g.fillStyle(0x141c33, 1);
        g.fillCircle(x, y, 9 + random() * 6);
        g.fillStyle(0x1d2745, 1);
        g.fillCircle(x - 4, y - 3, 4);
      }
    }
  }

  // ----------------------------------------------------------------- salida

  drawStartLine() {
    const g = this.graphics(DEPTHS.track);
    const left = GAME_CONFIG.trackLeft;
    const width = TRACK_WIDTH;
    const y = GAME_CONFIG.startY + 90;

    g.fillStyle(0xffffff, 0.85);
    g.fillRect(left, y, width, 8);

    const cell = 26;
    for (let i = 0; i * cell < width; i += 1) {
      g.fillStyle(i % 2 === 0 ? 0xffffff : 0x0b0f1c, 0.85);
      g.fillRect(left + i * cell, y + 8, Math.min(cell, width - i * cell), 16);
    }

    this.addObject(
      this.scene.add
        .text(TRACK_CENTER, y + 58, 'SALIDA', {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          color: '#8fa3c8',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.55)
        .setDepth(DEPTHS.decoration),
    );
  }

  // ------------------------------------------------------------------ meta

  drawFinishLine(level) {
    const g = this.graphics(DEPTHS.decoration);
    const left = GAME_CONFIG.trackLeft;
    const right = GAME_CONFIG.trackRight;
    const width = TRACK_WIDTH;
    const y = GAME_CONFIG.finishY;

    // Banda a cuadros dorada.
    const cells = 20;
    const cellWidth = width / cells;
    for (let i = 0; i < cells; i += 1) {
      g.fillStyle(i % 2 === 0 ? COLORS.gold : 0x1a1305, 0.95);
      g.fillRect(left + i * cellWidth, y - 12, cellWidth, 24);
    }

    // Postes y dintel.
    g.fillStyle(0x141b32, 1);
    g.fillRect(left - 34, y - 150, 30, 150);
    g.fillRect(right + 4, y - 150, 30, 150);
    g.fillStyle(0x1e2745, 1);
    g.fillRect(left - 34, y - 150, 30, 14);
    g.fillRect(right + 4, y - 150, 30, 14);

    if (!level.hasCastle) {
      g.fillStyle(0x141b32, 1);
      g.fillRect(left - 34, y - 176, width + 68, 30);
      g.fillStyle(COLORS.gold, 0.9);
      g.fillRect(left - 34, y - 176, width + 68, 5);
      this.addObject(
        this.scene.add
          .text(TRACK_CENTER, y - 161, 'META', {
            fontFamily: FONT_FAMILY,
            fontSize: '24px',
            color: '#1a1305',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(DEPTHS.decoration),
      );
    }
  }

  // --------------------------------------------------------------- castillo

  drawCastle(level) {
    const g = this.graphics(DEPTHS.decoration);
    const centerX = TRACK_CENTER;
    const baseY = GAME_CONFIG.finishY - 14;
    const wallWidth = 600;
    const wallHeight = 190;
    const wallTop = baseY - wallHeight;

    // Halo de conquista (invisible al inicio).
    const glow = this.scene.add
      .rectangle(centerX, wallTop + 60, wallWidth + 160, wallHeight + 200, COLORS.gold, 0.0)
      .setDepth(DEPTHS.decoration - 1);
    this.castleGlow = this.addObject(glow);

    // Muralla.
    g.fillStyle(0x232a4a, 1);
    g.fillRect(centerX - wallWidth / 2, wallTop, wallWidth, wallHeight);
    g.fillStyle(0x2c3459, 1);
    g.fillRect(centerX - wallWidth / 2 + 14, wallTop + 14, wallWidth - 28, wallHeight - 14);

    // Sillería.
    g.fillStyle(0x1a2140, 0.7);
    for (let row = 0; row < 5; row += 1) {
      g.fillRect(centerX - wallWidth / 2 + 14, wallTop + 34 + row * 34, wallWidth - 28, 3);
    }

    // Almenas.
    for (let x = centerX - wallWidth / 2; x < centerX + wallWidth / 2 - 20; x += 56) {
      g.fillStyle(0x232a4a, 1);
      g.fillRect(x, wallTop - 26, 34, 28);
    }

    // Torres laterales.
    const towerWidth = 118;
    const towerHeight = 250;
    [-1, 1].forEach((side) => {
      const tx = centerX + side * (wallWidth / 2 + towerWidth / 2 - 18);
      const ty = baseY - towerHeight;
      g.fillStyle(0x1d2444, 1);
      g.fillRect(tx - towerWidth / 2, ty, towerWidth, towerHeight);
      g.fillStyle(0x2a3152, 1);
      g.fillRect(tx - towerWidth / 2 + 10, ty + 12, towerWidth - 20, towerHeight - 12);
      // Tejado.
      g.fillStyle(0x4b2a6b, 1);
      g.fillTriangle(
        tx - towerWidth / 2 - 12,
        ty,
        tx + towerWidth / 2 + 12,
        ty,
        tx,
        ty - 84,
      );
      // Ventana.
      g.fillStyle(0xffc93c, 0.75);
      g.fillRect(tx - 12, ty + 70, 24, 34);
    });

    // Puerta principal.
    g.fillStyle(0x0a0e1a, 1);
    g.fillRoundedRect(centerX - 66, baseY - 128, 132, 128, { tl: 66, tr: 66, bl: 0, br: 0 });
    g.fillStyle(0x3a2438, 1);
    g.fillRoundedRect(centerX - 54, baseY - 116, 108, 116, { tl: 54, tr: 54, bl: 0, br: 0 });
    g.fillStyle(0x0a0e1a, 0.85);
    for (let i = -1; i <= 1; i += 1) {
      g.fillRect(centerX + i * 28 - 3, baseY - 108, 6, 108);
    }

    // Estandartes (se recolorean al conquistar el castillo).
    const flagPositions = [
      { x: centerX - wallWidth / 2 - 40, y: wallTop + 40 },
      { x: centerX, y: wallTop - 96 },
      { x: centerX + wallWidth / 2 + 40, y: wallTop + 40 },
    ];
    flagPositions.forEach(({ x, y }) => {
      const pole = this.scene.add
        .rectangle(x, y - 24, 5, 90, 0x0a0e1a, 1)
        .setDepth(DEPTHS.decoration + 1);
      const flag = this.scene.add
        .triangle(x + 18, y - 54, 0, 0, 36, 12, 0, 24, COLORS.enemy, 1)
        .setDepth(DEPTHS.decoration + 1);
      this.addObject(pole);
      this.castleFlags.push(this.addObject(flag));
    });

    this.addObject(
      this.scene.add
        .text(centerX, wallTop - 136, 'CASTILLO DEL REY', {
          fontFamily: FONT_FAMILY,
          fontSize: '26px',
          color: '#ffc93c',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.9)
        .setDepth(DEPTHS.decoration),
    );
  }

  /** Cambia los estandartes al color aliado y enciende el halo. */
  conquerCastle() {
    this.castleFlags.forEach((flag, index) => {
      this.scene.time.delayedCall(index * 130, () => {
        if (!flag.active) return;
        flag.setFillStyle(COLORS.ally, 1);
        this.scene.tweens.add({
          targets: flag,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 220,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      });
    });

    if (this.castleGlow) {
      this.scene.tweens.add({
        targets: this.castleGlow,
        alpha: 0.5,
        duration: 800,
        ease: 'Sine.easeOut',
      });
    }
  }

  /** Marca la línea donde comienza un combate. */
  markBattleZone(y, label) {
    const g = this.graphics(DEPTHS.decoration);
    const left = GAME_CONFIG.trackLeft;
    const width = TRACK_WIDTH;

    g.fillStyle(COLORS.enemy, 0.1);
    g.fillRect(left, y - 14, width, 28);
    for (let x = left; x < left + width; x += 40) {
      g.fillStyle(COLORS.enemy, 0.55);
      g.fillRect(x, y - 4, 22, 8);
    }

    this.addObject(
      this.scene.add
        .text(TRACK_CENTER, y + 44, label, {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          color: '#ff9a8f',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.85)
        .setDepth(DEPTHS.decoration),
    );
  }

  destroy() {
    this.objects.forEach((obj) => obj.destroy());
    this.objects.length = 0;
    this.castleFlags.length = 0;
    this.castleGlow = null;
  }
}
