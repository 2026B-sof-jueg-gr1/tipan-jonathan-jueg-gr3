/**
 * Fábrica de texturas procedurales.
 *
 * Todo el arte del juego se genera una única vez en BootScene con gráficos
 * vectoriales de Phaser (`Graphics.generateTexture`). No hay archivos de imagen
 * externos: el proyecto funciona sin red y sin problemas de CORS.
 */

import { COLORS } from '../config/gameConfig.js';

/** Crea un Graphics temporal, lo rasteriza y lo destruye. */
function bake(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;

  const g = scene.add.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

/** Cuerpo común de los personajes (cabeza, torso, brazos y piernas). */
function drawCharacter(g, { body, dark, light, skin, headband, scale = 1 }) {
  const s = (value) => value * scale;
  const width = s(30);
  const height = s(46);
  const cx = width / 2;

  // Sombra en los pies (aporta sensación de profundidad sin sprites extra).
  g.fillStyle(0x000000, 0.26);
  g.fillEllipse(cx, height - s(2), s(20), s(7));

  // Piernas.
  g.fillStyle(dark, 1);
  g.fillRoundedRect(cx - s(6), s(33), s(4.5), s(11), s(2));
  g.fillRoundedRect(cx + s(1.5), s(33), s(4.5), s(11), s(2));

  // Torso.
  g.fillStyle(body, 1);
  g.fillRoundedRect(cx - s(6.5), s(17), s(13), s(18), s(5));

  // Brazos.
  g.fillStyle(body, 1);
  g.fillRoundedRect(cx - s(10), s(19), s(4), s(11), s(2));
  g.fillRoundedRect(cx + s(6), s(19), s(4), s(11), s(2));

  // Hombreras.
  g.fillStyle(light, 0.9);
  g.fillCircle(cx - s(8), s(20), s(2.4));
  g.fillCircle(cx + s(8), s(20), s(2.4));

  // Cabeza.
  g.fillStyle(skin, 1);
  g.fillCircle(cx, s(11), s(7.4));

  // Cinta del equipo (identifica el bando sin depender solo del color del torso).
  g.fillStyle(headband, 1);
  g.fillRect(cx - s(7.2), s(7.4), s(14.4), s(4));

  // Ojos.
  g.fillStyle(0x1a1a26, 0.85);
  g.fillCircle(cx - s(2.6), s(12.4), s(1.1));
  g.fillCircle(cx + s(2.6), s(12.4), s(1.1));
}

export function createGameTextures(scene) {
  // ------------------------------------------------------------ aliados
  bake(scene, 'ally', 30, 46, (g) => {
    drawCharacter(g, {
      body: COLORS.ally,
      dark: COLORS.allyDark,
      light: COLORS.allyLight,
      skin: COLORS.skin,
      headband: 0x0d5f66,
    });
  });

  // ------------------------------------------------------------ enemigos
  bake(scene, 'enemy', 30, 46, (g) => {
    drawCharacter(g, {
      body: COLORS.enemy,
      dark: COLORS.enemyDark,
      light: COLORS.enemyLight,
      skin: COLORS.skin,
      headband: 0x7a1c16,
    });
  });

  // Enemigo de élite (jefe): misma silueta, armadura y hombreras más marcadas.
  bake(scene, 'enemy_boss', 34, 54, (g) => {
    drawCharacter(g, {
      body: 0x9b3bff,
      dark: 0x4b1680,
      light: 0xd7b3ff,
      skin: 0xe8c9ae,
      headband: 0x2c0a4d,
      scale: 1.13,
    });
    // Peto de armadura.
    g.fillStyle(0x2c0a4d, 1);
    g.fillRoundedRect(10, 22, 14, 13, 5);
    g.fillStyle(0xffc93c, 0.95);
    g.fillRect(16, 24, 2.5, 9);
    // Pinchos en los hombros.
    g.fillStyle(0xffc93c, 1);
    g.fillTriangle(6, 23, 10, 15, 13, 24);
    g.fillTriangle(28, 23, 24, 15, 21, 24);
  });

  // Rey enemigo (variante del jefe con corona y capa).
  bake(scene, 'king', 44, 62, (g) => {
    // Capa.
    g.fillStyle(0x5a0f2e, 1);
    g.fillTriangle(9, 24, 35, 24, 22, 60);

    drawCharacter(g, {
      body: 0xb04cff,
      dark: 0x3d0a63,
      light: 0xf0d7ff,
      skin: 0xffe0c2,
      headband: 0x2c0a4d,
      scale: 1.3,
    });

    // Corona de tres puntas sobre la cabeza.
    g.fillStyle(COLORS.gold, 1);
    g.fillTriangle(12, 9, 16, 0, 20, 9);
    g.fillTriangle(18, 9, 22, 0, 26, 9);
    g.fillTriangle(24, 9, 28, 0, 32, 9);
    g.fillRect(11, 8, 22, 4);
    g.fillStyle(0xfff2c4, 0.95);
    g.fillCircle(22, 11, 1.8);
  });

  // -------------------------------------------------------------- moneda
  bake(scene, 'coin', 34, 34, (g) => {
    g.fillStyle(COLORS.coinDark, 1);
    g.fillCircle(17, 17, 15);
    g.fillStyle(COLORS.coin, 1);
    g.fillCircle(17, 17, 13);
    g.fillStyle(0xfff0b8, 1);
    g.fillCircle(17, 17, 8.5);
    g.fillStyle(COLORS.coinDark, 1);
    g.fillRect(15.5, 9.5, 3, 15);
    g.fillCircle(17, 17, 2.2);
  });

  // -------------------------------------------------------------- sierra
  bake(scene, 'saw', 76, 76, (g) => {
    const cx = 38;
    const cy = 38;
    g.fillStyle(0x9aa6c2, 1);
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const tipX = cx + Math.cos(angle) * 37;
      const tipY = cy + Math.sin(angle) * 37;
      const leftAngle = angle - 0.18;
      const rightAngle = angle + 0.18;
      g.fillTriangle(
        cx + Math.cos(leftAngle) * 27,
        cy + Math.sin(leftAngle) * 27,
        cx + Math.cos(rightAngle) * 27,
        cy + Math.sin(rightAngle) * 27,
        tipX,
        tipY,
      );
    }
    g.fillStyle(0xcfd8ea, 1);
    g.fillCircle(cx, cy, 28);
    g.fillStyle(0x7f8ba8, 1);
    g.fillCircle(cx, cy, 21);
    g.fillStyle(0x2a3152, 1);
    g.fillCircle(cx, cy, 8);
    g.fillStyle(0xff8a3d, 0.9);
    g.fillCircle(cx, cy, 4);
  });

  // --------------------------------------------------------------- bloque
  bake(scene, 'block', 110, 110, (g) => {
    g.fillStyle(0x2b1a12, 1);
    g.fillRoundedRect(6, 14, 98, 92, 14);
    g.fillStyle(0x5a3a2a, 1);
    g.fillRoundedRect(10, 18, 90, 84, 12);

    // Franjas de peligro.
    g.fillStyle(COLORS.hazard, 0.85);
    for (let i = 0; i < 5; i += 1) {
      g.fillTriangle(10 + i * 22, 102, 24 + i * 22, 18, 34 + i * 22, 18);
    }

    g.fillStyle(0x2b1a12, 1);
    g.fillRoundedRect(14, 24, 82, 30, 8);
    g.lineStyle(4, COLORS.hazard, 1);
    g.strokeRoundedRect(10, 18, 90, 84, 12);

    // Pinchos superiores.
    g.fillStyle(0xd9e2f5, 1);
    g.fillTriangle(20, 16, 30, 0, 40, 16);
    g.fillTriangle(45, 16, 55, 0, 65, 16);
    g.fillTriangle(70, 16, 80, 0, 90, 16);
  });

  // ------------------------------------------------------- efectos y utils
  bake(scene, 'glow', 128, 128, (g) => {
    const cx = 64;
    const cy = 64;
    for (let i = 12; i >= 1; i -= 1) {
      g.fillStyle(0xffffff, 0.028 * i);
      g.fillCircle(cx, cy, (i / 12) * 62);
    }
  });

  bake(scene, 'spark', 12, 12, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 5);
  });

  bake(scene, 'pixel', 2, 2, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 2);
  });
}

export default createGameTextures;
