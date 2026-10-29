/**
 * Puertas matemáticas.
 *
 * `Gate` es un panel individual (izquierdo o derecho) y `GatePair` agrupa los
 * dos paneles de una misma línea de activación. Una pareja solo puede
 * resolverse una vez: `resolve()` marca `resolved` y devuelve la operación
 * elegida, de modo que GameScene nunca aplique las dos puertas.
 */

import { COLORS, DEPTHS, FONT_FAMILY, GAME_CONFIG, TRACK_CENTER } from '../config/gameConfig.js';
import { describeGate, gateOperationLabel } from '../gameplay/rules.js';

const GATE_STYLE = {
  add: { color: COLORS.gain, symbol: '▲' },
  sub: { color: COLORS.loss, symbol: '▼' },
  mul: { color: COLORS.multiply, symbol: '★' },
};

const PANEL_HEIGHT = GAME_CONFIG.gatePanelDepth;

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

    const container = this.scene.add.container(this.x, this.y).setDepth(DEPTHS.gate);

    const panel = this.scene.add.graphics();
    // Cuerpo translúcido.
    panel.fillStyle(style.color, 0.14);
    panel.fillRect(-width / 2, 0, width, height);
    // Marco.
    panel.lineStyle(3, style.color, 0.8);
    panel.strokeRect(-width / 2 + 2, 2, width - 4, height - 4);
    // Barra de activación (la línea que se cruza).
    panel.fillStyle(style.color, 1);
    panel.fillRect(-width / 2, -6, width, 12);
    // Postes laterales.
    panel.fillStyle(style.color, 0.9);
    panel.fillRect(-width / 2, 0, 6, height);
    panel.fillRect(width / 2 - 6, 0, 6, height);
    // Brillo superior.
    panel.fillStyle(0xffffff, 0.07);
    panel.fillRect(-width / 2 + 6, 6, width - 12, 30);

    // Tarjeta con la operación.
    const chipWidth = Math.min(width - 26, 214);
    const chipHeight = 112;
    const chipY = height * 0.52;
    const chip = this.scene.add.graphics();
    chip.fillStyle(0x05070f, 0.82);
    chip.fillRoundedRect(-chipWidth / 2, chipY - chipHeight / 2, chipWidth, chipHeight, 24);
    chip.lineStyle(3, style.color, 0.95);
    chip.strokeRoundedRect(-chipWidth / 2, chipY - chipHeight / 2, chipWidth, chipHeight, 24);

    const operationText = describeGate(this.operation);
    const opFontSize = operationText.length > 4 ? 48 : 60;
    const opLabel = this.scene.add
      .text(0, chipY - 12, operationText, {
        fontFamily: FONT_FAMILY,
        fontSize: `${opFontSize}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const kindLabel = this.scene.add
      .text(0, chipY + 42, `${style.symbol} ${gateOperationLabel(this.operation)}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#d7e2ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.85);

    this.flash = this.scene.add
      .rectangle(0, height / 2, width, height, 0xffffff, 0)
      .setOrigin(0.5, 0.5);

    container.add([panel, chip, opLabel, kindLabel, this.flash]);
    this.container = container;
    return this;
  }

  /** Marca visualmente la puerta elegida (o descartada). */
  markResolved(chosen) {
    this.resolved = true;
    if (!this.container) return;

    if (chosen) {
      this.flash.setAlpha(0.55);
      this.scene.tweens.add({
        targets: this.flash,
        alpha: 0,
        duration: 420,
        ease: 'Quad.easeOut',
      });
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0.5,
        duration: 340,
        delay: 140,
      });
    } else {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0.12,
        duration: 300,
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
