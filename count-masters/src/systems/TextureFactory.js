/**
 * Fábrica de texturas procedurales.
 *
 * Todo el arte del juego se genera una única vez en BootScene con gráficos
 * vectoriales de Phaser (`Graphics.generateTexture`). No hay archivos de imagen
 * externos: el proyecto funciona sin red y sin problemas de CORS.
 *
 * Dirección de arte: la misma que la landing page. Piedra, bronce y pergamino.
 * Cada figura se dibuja dos veces —primero una silueta oscura 1,5 px más
 * grande y después el relleno— para que tenga contorno propio. A 30×46 px el
 * contorno es lo que separa a un soldado del suelo; sin él, la multitud se lee
 * como una mancha de color.
 */

import { COLORS, COHORTS } from '../config/gameConfig.js';

/** Crea un Graphics temporal, lo rasteriza y lo destruye. */
function bake(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;

  const g = scene.add.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

/** Color del contorno: casi negro, pero cálido, nunca gris azulado. */
const INK = 0x120c08;

/**
 * Dibuja una pieza dos veces: contorno expandido y relleno real.
 * `fn(colors, expand)` debe usar `colors.*` para todos los colores.
 */
const OUTLINE_PALETTE = Object.freeze({
  outline: INK,
  body: INK,
  dark: INK,
  light: INK,
  skin: INK,
  trim: INK,
  metal: INK,
  wood: INK,
  blade: INK,
});

function part(g, palette, fn) {
  fn(OUTLINE_PALETTE, 1.9);
  fn(palette, 0);
}

/**
 * Cuerpo común de los personajes.
 *
 * El equipo define la SILUETA, que es lo que de verdad se distingue a 30×46 px:
 * casco, arma, escudo y capa. El color solo refuerza la lectura y nunca es la
 * única señal (accesibilidad para daltonismo).
 */
function drawCharacter(g, spec) {
  const {
    body,
    dark,
    light,
    skin,
    headband,
    scale = 1,
    helmet = 'cap',
    weapon = 'spear',
    shield = false,
    cape = null,
    plume = null,
  } = spec;

  const s = (v) => v * scale;
  const W = s(30);
  const H = s(46);
  const cx = W / 2;

  const palette = {
    outline: INK,
    body,
    dark,
    light,
    skin,
    trim: headband,
    metal: 0xb9a887,
    wood: 0x6b4a2f,
    blade: 0xd9d2c0,
  };

  // Sombra en los pies: ancla la figura al suelo sin sprites extra.
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx, H - s(2), s(20), s(7));

  // Capa (detrás de todo).
  if (cape !== null) {
    part(g, { ...palette, body: cape, dark: cape, light: cape }, (c, e) => {
      g.fillStyle(c.body, 1);
      g.fillTriangle(cx - s(9) - e, s(19), cx + s(9) + e, s(19), cx, s(44) + e);
    });
    g.fillStyle(0x000000, 0.22);
    g.fillTriangle(cx, s(19), cx + s(9), s(19), cx, s(44));
  }

  // Piernas.
  part(g, palette, (c, e) => {
    g.fillStyle(c.dark, 1);
    g.fillRoundedRect(cx - s(6.4) - e, s(32) - e, s(4.8) + e * 2, s(12) + e * 2, s(2));
    g.fillRoundedRect(cx + s(1.6) - e, s(32) - e, s(4.8) + e * 2, s(12) + e * 2, s(2));
  });

  // Torso: hombros más anchos que la cintura.
  part(g, palette, (c, e) => {
    g.fillStyle(c.body, 1);
    g.fillRoundedRect(cx - s(7.4) - e, s(15.5) - e, s(14.8) + e * 2, s(19) + e * 2, s(4));
    g.fillStyle(c.body, 1);
    g.fillRect(cx - s(5.6) - e, s(28) - e, s(11.2) + e * 2, s(7) + e * 2);
  });

  // Sombra lateral del torso (luz desde arriba a la izquierda).
  g.fillStyle(0x000000, 0.2);
  g.fillRoundedRect(cx + s(2), s(17), s(5), s(17), s(3));

  // Brazos.
  part(g, palette, (c, e) => {
    g.fillStyle(c.body, 1);
    g.fillRoundedRect(cx - s(10.6) - e, s(18) - e, s(4.2) + e * 2, s(12) + e * 2, s(2));
    g.fillRoundedRect(cx + s(6.4) - e, s(18) - e, s(4.2) + e * 2, s(12) + e * 2, s(2));
  });

  // Hombreras de bronce: la marca de "tropa equipada".
  g.fillStyle(0x000000, 0.18);
  g.fillCircle(cx - s(8), s(18.4), s(3));
  g.fillCircle(cx + s(8), s(18.4), s(3));
  g.fillStyle(light, 0.95);
  g.fillCircle(cx - s(8), s(18), s(2.6));
  g.fillCircle(cx + s(8), s(18), s(2.6));

  // Escudo redondo: la señal de silueta más potente a este tamaño.
  if (shield) {
    part(g, palette, (c, e) => {
      g.fillStyle(c.dark, 1);
      g.fillCircle(cx - s(8.6), s(27), s(6.6) + e);
    });
    g.fillStyle(light, 1);
    g.fillCircle(cx - s(8.6), s(27), s(5));
    g.fillStyle(dark, 1);
    g.fillCircle(cx - s(8.6), s(27), s(2));
    g.fillStyle(0xf2c879, 0.9);
    g.fillCircle(cx - s(8.6), s(27), s(0.9));
  }

  // Cabeza.
  part(g, palette, (c, e) => {
    g.fillStyle(c.skin, 1);
    g.fillCircle(cx, s(11), s(7.2) + e);
  });

  // Casco, o pelo descubierto (que también es una silueta reconocible).
  if (helmet === 'none') {
    part(g, palette, (c, e) => {
      g.fillStyle(c.trim, 1);
      g.fillRoundedRect(cx - s(7.4) - e, s(3) - e, s(14.8) + e * 2, s(5) + e * 2, s(2));
    });
    g.fillStyle(0x000000, 0.18);
    g.fillRect(cx - s(7.4), s(6.4), s(14.8), s(1.4));
  } else {
    part(g, palette, (c, e) => {
      g.fillStyle(c.metal, 1);
      g.fillCircle(cx, s(9), s(7.4) + e);
    });
    // Visera y carrilleras.
    g.fillStyle(0x000000, 0.24);
    g.fillRect(cx - s(8.4), s(7), s(16.8), s(2.6));
    g.fillStyle(0x8d7f63, 1);
    g.fillRect(cx - s(8.4), s(9.6), s(2.4), s(4.6));
    g.fillRect(cx + s(6), s(9.6), s(2.4), s(4.6));
    if (helmet === 'crest') {
      part(g, { ...palette, body: plume ?? light, dark: plume ?? light, light: plume ?? light }, (c, e) => {
        g.fillStyle(c.body, 1);
        g.fillRect(cx - s(1.9) - e, 0, s(3.8) + e * 2, s(7));
        g.fillCircle(cx, s(1.4), s(2.2) + e);
      });
    }
  }

  // Cinta del equipo (identifica el bando sin depender solo del color del torso).
  g.fillStyle(headband, 1);
  g.fillRect(cx - s(7.2), s(7.4), s(14.4), s(3.4));
  g.fillStyle(0x000000, 0.2);
  g.fillRect(cx - s(7.2), s(9.6), s(14.4), s(1.2));

  // Ojos.
  g.fillStyle(0x1a1208, 0.9);
  g.fillCircle(cx - s(2.6), s(12.9), s(1.05));
  g.fillCircle(cx + s(2.6), s(12.9), s(1.05));

  // Arma.
  if (weapon === 'spear') {
    part(g, palette, (c, e) => {
      g.fillStyle(c.wood, 1);
      g.fillRect(cx + s(9) - e, s(6), s(2.4) + e * 2, s(31));
    });
    part(g, palette, (c, e) => {
      g.fillStyle(c.blade, 1);
      g.fillTriangle(cx + s(7.6) - e, s(7.4), cx + s(12.8) + e, s(7.4), cx + s(10.2), -e);
    });
    g.fillStyle(0xf2c879, 0.85);
    g.fillRect(cx + s(8.6), s(8.4), s(3.2), s(1.2));
  } else if (weapon === 'axe') {
    part(g, palette, (c, e) => {
      g.fillStyle(c.wood, 1);
      g.fillRect(cx + s(9.2) - e, s(11), s(2.4) + e * 2, s(24));
    });
    part(g, palette, (c, e) => {
      g.fillStyle(c.blade, 1);
      g.fillTriangle(cx + s(7) - e, s(13), cx + s(13.6) + e, s(9), cx + s(13.6) + e, s(21));
    });
    g.fillStyle(0x000000, 0.22);
    g.fillTriangle(cx + s(11.4), s(12.4), cx + s(13.6), s(10.4), cx + s(13.6), s(19.4));
  }
}

/**
 * Hornea una cohorte aliada a partir de su definición en `COHORTS`.
 *
 * El horneado es a 1,4× (44×66 px) aunque la figura se dibuje en un espacio de
 * 30×46. A la escala de la pista, 30 px de ancho dejaban al soldado en menos de
 * 20 px en pantalla y la multitud se leía como una mancha de color; a 1,4× cada
 * casco, lanza y escudo se distinguen sin ampliar la textura al vuelo (que la
 * volvería borrosa).
 */
const CHAR_SCALE = 1.4;

function bakeCohort(scene, cohort) {
  bake(scene, cohort.texture, 44, 66, (g) => {
    drawCharacter(g, {
      body: cohort.body,
      dark: cohort.dark,
      light: cohort.light,
      skin: COLORS.skin,
      headband: cohort.headband,
      scale: CHAR_SCALE,
      helmet: cohort.helmet,
      weapon: cohort.weapon,
      shield: cohort.shield,
      cape: cohort.cape,
      plume: cohort.plume ?? null,
    });
  });
}

export function createGameTextures(scene) {
  // ------------------------------------------------- cohortes aliadas
  for (const cohort of Object.values(COHORTS)) bakeCohort(scene, cohort);

  // ------------------------------------------------------------ enemigos
  bake(scene, 'enemy', 44, 66, (g) => {
    drawCharacter(g, {
      body: COLORS.enemy,
      dark: COLORS.enemyDark,
      light: COLORS.enemyLight,
      skin: COLORS.skin,
      headband: 0x5c1509,
      scale: CHAR_SCALE,
      helmet: 'none',
      weapon: 'spear',
    });
  });

  // Enemigo de élite: casco con cresta y peto oscuro.
  bake(scene, 'enemy_boss', 50, 76, (g) => {
    drawCharacter(g, {
      body: 0x8e2f4a,
      dark: 0x4a1226,
      light: 0xd98aa0,
      skin: 0xe0b992,
      headband: 0x2c0812,
      scale: CHAR_SCALE * 1.14,
      helmet: 'crest',
      weapon: 'spear',
      plume: 0xd9a441,
      shield: true,
    });
  });

  // Rey enemigo: corona, capa y lanza de mando.
  // Todo el bloque se dibuja con el factor K para que escale con el resto.
  bake(scene, 'king', 60, 94, (g) => {
    const K = CHAR_SCALE * 1.35;
    const k = (v) => v * K;
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(k(22), k(60), k(30), k(8));
    // Capa de armiño.
    g.fillStyle(0x5c1020, 1);
    g.fillTriangle(k(7), k(26), k(37), k(26), k(22), k(61));
    g.fillStyle(0x7d1a2e, 1);
    g.fillTriangle(k(12), k(26), k(32), k(26), k(22), k(56));

    drawCharacter(g, {
      body: 0x8e2f4a,
      dark: 0x3d0a17,
      light: 0xe0a6b4,
      skin: 0xf0c9a0,
      headband: 0x2c0812,
      scale: K,
      helmet: 'none',
      weapon: 'spear',
      plume: null,
    });

    // Corona de cinco puntas con rubí.
    g.fillStyle(0x8a5f1e, 1);
    g.fillRect(k(10), k(8), k(24), k(5));
    g.fillStyle(0xf2c879, 1);
    g.fillRect(k(11), k(7), k(22), k(4));
    [12, 17, 22, 27, 32].forEach((x, i) => {
      const h = i === 2 ? 9 : 6;
      g.fillStyle(0xf2c879, 1);
      g.fillTriangle(k(x - 3), k(7), k(x + 3), k(7), k(x), k(7 - h));
    });
    g.fillStyle(0xc4472f, 1);
    g.fillCircle(k(22), k(10.5), k(1.9));
  });

  // -------------------------------------------------------------- moneda
  bake(scene, 'coin', 34, 34, (g) => {
    g.fillStyle(INK, 1);
    g.fillCircle(17, 17, 15.6);
    g.fillStyle(COLORS.coinDark, 1);
    g.fillCircle(17, 17, 14.4);
    g.fillStyle(COLORS.coin, 1);
    g.fillCircle(17, 16.4, 13);
    g.fillStyle(0xffeec2, 1);
    g.fillCircle(13.4, 12.6, 4.6);
    // Rama de laurel grabada.
    g.fillStyle(COLORS.coinDark, 0.85);
    g.fillRect(16.2, 10, 1.8, 13);
    for (let i = 0; i < 3; i += 1) {
      const y = 11.5 + i * 3.6;
      g.fillEllipse(13.6, y, 3.6, 2);
      g.fillEllipse(20.4, y + 1.4, 3.6, 2);
    }
  });

  // ------------------------------------------------- hoja pendular (trampa)
  bake(scene, 'blade', 124, 124, (g) => {
    const cx = 62;
    const cy = 70;
    const rad = (deg) => (deg * Math.PI) / 180;

    // Cadena que cuelga del dintel. Se dibuja antes que la hoja para que los
    // eslabones queden por detrás.
    g.fillStyle(INK, 1);
    g.fillRect(cx - 4.5, 0, 9, 38);
    for (let y = 2; y < 38; y += 8) {
      g.fillStyle(0x8d7f63, 1);
      g.fillCircle(cx, y + 3, 4.2);
      g.fillStyle(0x4a4032, 1);
      g.fillCircle(cx, y + 3, 1.8);
    }

    // Media luna de bronce: dos arcos concéntricos dibujados como un solo
    // contorno, en lugar de un disco con un agujero encima. El radio creció de
    // 31 a 46 px porque a tamaño pequeño la silueta se leía como una luna y no
    // como una trampa.
    const crescent = (offset, outer, inner, color) => {
      g.fillStyle(color, 1);
      g.beginPath();
      g.arc(cx + offset, cy, outer, rad(-82), rad(82), false);
      g.arc(cx + offset - 15, cy, inner, rad(82), rad(-82), true);
      g.closePath();
      g.fillPath();
    };

    crescent(0, 47, 43, INK);
    crescent(0, 44, 40, 0x8a5f1e);
    crescent(-2, 41.5, 38, 0xd9a441);
    // Reflejo cálido en el vientre de la hoja.
    crescent(-4, 37, 35, 0xb9822f);

    // Filo exterior brillante: es lo que da la lectura de «arma afilada».
    g.lineStyle(3, 0xfff0cc, 0.92);
    g.beginPath();
    g.arc(cx, cy, 45, rad(-76), rad(76), false);
    g.strokePath();
    // Contrafilo en sombra.
    g.lineStyle(2, 0x5c3d12, 0.7);
    g.beginPath();
    g.arc(cx - 15, cy, 41, rad(-70), rad(70), false);
    g.strokePath();

    // Remache y contrapeso del eje.
    g.fillStyle(INK, 1);
    g.fillCircle(cx + 28, cy, 7);
    g.fillStyle(0xf2c879, 1);
    g.fillCircle(cx + 28, cy, 4.4);
    g.fillStyle(0xfff0cc, 0.8);
    g.fillCircle(cx + 26.5, cy - 1.5, 1.6);
  });

  // ------------------------------------------------------ peñasco (bloque)
  bake(scene, 'boulder', 116, 108, (g) => {
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(58, 100, 92, 18);
    // Roca principal.
    g.fillStyle(INK, 1);
    g.fillEllipse(58, 62, 100, 76);
    g.fillStyle(0x5a4f3c, 1);
    g.fillEllipse(58, 60, 94, 70);
    g.fillStyle(0x6d6150, 1);
    g.fillEllipse(52, 54, 78, 56);
    // Caras planas: dos planos para que no parezca una pelota.
    g.fillStyle(0x7f7261, 1);
    g.fillTriangle(30, 52, 56, 30, 62, 66);
    g.fillStyle(0x4a4032, 1);
    g.fillTriangle(62, 66, 88, 44, 86, 84);
    // Grietas.
    g.lineStyle(2, 0x2e261c, 0.85);
    g.beginPath();
    g.moveTo(44, 30);
    g.lineTo(50, 48);
    g.lineTo(42, 62);
    g.strokePath();
    g.beginPath();
    g.moveTo(70, 42);
    g.lineTo(74, 58);
    g.lineTo(68, 74);
    g.strokePath();
    // Esquirlas sueltas.
    g.fillStyle(0x5a4f3c, 1);
    g.fillTriangle(8, 96, 20, 88, 24, 100);
    g.fillTriangle(92, 94, 104, 90, 106, 102);
  });

  // ------------------------------------------------------------ decorado
  // Columna rota.
  bake(scene, 'column', 54, 132, (g) => {
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(27, 126, 44, 12);
    g.fillStyle(INK, 1);
    g.fillRect(11, 12, 32, 116);
    g.fillStyle(0x8d8271, 1);
    g.fillRect(13, 14, 28, 112);
    g.fillStyle(0xa89b86, 1);
    g.fillRect(15, 14, 10, 112);
    g.fillStyle(0x6d6150, 1);
    g.fillRect(33, 14, 8, 112);
    // Estrías.
    for (let x = 18; x < 40; x += 6) {
      g.fillStyle(0x000000, 0.14);
      g.fillRect(x, 20, 1.5, 104);
    }
    // Capitel y basa.
    g.fillStyle(0x9c907b, 1);
    g.fillRect(8, 6, 38, 12);
    g.fillRect(6, 118, 42, 10);
    g.fillStyle(0x6d6150, 1);
    g.fillRect(8, 16, 38, 3);
    g.fillRect(6, 118, 42, 3);
  });

  // Ánfora.
  bake(scene, 'amphora', 30, 44, (g) => {
    g.fillStyle(0x000000, 0.26);
    g.fillEllipse(15, 41, 22, 6);
    g.fillStyle(INK, 1);
    g.fillEllipse(15, 24, 24, 32);
    g.fillStyle(0x8c4a2a, 1);
    g.fillEllipse(15, 24, 21, 29);
    g.fillStyle(0xa85c34, 1);
    g.fillEllipse(12, 21, 9, 18);
    // Cuello y asas.
    g.fillStyle(0x8c4a2a, 1);
    g.fillRect(11, 4, 8, 10);
    g.fillStyle(0x000000, 0.35);
    g.fillRect(12, 5, 6, 3);
    g.lineStyle(2, 0x8c4a2a, 1);
    g.strokeCircle(8, 12, 5);
    g.strokeCircle(22, 12, 5);
    // Banda decorativa.
    g.fillStyle(0x2e1a10, 0.75);
    g.fillRect(6, 26, 18, 3);
  });

  // Ciprés (silueta vertical que da profundidad al desfiladero).
  bake(scene, 'cypress', 40, 110, (g) => {
    g.fillStyle(0x000000, 0.26);
    g.fillEllipse(20, 105, 26, 8);
    g.fillStyle(INK, 1);
    g.fillRect(17, 78, 6, 28);
    g.fillEllipse(20, 50, 34, 84);
    g.fillStyle(0x1f3a2a, 1);
    g.fillEllipse(20, 50, 30, 80);
    g.fillStyle(0x2c5038, 1);
    g.fillEllipse(16, 46, 16, 60);
    g.fillStyle(0x16291e, 1);
    g.fillEllipse(26, 56, 12, 52);
  });

  // Brasero con fuego.
  bake(scene, 'brazier', 44, 62, (g) => {
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(22, 58, 32, 8);
    // Pie.
    g.fillStyle(INK, 1);
    g.fillRect(19, 36, 6, 22);
    g.fillStyle(0x5a4f3c, 1);
    g.fillRect(20, 36, 4, 22);
    // Copa.
    g.fillStyle(INK, 1);
    g.fillTriangle(4, 22, 40, 22, 30, 40);
    g.fillStyle(0x8a5f1e, 1);
    g.fillTriangle(7, 24, 37, 24, 29, 38);
    g.fillStyle(0xd9a441, 1);
    g.fillRect(5, 20, 34, 5);
    // Llama.
    g.fillStyle(0xc4472f, 0.95);
    g.fillTriangle(22, 2, 32, 20, 12, 20);
    g.fillStyle(0xe08b3a, 1);
    g.fillTriangle(22, 7, 29, 20, 15, 20);
    g.fillStyle(0xf2c879, 1);
    g.fillTriangle(22, 12, 26, 20, 18, 20);
  });

  // Estandarte aliado (marca el territorio conquistado).
  bake(scene, 'banner', 40, 104, (g) => {
    g.fillStyle(0x000000, 0.26);
    g.fillEllipse(20, 100, 24, 6);
    g.fillStyle(INK, 1);
    g.fillRect(17, 4, 6, 94);
    g.fillStyle(0x6b4a2f, 1);
    g.fillRect(18, 4, 4, 94);
    g.fillStyle(0xf2c879, 1);
    g.fillCircle(20, 4, 4);
    // Tela.
    g.fillStyle(INK, 1);
    g.fillRect(19, 8, 20, 44);
    g.fillStyle(0x8c3a20, 1);
    g.fillRect(21, 10, 16, 40);
    g.fillStyle(0xb4552f, 1);
    g.fillRect(21, 10, 8, 40);
    g.fillStyle(0xf2c879, 0.85);
    g.fillCircle(29, 26, 4);
    g.fillStyle(0x8c3a20, 1);
    g.fillCircle(29, 26, 2);
    // Cola de golondrina.
    g.fillStyle(0x8c3a20, 1);
    g.fillTriangle(21, 50, 37, 50, 29, 60);
  });

  // Roca suelta del arcén.
  bake(scene, 'rock', 46, 34, (g) => {
    g.fillStyle(0x000000, 0.24);
    g.fillEllipse(23, 30, 34, 8);
    g.fillStyle(INK, 1);
    g.fillEllipse(23, 18, 40, 28);
    g.fillStyle(0x5a4f3c, 1);
    g.fillEllipse(23, 17, 36, 24);
    g.fillStyle(0x7f7261, 1);
    g.fillTriangle(10, 16, 22, 6, 26, 20);
    g.fillStyle(0x4a4032, 1);
    g.fillTriangle(26, 20, 36, 10, 38, 26);
  });

  // --------------------------------------------------------- baldosas base
  // La calzada y el terreno se dibujan con `TileSprite`: una sola textura que
  // se repite en lugar de miles de rectángulos recalculados por fotograma.
  //
  // Las baldosas miden 512 px para que el patrón no se lea como una cuadrícula.
  // Todo lo que se dibuja cerca de un borde se replica en el borde opuesto
  // (`wrap`), así que la repetición es invisible. Nada de celdas regulares: la
  // primera versión usaba una rejilla 8×8 y el suelo parecía una hoja de
  // cálculo en vez de un camino de tierra.

  const TILE = 512;

  /** PRNG determinista: el suelo es idéntico en cada partida. */
  const rand = (() => {
    let seed = 0x9e3779b9;
    return () => {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();

  /**
   * Dibuja en las nueve posiciones del mosaico cuando la figura toca un borde.
   * `fn(x, y)` recibe la coordenada ya desplazada.
   */
  const wrap = (x, y, r, fn) => {
    for (let ix = -1; ix <= 1; ix += 1) {
      for (let iy = -1; iy <= 1; iy += 1) {
        const px = x + ix * TILE;
        const py = y + iy * TILE;
        if (px < -r || px > TILE + r || py < -r || py > TILE + r) continue;
        fn(px, py);
      }
    }
  };

  // ------------------------------------------------------------- calzada

  bake(scene, 'tile_road', TILE, TILE, (g) => {
    // Tierra apisonada de base.
    g.fillStyle(0x3a2b1c, 1);
    g.fillRect(0, 0, TILE, TILE);

    // Manchas grandes: rompen la uniformidad sin dibujar aristas.
    const patches = [0x342619, 0x40301f, 0x372a1c, 0x442f1e, 0x2f2318];
    for (let i = 0; i < 46; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      const rx = 46 + rand() * 96;
      const ry = 34 + rand() * 78;
      const tone = patches[Math.floor(rand() * patches.length)];
      const alpha = 0.32 + rand() * 0.3;
      wrap(x, y, Math.max(rx, ry), (px, py) => {
        g.fillStyle(tone, alpha);
        g.fillEllipse(px, py, rx * 2, ry * 2);
      });
    }

    // Rodadas de carro: dos bandas verticales hundidas. Al ser continuas de
    // arriba abajo, el mosaico vertical no necesita nada especial.
    for (const cx of [TILE * 0.27, TILE * 0.73]) {
      g.fillStyle(0x241a11, 0.3);
      g.fillRect(cx - 30, 0, 60, TILE);
      g.fillStyle(0x241a11, 0.22);
      g.fillRect(cx - 18, 0, 36, TILE);
      // Borde levantado a los lados de la rodada.
      g.fillStyle(0x4e3a26, 0.16);
      g.fillRect(cx - 36, 0, 6, TILE);
      g.fillRect(cx + 30, 0, 6, TILE);
    }

    // Losas hundidas: piedras sueltas, irregulares y escasas. Se dibujan en
    // posición aleatoria (no en rejilla) para que el ojo no encuentre filas.
    for (let i = 0; i < 30; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      const w = 26 + rand() * 34;
      const h = 16 + rand() * 22;
      const rot = (rand() - 0.5) * 0.5;
      const tone = rand() < 0.5 ? 0x4a3724 : 0x533f29;
      const r = Math.max(w, h);
      wrap(x, y, r, (px, py) => {
        g.fillStyle(0x1a120a, 0.5);
        g.fillEllipse(px, py + 3, w + 6, h + 6);
        g.fillStyle(tone, 1);
        g.fillEllipse(px, py, w, h);
        // Cara iluminada arriba-izquierda.
        g.fillStyle(0x7a5c38, 0.32);
        g.fillEllipse(px - w * 0.1, py - h * 0.16, w * 0.72, h * 0.52);
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(px + w * 0.06, py + h * 0.2, w * 0.66, h * 0.34);
        if (rot > 0.1) {
          g.lineStyle(1, 0x241a11, 0.5);
          g.beginPath();
          g.moveTo(px - w * 0.24, py - h * 0.1);
          g.lineTo(px + w * 0.16, py + h * 0.12);
          g.strokePath();
        }
      });
    }

    // Gravilla: mucha, pequeña, sin contorno. Da textura de cerca.
    for (let i = 0; i < 420; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      const s = 1 + rand() * 2.4;
      const light = rand() < 0.55;
      wrap(x, y, s, (px, py) => {
        g.fillStyle(light ? 0x7a5c38 : 0x1d150d, light ? 0.12 : 0.28);
        g.fillCircle(px, py, s);
      });
    }

    // Semillas y briznas secas: dos o tres pinceladas cálidas.
    for (let i = 0; i < 26; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      wrap(x, y, 6, (px, py) => {
        g.lineStyle(1, 0x6b5330, 0.35);
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px + (rand() - 0.5) * 8, py - 4 - rand() * 4);
        g.strokePath();
      });
    }
  });

  // -------------------------------------------------------------- terreno

  bake(scene, 'tile_terrain', TILE, TILE, (g) => {
    g.fillStyle(0x1c130c, 1);
    g.fillRect(0, 0, TILE, TILE);

    // Manchas de roca.
    const patches = [0x241a12, 0x20160f, 0x2a1e14, 0x1a1109];
    for (let i = 0; i < 54; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      const rx = 40 + rand() * 110;
      const ry = 26 + rand() * 70;
      const tone = patches[Math.floor(rand() * patches.length)];
      wrap(x, y, Math.max(rx, ry), (px, py) => {
        g.fillStyle(tone, 0.4 + rand() * 0.3);
        g.fillEllipse(px, py, rx * 2, ry * 2);
      });
    }

    // Estratos ondulados. La onda usa un número entero de periodos por baldosa,
    // así que el borde izquierdo y el derecho coinciden exactamente.
    for (let i = 0; i < 11; i += 1) {
      const baseY = (i / 11) * TILE + rand() * 20;
      const amp = 4 + rand() * 7;
      const periods = 1 + Math.floor(rand() * 3);
      const phase = rand() * Math.PI * 2;
      const steps = 48;
      g.lineStyle(3, 0x000000, 0.2);
      g.beginPath();
      for (let k = 0; k <= steps; k += 1) {
        const x = (k / steps) * TILE;
        const y = baseY + Math.sin(phase + (k / steps) * Math.PI * 2 * periods) * amp;
        if (k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
      g.lineStyle(1, 0x9d8a68, 0.07);
      g.beginPath();
      for (let k = 0; k <= steps; k += 1) {
        const x = (k / steps) * TILE;
        const y =
          baseY - 2 + Math.sin(phase + (k / steps) * Math.PI * 2 * periods) * amp;
        if (k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }

    // Cantos rodados sueltos.
    for (let i = 0; i < 54; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      const w = 8 + rand() * 22;
      const h = w * (0.5 + rand() * 0.4);
      const tone = rand() < 0.5 ? 0x3d3327 : 0x4a4034;
      wrap(x, y, w, (px, py) => {
        g.fillStyle(0x0a0705, 0.55);
        g.fillEllipse(px, py + 2, w + 3, h + 3);
        g.fillStyle(tone, 1);
        g.fillEllipse(px, py, w, h);
        g.fillStyle(0x8d8271, 0.24);
        g.fillEllipse(px - w * 0.12, py - h * 0.2, w * 0.6, h * 0.45);
      });
    }

    // Matas de hierba seca: tres trazos por mata.
    for (let i = 0; i < 30; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      wrap(x, y, 10, (px, py) => {
        g.lineStyle(1.4, 0x6a5b34, 0.4);
        for (let b = 0; b < 3; b += 1) {
          g.beginPath();
          g.moveTo(px + (b - 1) * 2, py);
          g.lineTo(px + (b - 1) * 4 + (rand() - 0.5) * 4, py - 6 - rand() * 5);
          g.strokePath();
        }
      });
    }

    // Polvo: grano fino que evita el aspecto plano.
    for (let i = 0; i < 380; i += 1) {
      const x = rand() * TILE;
      const y = rand() * TILE;
      const s = 1 + rand() * 1.8;
      wrap(x, y, s, (px, py) => {
        g.fillStyle(rand() < 0.5 ? 0x8d7f63 : 0x000000, 0.07);
        g.fillCircle(px, py, s);
      });
    }
  });

  // ------------------------------------------------------- efectos y utils
  // Halo radial suave. Antes se construía con 12 anillos de alfa creciente
  // hacia el centro: el resultado era un disco de borde duro. Con 32 anillos de
  // alfa constante la suma acumulada produce una caída gradual y el borde
  // exterior queda prácticamente invisible.
  bake(scene, 'glow', 128, 128, (g) => {
    const cx = 64;
    const cy = 64;
    for (let i = 32; i >= 1; i -= 1) {
      g.fillStyle(0xffffff, 0.045);
      g.fillCircle(cx, cy, (i / 32) * 62);
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
