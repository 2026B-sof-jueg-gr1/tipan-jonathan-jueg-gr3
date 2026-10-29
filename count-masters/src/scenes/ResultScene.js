/**
 * ResultScene: pantalla de victoria o derrota.
 *
 * No concede recompensas: solo muestra los datos que GameScene ya consolidó.
 * Así, volver a crear esta escena (o pulsar dos veces un botón) nunca duplica
 * monedas.
 */

import Phaser from 'phaser';
import { COLORS, DEPTHS } from '../config/gameConfig.js';
import { UI, textStyle } from '../ui/UIComponents.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Result' });
  }

  init(data) {
    this.result = data ?? null;
  }

  create() {
    if (!this.result) {
      this.scene.start('MainMenu');
      return;
    }

    this.audio = this.registry.get('audio');
    const { won } = this.result;

    this.buildBackground(won);
    this.buildHeader(won);
    this.buildStats();
    this.buildButtons();
  }

  buildBackground(won) {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.background, 1);
    g.fillRect(0, 0, 720, 1280);

    for (let i = 0; i < 12; i += 1) {
      g.fillStyle(i % 2 === 0 ? 0x0e1428 : 0x121935, 1);
      g.fillRect(0, i * 107, 720, 107);
    }

    if (won) {
      g.fillStyle(COLORS.gain, 0.12);
      g.fillCircle(360, 240, 300);
      g.fillStyle(COLORS.gold, 0.08);
      g.fillCircle(360, 240, 190);

      for (let i = 0; i < 18; i += 1) {
        const x = 60 + i * 34;
        const y = 1180 + (i % 3) * 16;
        const sprite = this.add
          .image(x, y, 'ally')
          .setOrigin(0.5, 1)
          .setDepth(1)
          .setScale(0.8 + (i % 3) * 0.1);
        this.tweens.add({
          targets: sprite,
          y: y - 16,
          duration: 380 + (i % 5) * 40,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      g.fillStyle(COLORS.loss, 0.1);
      g.fillCircle(360, 240, 300);
      g.fillStyle(0x05070f, 0.35);
      g.fillRect(0, 0, 720, 1280);
    }
  }

  buildHeader(won) {
    const title = won ? '¡NIVEL COMPLETADO!' : 'DERROTA';
    const color = won ? '#7cf5d2' : '#ff9a8f';

    this.add
      .text(360, 180, title, textStyle({ size: 44, color, shadow: true }))
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(
        360,
        240,
        `Nivel ${this.result.levelId} · ${this.result.levelName}`,
        textStyle({ size: 22, color: COLORS.textMutedHex, bold: false }),
      )
      .setOrigin(0.5)
      .setDepth(5);

    if (!won) {
      const reason = this.result.reason ?? 'La multitud no logró superar el nivel.';
      UI.panel(this, {
        x: 360,
        y: 330,
        width: 600,
        height: 96,
        radius: 24,
        fill: 0x2a1016,
        fillAlpha: 0.95,
        stroke: 0x8a2a35,
        depth: 5,
      });

      this.add
        .text(360, 330, reason, {
          ...textStyle({ size: 20, color: '#ffc2b8', bold: false }),
          wordWrap: { width: 540 },
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(6);
    } else {
      this.add
        .text(
          360,
          318,
          'Tu multitud sobrevivió y conquistó el recorrido.',
          textStyle({ size: 20, color: COLORS.textMutedHex, bold: false }),
        )
        .setOrigin(0.5)
        .setDepth(5);
    }
  }

  buildStats() {
    const { won, survivors, coinsCollected, reward, totalCoins } = this.result;

    const panelY = won ? 640 : 660;
    const panelHeight = won ? 460 : 300;

    UI.panel(this, {
      x: 360,
      y: panelY,
      width: 600,
      height: panelHeight,
      radius: 30,
      fill: COLORS.panel,
      fillAlpha: 0.96,
      depth: 5,
    });

    const rows = [];
    rows.push({ label: 'Población superviviente', value: String(survivors), color: '#7cf5d2' });
    rows.push({
      label: won ? 'Monedas recogidas' : 'Monedas recogidas (perdidas)',
      value: `+${coinsCollected}`,
      color: won ? '#ffd166' : '#8fa3c8',
    });

    if (won && reward) {
      rows.push({ label: 'Bonus del nivel', value: `+${reward.levelBonus}`, color: '#ffd166' });
      rows.push({
        label: 'Bonus por supervivientes',
        value: `+${reward.survivorBonus}`,
        color: '#ffd166',
      });
      rows.push({ label: 'Recompensa total', value: `+${reward.total}`, color: '#7cf5d2', strong: true });
      rows.push({ label: 'Monedas acumuladas', value: String(totalCoins), color: '#ffffff' });
    } else {
      rows.push({ label: 'Monedas acumuladas', value: String(totalCoins), color: '#ffffff' });
      rows.push({ label: 'Recompensa de nivel', value: '0', color: '#8fa3c8' });
    }

    const startY = panelY - panelHeight / 2 + 62;
    const gap = 62;

    rows.forEach((row, index) => {
      const y = startY + index * gap;

      this.add
        .text(96, y, row.label, {
          ...textStyle({ size: row.strong ? 22 : 20, color: row.strong ? '#ffffff' : '#9fb0d0', bold: row.strong }),
        })
        .setOrigin(0, 0.5)
        .setDepth(6);

      this.add
        .text(624, y, row.value, {
          ...textStyle({ size: row.strong ? 30 : 24, color: row.color, bold: true }),
        })
        .setOrigin(1, 0.5)
        .setDepth(6);

      if (index < rows.length - 1) {
        const line = this.add.graphics().setDepth(6);
        line.fillStyle(0x2a3555, 0.8);
        line.fillRect(96, y + gap / 2, 528, 1);
      }
    });
  }

  buildButtons() {
    const { won, nextLevelId, levelId } = this.result;

    if (won && nextLevelId) {
      UI.button(this, {
        x: 360,
        y: 940,
        width: 420,
        height: 96,
        label: 'SIGUIENTE NIVEL',
        sublabel: `Nivel ${nextLevelId}`,
        variant: 'primary',
        fontSize: 28,
        onClick: () => {
          this.audio?.click();
          this.scene.start('Game', { levelId: nextLevelId });
        },
      });

      UI.button(this, {
        x: 360,
        y: 1052,
        width: 420,
        height: 76,
        label: 'REPETIR NIVEL',
        variant: 'secondary',
        fontSize: 22,
        onClick: () => {
          this.audio?.click();
          this.scene.start('Game', { levelId });
        },
      });

      UI.button(this, {
        x: 360,
        y: 1150,
        width: 420,
        height: 68,
        label: 'VOLVER AL MENÚ',
        variant: 'ghost',
        fontSize: 20,
        onClick: () => this.goToMenu(),
      });
      return;
    }

    UI.button(this, {
      x: 360,
      y: won ? 960 : 980,
      width: 420,
      height: 96,
      label: won ? 'REPETIR NIVEL' : 'REINTENTAR',
      variant: 'primary',
      fontSize: 28,
      onClick: () => {
        this.audio?.click();
        this.scene.start('Game', { levelId });
      },
    });

    UI.button(this, {
      x: 360,
      y: won ? 1076 : 1096,
      width: 420,
      height: 76,
      label: 'VOLVER AL MENÚ',
      variant: 'secondary',
      fontSize: 22,
      onClick: () => this.goToMenu(),
    });
  }

  goToMenu() {
    this.audio?.click();
    this.scene.start('MainMenu');
  }
}
