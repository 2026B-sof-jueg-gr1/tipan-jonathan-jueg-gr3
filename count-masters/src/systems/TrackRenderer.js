/**
 * Dibujo de la pista, el terreno, la decoración, la salida, la meta y el castillo.
 *
 * Todo se dibuja una única vez por nivel con `Graphics` y `TileSprite`
 * (recursos procedurales originales). No se generan texturas ni se crean
 * objetos dentro de `update()`.
 *
 * Dirección de arte: un desfiladero de piedra con una calzada de tierra
 * apisonada. Nada de asfalto, líneas discontinuas ni flechas de tráfico: eso
 * convertía el juego en una carretera y rompía la ficción.
 */

import {
  GAME_CONFIG,
  COLORS,
  DEPTHS,
  TRACK_CENTER,
  TRACK_WIDTH,
  FONT_DISPLAY,
  FONT_FAMILY,
} from '../config/gameConfig.js';

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
    this.startY = GAME_CONFIG.startY;
    this.finishY = GAME_CONFIG.finishY;
  }

  build(level) {
    this.level = level;
    this.startY = level.startY ?? GAME_CONFIG.startY;
    this.finishY = level.finishY ?? GAME_CONFIG.finishY;
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
    const width = GAME_CONFIG.worldWidth;
    const height = GAME_CONFIG.worldHeight;

    // Estratos de roca, repetidos desde una baldosa de 256 px.
    const terrain = this.scene.add
      .tileSprite(0, 0, width, height, 'tile_terrain')
      .setOrigin(0, 0)
      .setDepth(DEPTHS.background);
    this.addObject(terrain);

    const g = this.graphics(DEPTHS.background + 1);

    // Penumbra lateral: concentra la mirada en la calzada.
    g.fillStyle(0x050302, 0.55);
    g.fillRect(0, 0, 300, height);
    g.fillRect(width - 300, 0, 300, height);
    g.fillStyle(0x050302, 0.28);
    g.fillRect(300, 0, 140, height);
    g.fillRect(width - 440, 0, 140, height);

    // Halo cálido alrededor de la calzada.
    g.fillStyle(0x8a5f1e, 0.05);
    g.fillRect(GAME_CONFIG.trackLeft - 180, 0, TRACK_WIDTH + 360, height);
    g.fillStyle(0x8a5f1e, 0.05);
    g.fillRect(GAME_CONFIG.trackLeft - 90, 0, TRACK_WIDTH + 180, height);
  }

  // ------------------------------------------------------------------ pista

  drawRoad() {
    const left = GAME_CONFIG.trackLeft;
    const right = GAME_CONFIG.trackRight;
    const width = right - left;
    const top = this.finishY - 320;
    const bottom = this.startY + 300;
    const height = bottom - top;

    // Arcén de tierra pisada.
    const shoulder = this.scene.add
      .tileSprite(left - 46, top, width + 92, height, 'tile_terrain')
      .setOrigin(0, 0)
      .setDepth(DEPTHS.track - 1)
      .setTint(0x8a7050);
    this.addObject(shoulder);

    // Calzada empedrada.
    const road = this.scene.add
      .tileSprite(left, top, width, height, 'tile_road')
      .setOrigin(0, 0)
      .setDepth(DEPTHS.track);
    this.addObject(road);

    const g = this.graphics(DEPTHS.track + 1);

    // Rodadas: dos franjas más oscuras por donde pasa la multitud.
    g.fillStyle(0x000000, 0.14);
    g.fillRect(left + width * 0.2, top, 62, height);
    g.fillRect(left + width * 0.66, top, 62, height);

    // Polvo levantado en el centro.
    g.fillStyle(0x8a5f1e, 0.05);
    g.fillRect(left + width * 0.34, top, width * 0.32, height);

    // Bordes de la calzada: losa de bronce y sombra interior.
    const curb = this.level?.theme?.curb ?? COLORS.curbA;
    g.fillStyle(0x000000, 0.45);
    g.fillRect(left - 18, top, 18, height);
    g.fillRect(right, top, 18, height);
    g.fillStyle(0x2e2116, 1);
    g.fillRect(left - 14, top, 14, height);
    g.fillRect(right, top, 14, height);
    g.fillStyle(curb, 0.55);
    g.fillRect(left - 14, top, 4, height);
    g.fillRect(right + 10, top, 4, height);

    // Mojones de bronce cada 220 px: marcan el avance sin parecer una autopista.
    for (let y = top + 110; y < bottom; y += 220) {
      g.fillStyle(0x000000, 0.4);
      g.fillRect(left - 26, y - 2, 16, 26);
      g.fillStyle(0x8a5f1e, 1);
      g.fillRect(left - 26, y - 4, 16, 26);
      g.fillStyle(curb, 0.85);
      g.fillRect(left - 26, y - 4, 16, 5);
      g.fillStyle(0x000000, 0.4);
      g.fillRect(right + 10, y - 2, 16, 26);
      g.fillStyle(0x8a5f1e, 1);
      g.fillRect(right + 10, y - 4, 16, 26);
      g.fillStyle(curb, 0.85);
      g.fillRect(right + 10, y - 4, 16, 5);
    }
  }

  // ------------------------------------------------------------- decoración

  drawDecorations(level) {
    const g = this.graphics(DEPTHS.decoration);
    const random = mulberry32(1337 + level.id * 977);
    const startY = this.finishY - 260;
    const endY = this.startY + 240;

    // Reparto alterno: nunca dos piezas grandes seguidas del mismo lado.
    const catalogue = ['column', 'cypress', 'rock', 'amphora', 'brazier', 'banner', 'cypress'];
    let index = 0;

    for (let y = startY; y < endY; y += 150) {
      const roll = random();
      if (roll < 0.24) continue; // huecos: el desfiladero también respira

      const leftSide = random() < 0.5;
      const key = catalogue[index % catalogue.length];
      index += 1;

      const baseX = leftSide ? 430 - random() * 90 : 1170 + random() * 90;
      const jitter = random() * 40;

      this.placeProp(g, key, baseX, y + jitter, random, leftSide);

      // Piedras sueltas junto al arcén, siempre pequeñas.
      if (random() < 0.5) {
        const sx = leftSide ? 500 + random() * 24 : 1076 - random() * 24;
        g.fillStyle(0x000000, 0.22);
        g.fillEllipse(sx, y + jitter + 26, 18, 5);
        g.fillStyle(0x4e3f2c, 1);
        g.fillEllipse(sx, y + jitter + 22, 15, 10);
        g.fillStyle(0x7a6850, 1);
        g.fillEllipse(sx - 2, y + jitter + 20, 8, 5);
      }
    }
  }

  /** Dibuja una pieza de decorado a escala variable según el tipo. */
  placeProp(g, key, x, y, random, leftSide) {
    const flip = leftSide ? 1 : -1;
    const s = 0.72 + random() * 0.5;

    switch (key) {
      case 'column': {
        const h = 132 * s;
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(x, y + 6, 54 * s, 14 * s);
        g.fillStyle(0x120c08, 1);
        g.fillRect(x - 16 * s, y - h, 32 * s, h);
        g.fillStyle(0x9a8a6e, 1);
        g.fillRect(x - 14 * s, y - h + 2, 28 * s, h - 2);
        g.fillStyle(0xa89b86, 1);
        g.fillRect(x - 14 * s, y - h + 2, 9 * s, h - 2);
        g.fillStyle(0x7a6850, 1);
        g.fillRect(x + 4 * s, y - h + 2, 10 * s, h - 2);
        g.fillStyle(0x9c907b, 1);
        g.fillRect(x - 19 * s, y - h - 10 * s, 38 * s, 12 * s);
        g.fillStyle(0x7a6850, 1);
        g.fillRect(x - 21 * s, y - 6 * s, 42 * s, 8 * s);
        break;
      }
      case 'cypress': {
        const h = 110 * s;
        g.fillStyle(0x000000, 0.28);
        g.fillEllipse(x, y + 4, 30 * s, 9 * s);
        g.fillStyle(0x120c08, 1);
        g.fillRect(x - 3 * s, y - h * 0.28, 6 * s, h * 0.3);
        g.fillEllipse(x, y - h * 0.55, 34 * s, h * 0.86);
        g.fillStyle(0x1f3a2a, 1);
        g.fillEllipse(x, y - h * 0.55, 29 * s, h * 0.8);
        g.fillStyle(0x2c5038, 1);
        g.fillEllipse(x - 4 * s, y - h * 0.58, 14 * s, h * 0.56);
        g.fillStyle(0x16291e, 1);
        g.fillEllipse(x + 6 * s, y - h * 0.5, 11 * s, h * 0.5);
        break;
      }
      case 'rock': {
        g.fillStyle(0x000000, 0.24);
        g.fillEllipse(x, y + 4, 40 * s, 10 * s);
        g.fillStyle(0x120c08, 1);
        g.fillEllipse(x, y - 10 * s, 42 * s, 28 * s);
        g.fillStyle(0x5c4a34, 1);
        g.fillEllipse(x, y - 11 * s, 38 * s, 24 * s);
        g.fillStyle(0x7f7261, 1);
        g.fillTriangle(x - 13 * s, y - 14 * s, x + 2 * s, y - 26 * s, x + 8 * s, y - 10 * s);
        g.fillStyle(0x4e3f2c, 1);
        g.fillTriangle(x + 8 * s, y - 10 * s, x + 19 * s, y - 20 * s, x + 20 * s, y - 6 * s);
        break;
      }
      case 'amphora': {
        g.fillStyle(0x000000, 0.26);
        g.fillEllipse(x, y + 3, 24 * s, 7 * s);
        g.fillStyle(0x120c08, 1);
        g.fillEllipse(x, y - 16 * s, 25 * s, 33 * s);
        g.fillStyle(0x8c4a2a, 1);
        g.fillEllipse(x, y - 16 * s, 21 * s, 29 * s);
        g.fillStyle(0xa85c34, 1);
        g.fillEllipse(x - 3 * s, y - 18 * s, 9 * s, 18 * s);
        g.fillStyle(0x8c4a2a, 1);
        g.fillRect(x - 4 * s, y - 36 * s, 8 * s, 9 * s);
        g.fillStyle(0x2e1a10, 0.7);
        g.fillRect(x - 9 * s, y - 14 * s, 18 * s, 3 * s);
        break;
      }
      case 'brazier': {
        const h = 62 * s;
        g.fillStyle(0x000000, 0.28);
        g.fillEllipse(x, y + 3, 30 * s, 8 * s);
        g.fillStyle(0x120c08, 1);
        g.fillRect(x - 3 * s, y - h * 0.4, 6 * s, h * 0.42);
        g.fillStyle(0x5c4a34, 1);
        g.fillRect(x - 2 * s, y - h * 0.4, 4 * s, h * 0.42);
        g.fillStyle(0x120c08, 1);
        g.fillTriangle(x - 17 * s, y - h * 0.62, x + 17 * s, y - h * 0.62, x, y - h * 0.38);
        g.fillStyle(0x8a5f1e, 1);
        g.fillTriangle(x - 14 * s, y - h * 0.6, x + 14 * s, y - h * 0.6, x, y - h * 0.4);
        g.fillStyle(0xc4472f, 0.9);
        g.fillTriangle(x, y - h, x + 9 * s, y - h * 0.62, x - 9 * s, y - h * 0.62);
        g.fillStyle(0xe08b3a, 1);
        g.fillTriangle(x, y - h * 0.86, x + 6 * s, y - h * 0.64, x - 6 * s, y - h * 0.64);
        g.fillStyle(0xf2c879, 1);
        g.fillTriangle(x, y - h * 0.76, x + 3.5 * s, y - h * 0.64, x - 3.5 * s, y - h * 0.64);
        // Halo de luz sobre el suelo.
        const glow = this.scene.add
          .image(x, y - h * 0.7, 'glow')
          .setTint(0xffb066)
          .setAlpha(0.22)
          .setScale(1.4 * s)
          .setDepth(DEPTHS.decoration - 1);
        this.addObject(glow);
        break;
      }
      case 'banner':
      default: {
        const h = 104 * s;
        g.fillStyle(0x000000, 0.26);
        g.fillEllipse(x, y + 3, 22 * s, 6 * s);
        g.fillStyle(0x120c08, 1);
        g.fillRect(x - 3 * s, y - h, 6 * s, h);
        g.fillStyle(0x6b4a2f, 1);
        g.fillRect(x - 2 * s, y - h, 4 * s, h);
        g.fillStyle(0xf2c879, 1);
        g.fillCircle(x, y - h, 4 * s);
        g.fillStyle(0x120c08, 1);
        g.fillRect(x + flip * 1 * s, y - h + 6 * s, flip * 20 * s, 44 * s);
        g.fillStyle(0x8c3a20, 1);
        g.fillRect(x + flip * 2 * s, y - h + 7 * s, flip * 17 * s, 40 * s);
        g.fillStyle(0xb4552f, 1);
        g.fillRect(x + flip * 2 * s, y - h + 7 * s, flip * 8 * s, 40 * s);
        g.fillStyle(0xf2c879, 0.85);
        g.fillCircle(x + flip * 10 * s, y - h + 24 * s, 4 * s);
        g.fillStyle(0x8c3a20, 1);
        g.fillTriangle(
          x + flip * 2 * s,
          y - h + 47 * s,
          x + flip * 19 * s,
          y - h + 47 * s,
          x + flip * 10 * s,
          y - h + 58 * s,
        );
        break;
      }
    }
  }

  // ----------------------------------------------------------------- salida

  drawStartLine() {
    const g = this.graphics(DEPTHS.track + 2);
    const left = GAME_CONFIG.trackLeft;
    const right = GAME_CONFIG.trackRight;
    const width = TRACK_WIDTH;
    const y = this.startY + 110;

    // Dintel de piedra.
    g.fillStyle(0x000000, 0.4);
    g.fillRect(left - 54, y - 34, 34, 96);
    g.fillRect(right + 20, y - 34, 34, 96);
    g.fillStyle(0x7a6850, 1);
    g.fillRect(left - 54, y - 40, 34, 96);
    g.fillRect(right + 20, y - 40, 34, 96);
    g.fillStyle(0x9a8a6e, 1);
    g.fillRect(left - 54, y - 40, 34, 12);
    g.fillRect(right + 20, y - 40, 34, 12);

    // Franja de bronce sobre la calzada.
    g.fillStyle(0x120c08, 1);
    g.fillRect(left, y - 6, width, 14);
    g.fillStyle(COLORS.bronze, 1);
    g.fillRect(left, y - 4, width, 8);
    g.fillStyle(0xf2c879, 0.7);
    g.fillRect(left, y - 4, width, 2);

    this.addObject(
      this.scene.add
        .text(TRACK_CENTER, y + 46, 'SALIDA', {
          fontFamily: FONT_DISPLAY,
          fontSize: '26px',
          color: '#c98a3c',
        })
        .setOrigin(0.5)
        .setAlpha(0.75)
        .setDepth(DEPTHS.decoration),
    );
  }

  // ------------------------------------------------------------------ meta

  drawFinishLine(level) {
    const g = this.graphics(DEPTHS.decoration);
    const left = GAME_CONFIG.trackLeft;
    const right = GAME_CONFIG.trackRight;
    const width = TRACK_WIDTH;
    const y = this.finishY;

    // Banda de bronce a cuadros.
    const cells = 22;
    const cellWidth = width / cells;
    for (let i = 0; i < cells; i += 1) {
      g.fillStyle(i % 2 === 0 ? COLORS.bronze : 0x1a1208, 0.95);
      g.fillRect(left + i * cellWidth, y - 10, cellWidth, 20);
    }

    // Jambas de sillería.
    g.fillStyle(0x120c08, 1);
    g.fillRect(left - 40, y - 160, 36, 160);
    g.fillRect(right + 4, y - 160, 36, 160);
    g.fillStyle(0x7a6850, 1);
    g.fillRect(left - 40, y - 160, 36, 160);
    g.fillRect(right + 4, y - 160, 36, 160);
    g.fillStyle(0x9a8a6e, 1);
    g.fillRect(left - 40, y - 160, 12, 160);
    g.fillRect(right + 4, y - 160, 12, 160);
    for (let i = 0; i < 4; i += 1) {
      g.fillStyle(0x000000, 0.28);
      g.fillRect(left - 40, y - 160 + i * 40, 36, 3);
      g.fillRect(right + 4, y - 160 + i * 40, 36, 3);
    }

    if (!level.hasCastle) {
      g.fillStyle(0x120c08, 1);
      g.fillRect(left - 54, y - 186, width + 108, 34);
      g.fillStyle(0x7a6850, 1);
      g.fillRect(left - 54, y - 182, width + 108, 26);
      g.fillStyle(0x9a8a6e, 1);
      g.fillRect(left - 54, y - 182, width + 108, 6);
      g.fillStyle(COLORS.bronze, 0.9);
      g.fillRect(left - 54, y - 156, width + 108, 3);
      this.addObject(
        this.scene.add
          .text(TRACK_CENTER, y - 168, 'META', {
            fontFamily: FONT_DISPLAY,
            fontSize: '26px',
            color: '#f2c879',
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
    const baseY = this.finishY - 14;
    const wallWidth = 600;
    const wallHeight = 200;
    const wallTop = baseY - wallHeight;

    const glow = this.scene.add
      .rectangle(centerX, wallTop + 60, wallWidth + 160, wallHeight + 200, COLORS.gold, 0.0)
      .setDepth(DEPTHS.decoration - 1);
    this.castleGlow = this.addObject(glow);

    // Sombra proyectada.
    g.fillStyle(0x000000, 0.45);
    g.fillRect(centerX - wallWidth / 2 - 20, wallTop + 16, wallWidth + 40, wallHeight);

    // Muralla de sillería cálida.
    g.fillStyle(0x5c4a34, 1);
    g.fillRect(centerX - wallWidth / 2, wallTop, wallWidth, wallHeight);
    g.fillStyle(0x7a6850, 1);
    g.fillRect(centerX - wallWidth / 2 + 10, wallTop + 10, wallWidth - 20, wallHeight - 10);
    g.fillStyle(0x7f7261, 1);
    g.fillRect(centerX - wallWidth / 2 + 10, wallTop + 10, wallWidth - 20, 26);

    // Hiladas de piedra.
    for (let row = 0; row < 6; row += 1) {
      const y = wallTop + 34 + row * 28;
      g.fillStyle(0x000000, 0.26);
      g.fillRect(centerX - wallWidth / 2 + 10, y, wallWidth - 20, 3);
      const offset = row % 2 === 0 ? 0 : 34;
      for (let x = centerX - wallWidth / 2 + 10 + offset; x < centerX + wallWidth / 2 - 10; x += 68) {
        g.fillStyle(0x000000, 0.16);
        g.fillRect(x, y + 3, 2, 25);
      }
    }

    // Almenas.
    for (let x = centerX - wallWidth / 2; x < centerX + wallWidth / 2 - 20; x += 58) {
      g.fillStyle(0x120c08, 1);
      g.fillRect(x - 2, wallTop - 30, 38, 34);
      g.fillStyle(0x7a6850, 1);
      g.fillRect(x, wallTop - 28, 34, 30);
      g.fillStyle(0x9a8a6e, 1);
      g.fillRect(x, wallTop - 28, 34, 8);
    }

    // Torres laterales con tejado cónico.
    const towerWidth = 122;
    const towerHeight = 264;
    [-1, 1].forEach((side) => {
      const tx = centerX + side * (wallWidth / 2 + towerWidth / 2 - 20);
      const ty = baseY - towerHeight;
      g.fillStyle(0x000000, 0.4);
      g.fillRect(tx - towerWidth / 2 + 8, ty + 14, towerWidth, towerHeight);
      g.fillStyle(0x4e3f2c, 1);
      g.fillRect(tx - towerWidth / 2, ty, towerWidth, towerHeight);
      g.fillStyle(0x7a6850, 1);
      g.fillRect(tx - towerWidth / 2 + 10, ty + 10, towerWidth - 20, towerHeight - 10);
      g.fillStyle(0x9a8a6e, 1);
      g.fillRect(tx - towerWidth / 2 + 10, ty + 10, 16, towerHeight - 10);
      // Tejado de teja.
      g.fillStyle(0x120c08, 1);
      g.fillTriangle(tx - towerWidth / 2 - 16, ty + 4, tx + towerWidth / 2 + 16, ty + 4, tx, ty - 92);
      g.fillStyle(0x8c3a20, 1);
      g.fillTriangle(tx - towerWidth / 2 - 10, ty, tx + towerWidth / 2 + 10, ty, tx, ty - 84);
      g.fillStyle(0xa8502e, 1);
      g.fillTriangle(tx - towerWidth / 2 - 10, ty, tx - 4, ty, tx, ty - 84);
      // Ventana con luz.
      g.fillStyle(0x120c08, 1);
      g.fillRect(tx - 15, ty + 74, 30, 42);
      g.fillStyle(0xf2c879, 0.8);
      g.fillRect(tx - 12, ty + 77, 24, 36);
      g.fillStyle(0xffe9b0, 0.6);
      g.fillRect(tx - 12, ty + 77, 24, 12);
    });

    // Puerta en arco.
    g.fillStyle(0x120c08, 1);
    g.fillRoundedRect(centerX - 74, baseY - 140, 148, 140, { tl: 74, tr: 74, bl: 0, br: 0 });
    g.fillStyle(0x2e2116, 1);
    g.fillRoundedRect(centerX - 62, baseY - 128, 124, 128, { tl: 62, tr: 62, bl: 0, br: 0 });
    // Tablones y herrajes.
    for (let i = -2; i <= 2; i += 1) {
      g.fillStyle(0x1a1208, 0.9);
      g.fillRect(centerX + i * 24 - 2, baseY - 122, 4, 122);
    }
    g.fillStyle(0x8a5f1e, 1);
    g.fillRect(centerX - 62, baseY - 70, 124, 7);
    g.fillStyle(0x8a5f1e, 1);
    g.fillRect(centerX - 62, baseY - 26, 124, 7);

    // Antorchas junto a la puerta.
    [-1, 1].forEach((side) => {
      const tx = centerX + side * 96;
      g.fillStyle(0x120c08, 1);
      g.fillRect(tx - 4, baseY - 96, 8, 40);
      g.fillStyle(0xc4472f, 0.95);
      g.fillTriangle(tx, baseY - 130, tx + 11, baseY - 96, tx - 11, baseY - 96);
      g.fillStyle(0xf2c879, 1);
      g.fillTriangle(tx, baseY - 118, tx + 6, baseY - 96, tx - 6, baseY - 96);
      const torchGlow = this.scene.add
        .image(tx, baseY - 110, 'glow')
        .setTint(0xffb066)
        .setAlpha(0.3)
        .setScale(1.1)
        .setDepth(DEPTHS.decoration + 1);
      this.addObject(torchGlow);
    });

    // Estandartes del rey.
    const flagPositions = [
      { x: centerX - wallWidth / 2 - 44, y: wallTop + 44 },
      { x: centerX, y: wallTop - 100 },
      { x: centerX + wallWidth / 2 + 44, y: wallTop + 44 },
    ];
    flagPositions.forEach(({ x, y }) => {
      const pole = this.scene.add
        .rectangle(x, y - 26, 5, 96, 0x120c08, 1)
        .setDepth(DEPTHS.decoration + 1);
      const flag = this.scene.add
        .triangle(x + 20, y - 58, 0, 0, 40, 13, 0, 26, COLORS.enemy, 1)
        .setDepth(DEPTHS.decoration + 1);
      this.addObject(pole);
      this.castleFlags.push(this.addObject(flag));
    });

    this.addObject(
      this.scene.add
        .text(centerX, wallTop - 142, 'CASTILLO DEL REY', {
          fontFamily: FONT_DISPLAY,
          fontSize: '28px',
          color: '#f2c879',
        })
        .setOrigin(0.5)
        .setAlpha(0.92)
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

    g.fillStyle(COLORS.enemy, 0.08);
    g.fillRect(left, y - 16, width, 32);
    for (let x = left; x < left + width; x += 44) {
      g.fillStyle(COLORS.enemy, 0.45);
      g.fillRect(x, y - 3, 24, 6);
    }

    this.addObject(
      this.scene.add
        .text(TRACK_CENTER, y + 46, label, {
          fontFamily: FONT_DISPLAY,
          fontSize: '22px',
          color: '#e08b7a',
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

export default TrackRenderer;
