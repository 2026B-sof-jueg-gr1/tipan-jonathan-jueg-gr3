/**
 * Puertas matemáticas.
 *
 * `Gate` es un panel individual (izquierdo o derecho) y `GatePair` agrupa los
 * dos paneles de una misma línea de activación. Una pareja solo puede
 * resolverse una vez: `resolve()` marca `resolved` y devuelve la operación
 * elegida, de modo que GameScene nunca aplique las dos puertas.
 *
 * Estética: cada panel es un estandarte de campamento. Un travesaño de bronce
 * marca la línea de activación, el cuerpo es una tela translúcida y la
 * operación se muestra en una placa de bronce con tipografía de display.
 */

import {
  COLORS,
  DEPTHS,
  FONT_DISPLAY,
  FONT_FAMILY,
  GAME_CONFIG,
  TRACK_CENTER,
} from '../config/gameConfig.js';
import { describeGate, gateOperationLabel } from '../gameplay/rules.js';

const GATE_STYLE = {
  add: { color: COLORS.gain, deep: 0x1c3f38, symbol: '▲' },
  sub: { color: COLORS.loss, deep: 0x43201a, symbol: '▼' },
  mul: { color: COLORS.multiply, deep: 0x46300f, symbol: '★' },
};

const PANEL_HEIGHT = GAME_CONFIG.gatePanelDepth;

/**
 * Traza el contorno de un estandarte: rectángulo con cola de golondrina.
 * La muesca inferior es lo que hace que la tela se lea como tela y no como
 * un panel de interfaz.
 */
function bannerPath(g, x, y, w, h, notch) {
  const half = w / 2;
  g.beginPath();
  g.moveTo(x - half, y);
  g.lineTo(x + half, y);
  g.lineTo(x + half, y + h);
  g.lineTo(x, y + h - notch);
  g.lineTo(x - half, y + h);
  g.closePath();
}

export class Gate {
  constructor(scene, { id, x, width, y, op, value }) {
    this.scene = scene;
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.operation = { op, value };
    this.resolved = false;
    this.container = null;
    this.flash = null;
  }

  build() {
    const style = GATE_STYLE[this.operation.op] ?? GATE_STYLE.add;
    const width = this.width;
    const height = PANEL_HEIGHT;
    const half = width / 2;
    const clothTop = 10;
    const clothH = height - clothTop;
    const notch = 30;

    const container = this.scene.add.container(this.x, this.y).setDepth(DEPTHS.gate);

    const panel = this.scene.add.graphics();

    // ---- Sombra proyectada (da peso al estandarte sobre la calzada).
    panel.fillStyle(0x000000, 0.38);
    bannerPath(panel, 5, clothTop + 8, width, clothH, notch);
    panel.fillPath();

    // ---- Tela: color profundo de la operación, no negro.
    panel.fillStyle(style.deep, 1);
    bannerPath(panel, 0, clothTop, width, clothH, notch);
    panel.fillPath();

    // Base cálida encima, para que la tela no sea un plano de color puro.
    panel.fillStyle(0x1a1109, 0.55);
    bannerPath(panel, 0, clothTop, width, clothH, notch);
    panel.fillPath();

    // ---- Pliegues verticales: bandas alternas de luz y sombra.
    const folds = Math.max(4, Math.round(width / 26));
    const foldW = width / folds;
    for (let i = 0; i < folds; i += 1) {
      const fx = -half + i * foldW;
      if (i % 2 === 0) {
        panel.fillStyle(style.color, 0.09);
        panel.fillRect(fx, clothTop, foldW * 0.55, clothH - notch * 0.5);
      } else {
        panel.fillStyle(0x000000, 0.12);
        panel.fillRect(fx, clothTop, foldW * 0.45, clothH - notch * 0.5);
      }
    }

    // ---- Degradado: la tela se apaga hacia la cola.
    panel.fillStyle(0x000000, 0.3);
    panel.fillRect(-half, clothTop + clothH * 0.62, width, clothH * 0.38 - notch * 0.5);
    // Y se ilumina junto al travesaño.
    panel.fillStyle(0xffffff, 0.06);
    panel.fillRect(-half, clothTop, width, 26);

    // ---- Ribete de bronce en el borde inferior de la tela.
    panel.lineStyle(2, COLORS.bronze, 0.55);
    bannerPath(panel, 0, clothTop, width, clothH, notch);
    panel.strokePath();

    // ---- Travesaño: el eje que se cruza al pasar.
    panel.fillStyle(0x000000, 0.5);
    panel.fillRect(-half - 8, -6, width + 16, 18);
    panel.fillStyle(0x3a2a18, 1);
    panel.fillRect(-half - 8, -9, width + 16, 15);
    panel.fillStyle(COLORS.bronze, 1);
    panel.fillRect(-half - 8, -9, width + 16, 5);
    panel.fillStyle(0x7a4f22, 1);
    panel.fillRect(-half - 8, 1, width + 16, 5);
    // Brillo metálico del travesaño.
    panel.fillStyle(0xffe0a8, 0.35);
    panel.fillRect(-half - 4, -8, width + 8, 1.5);

    // ---- Remates del travesaño: bolas de bronce en los extremos.
    for (const ex of [-half - 10, half + 10]) {
      panel.fillStyle(0x1a1208, 1);
      panel.fillCircle(ex, 0, 9);
      panel.fillStyle(COLORS.bronze, 1);
      panel.fillCircle(ex, 0, 7);
      panel.fillStyle(0xffe0a8, 0.55);
      panel.fillCircle(ex - 2, -2, 3);
    }

    // ---- Anillas y borlas en la cola.
    for (const ex of [-half + 14, half - 14]) {
      panel.fillStyle(COLORS.bronze, 0.85);
      panel.fillCircle(ex, clothTop + clothH - notch * 0.55, 3);
      panel.fillStyle(style.color, 0.9);
      panel.fillRect(ex - 2, clothTop + clothH - notch * 0.55, 4, 12);
    }

    // Placa de la operación.
    const chipWidth = Math.min(width - 30, 208);
    const chipHeight = 118;
    const chipY = height * 0.54;
    const chip = this.scene.add.graphics();

    chip.fillStyle(0x000000, 0.4);
    chip.fillRoundedRect(-chipWidth / 2 + 4, chipY - chipHeight / 2 + 5, chipWidth, chipHeight, 10);
    chip.fillStyle(0x140e08, 0.94);
    chip.fillRoundedRect(-chipWidth / 2, chipY - chipHeight / 2, chipWidth, chipHeight, 10);
    // Luz superior de la placa en bandas decrecientes. Un único rectángulo al
    // 42 % dejaba un escalón horizontal visible justo encima de la cifra.
    for (let i = 0; i < 5; i += 1) {
      chip.fillStyle(0x2a1c10, 0.16);
      chip.fillRoundedRect(
        -chipWidth / 2 + 2,
        chipY - chipHeight / 2 + 2 + i * 7,
        chipWidth - 4,
        chipHeight * 0.44 - i * 9,
        9,
      );
    }
    // Filetes.
    chip.lineStyle(2, COLORS.bronze, 0.95);
    chip.strokeRoundedRect(-chipWidth / 2, chipY - chipHeight / 2, chipWidth, chipHeight, 10);
    chip.lineStyle(1, style.color, 0.55);
    chip.strokeRoundedRect(
      -chipWidth / 2 + 5,
      chipY - chipHeight / 2 + 5,
      chipWidth - 10,
      chipHeight - 10,
      8,
    );

    // Tachuelas en las esquinas de la placa.
    const rivets = [
      [-chipWidth / 2 + 9, chipY - chipHeight / 2 + 9],
      [chipWidth / 2 - 9, chipY - chipHeight / 2 + 9],
      [-chipWidth / 2 + 9, chipY + chipHeight / 2 - 9],
      [chipWidth / 2 - 9, chipY + chipHeight / 2 - 9],
    ];
    for (const [rx, ry] of rivets) {
      chip.fillStyle(COLORS.gold, 0.85);
      chip.fillCircle(rx, ry, 2.6);
      chip.fillStyle(0x0b0806, 0.5);
      chip.fillCircle(rx, ry + 0.8, 1.1);
    }

    const operationText = describeGate(this.operation);
    const opFontSize = operationText.length > 4 ? 46 : 58;
    const opLabel = this.scene.add
      .text(0, chipY - 13, operationText, {
        fontFamily: FONT_DISPLAY,
        fontSize: `${opFontSize}px`,
        color: '#f7edd8',
      })
      .setOrigin(0.5);
    opLabel.setShadow(0, 3, '#000000', 6, false, true);

    // Separador fino entre cifra y tipo de operación.
    const rule = this.scene.add.graphics();
    rule.lineStyle(1, COLORS.bronze, 0.45);
    rule.lineBetween(-chipWidth * 0.3, chipY + 20, chipWidth * 0.3, chipY + 20);

    const kindLabel = this.scene.add
      .text(0, chipY + 36, `${style.symbol}  ${gateOperationLabel(this.operation).toUpperCase()}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#c98a3c',
      })
      .setOrigin(0.5);
    kindLabel.setLetterSpacing(1.6);

    this.flash = this.scene.add
      .rectangle(0, height / 2, width, height, style.color, 0)
      .setOrigin(0.5, 0.5);

    container.add([panel, chip, opLabel, rule, kindLabel, this.flash]);
    this.container = container;
    return this;
  }

  /** Marca visualmente la puerta elegida (o descartada). */
  markResolved(chosen) {
    this.resolved = true;
    if (!this.container) return;

    if (chosen) {
      this.flash.setAlpha(0.5);
      this.scene.tweens.add({
        targets: this.flash,
        alpha: 0,
        duration: 460,
        ease: 'Quad.easeOut',
      });
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0.55,
        duration: 360,
        delay: 160,
      });
    } else {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0.1,
        duration: 320,
      });
    }
  }

  destroy() {
    this.container?.destroy(true);
    this.container = null;
    this.flash = null;
  }
}

export class GatePair {
  constructor(scene, config) {
    this.scene = scene;
    this.id = config.id;
    this.y = config.y;
    this.resolved = false;

    const leftWidth = TRACK_CENTER - GAME_CONFIG.trackLeft - 12;
    const rightWidth = GAME_CONFIG.trackRight - TRACK_CENTER - 12;

    this.left = new Gate(scene, {
      id: `${config.id}-L`,
      x: (GAME_CONFIG.trackLeft + TRACK_CENTER) / 2,
      width: leftWidth,
      y: config.y,
      op: config.left.op,
      value: config.left.value,
    });

    this.right = new Gate(scene, {
      id: `${config.id}-R`,
      x: (TRACK_CENTER + GAME_CONFIG.trackRight) / 2,
      width: rightWidth,
      y: config.y,
      op: config.right.op,
      value: config.right.value,
    });

    this.left.build();
    this.right.build();
  }

  /**
   * Detección robusta de cruce: compara la Y anterior con la actual, de modo
   * que un salto grande entre fotogramas no se salta la línea de activación.
   */
  isCrossed(previousY, currentY) {
    return !this.resolved && previousY > this.y && currentY <= this.y;
  }

  /** Resuelve la pareja según la X del grupo. Devuelve la operación elegida. */
  resolve(playerX) {
    if (this.resolved) return null;
    this.resolved = true;

    const chooseLeft = playerX < TRACK_CENTER;
    const chosen = chooseLeft ? this.left : this.right;
    const discarded = chooseLeft ? this.right : this.left;

    chosen.markResolved(true);
    discarded.markResolved(false);

    return {
      side: chooseLeft ? 'left' : 'right',
      op: chosen.operation.op,
      value: chosen.operation.value,
      gate: chosen,
    };
  }

  destroy() {
    this.left.destroy();
    this.right.destroy();
  }
}
