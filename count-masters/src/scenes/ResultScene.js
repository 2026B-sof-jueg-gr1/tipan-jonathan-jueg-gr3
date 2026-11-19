/**
 * ResultScene: pantalla de victoria o derrota.
 *
 * No concede recompensas: solo muestra los datos que GameScene ya consolidó.
 * Así, volver a crear esta escena (o pulsar dos veces un botón) nunca duplica
 * monedas.
 *
 * Estilo: una estela de piedra. Marco de bronce, cifras en serifa y filetes de
 * 1 px entre filas, en lugar de la tarjeta azul con botón morado.
 */

import Phaser from 'phaser';
import { COLORS, DEPTHS, FONT_DISPLAY } from '../config/gameConfig.js';
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
    const terrain = this.add
      .tileSprite(0, 0, 720, 1280, 'tile_terrain')
      .setOrigin(0, 0)
      .setDepth(0);
    terrain.setTint(won ? 0xa89078 : 0x6a5a4c);

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(COLORS.overlay, won ? 0.55 : 0.72);
    g.fillRect(0, 0, 720, 1280);

    // Halo central, con la textura de degradado en vez de círculos planos.
    this.add
      .image(360, 300, 'glow')
      .setTint(won ? COLORS.gold : COLORS.loss)
      .setScale(5)
      .setAlpha(won ? 0.5 : 0.4)
      .setDepth(1);

    if (won) {
      for (let i = 0; i < 16; i += 1) {
        const x = 52 + i * 41;
        const y = 1250 + (i % 3) * 14;
        const sprite = this.add
          .image(x, y, 'ally')
          .setOrigin(0.5, 1)
          .setDepth(2)
          .setScale(0.62 + (i % 3) * 0.07);
        this.tweens.add({
          targets: sprite,
          y: y - 14,
          duration: 380 + (i % 5) * 40,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  buildHeader(won) {
    const { levelId, levelName } = this.result;
    const accent = won ? '#f2c879' : '#e08b7a';

    // Ceja: número y nombre del nivel.
    this.add
      .text(360, 108, `NIVEL ${String(levelId).padStart(2, '0')} · ${levelName.toUpperCase()}`, {
        ...textStyle({ size: 15, color: COLORS.textMutedHex, display: false, letterSpacing: 3 }),
        fontStyle: 'normal',
      })
      .setOrigin(0.5)
      .setDepth(5);

    // Título en serifa.
    this.add
      .text(360, 176, won ? 'Nivel completado' : 'Derrota', textStyle({ size: 52, color: accent, display: true, shadow: true }))
      .setOrigin(0.5)
      .setDepth(5);

    // Filete de bronce bajo el título.
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(COLORS.bronze, 0.55);
    g.fillRect(360 - 70, 218, 140, 2);

    if (!won) {
      const reason = this.result.reason ?? 'La multitud no logró superar el nivel.';
      UI.panel(this, {
        x: 360,
        y: 300,
        width: 600,
        height: 104,
        radius: 16,
        fill: 0x2a1410,
        stroke: 0x8e4a3a,
        depth: 5,
      });

      this.add
        .text(360, 300, reason, {
          ...textStyle({ size: 19, color: '#e8b6a6', bold: false, lineSpacing: 6 }),
          wordWrap: { width: 520 },
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(6);
    } else {
      this.add
        .text(
          360,
          268,
          'Tu multitud sobrevivió y conquistó el recorrido.',
          textStyle({ size: 19, color: COLORS.textMutedHex, bold: false }),
        )
        .setOrigin(0.5)
        .setDepth(5);
    }
  }

  buildStats() {
    const { won, survivors, coinsCollected, reward, totalCoins } = this.result;

    const rows = [];
    rows.push({ label: 'Población superviviente', value: String(survivors), color: '#35e0d0' });
    rows.push({
      label: won ? 'Monedas recogidas' : 'Monedas recogidas (perdidas)',
      value: `+${coinsCollected}`,
      color: won ? '#f2c879' : '#7d6f5d',
    });

    if (won && reward) {
      rows.push({ label: 'Bonus del nivel', value: `+${reward.levelBonus}`, color: '#f2c879' });
      rows.push({
        label: 'Bonus por supervivientes',
        value: `+${reward.survivorBonus}`,
        color: '#f2c879',
      });
      rows.push({ label: 'Recompensa total', value: `+${reward.total}`, color: '#35e0d0', strong: true });
      rows.push({ label: 'Monedas acumuladas', value: String(totalCoins), color: '#efe4d2' });
    } else {
      rows.push({ label: 'Monedas acumuladas', value: String(totalCoins), color: '#efe4d2' });
      rows.push({ label: 'Recompensa de nivel', value: '0', color: '#7d6f5d' });
    }

    const rowGap = 60;
    const panelHeight = 64 + rows.length * rowGap;
    const panelY = won ? 620 : 640;

    UI.panel(this, {
      x: 360,
      y: panelY,
      width: 600,
      height: panelHeight,
      radius: 18,
      fill: COLORS.panel,
      depth: 5,
    });

    const startY = panelY - panelHeight / 2 + 52;

    rows.forEach((row, index) => {
      const y = startY + index * rowGap;

      this.add
        .text(
          100,
          y,
          row.label,
          textStyle({
            size: row.strong ? 21 : 19,
            color: row.strong ? '#efe4d2' : '#a2937e',
            bold: row.strong,
            display: false,
          }),
        )
        .setOrigin(0, 0.5)
        .setDepth(6);

      this.add
        .text(
          620,
          y,
          row.value,
          textStyle({ size: row.strong ? 32 : 24, color: row.color, display: true }),
        )
        .setOrigin(1, 0.5)
        .setDepth(6);

      if (index < rows.length - 1) {
        const line = this.add.graphics().setDepth(6);
        line.fillStyle(COLORS.panelStroke, 0.85);
        line.fillRect(100, y + rowGap / 2, 520, 1);
      }
    });
  }

  buildButtons() {
    const { won, nextLevelId, levelId } = this.result;

    if (won && nextLevelId) {
      UI.button(this, {
        x: 360,
        y: 928,
        width: 420,
        height: 92,
        label: 'Siguiente nivel',
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
        y: 1030,
        width: 420,
        height: 72,
        label: 'Repetir nivel',
        variant: 'secondary',
        fontSize: 21,
        onClick: () => {
          this.audio?.click();
          this.scene.start('Game', { levelId });
        },
      });

      UI.button(this, {
        x: 360,
        y: 1122,
        width: 420,
        height: 62,
        label: 'Volver al menú',
        variant: 'ghost',
        fontSize: 19,
        onClick: () => this.goToMenu(),
      });
      return;
    }

    UI.button(this, {
      x: 360,
      y: won ? 948 : 968,
      width: 420,
      height: 96,
      label: won ? 'Repetir nivel' : 'Reintentar',
      variant: 'primary',
      fontSize: 28,
      onClick: () => {
        this.audio?.click();
        this.scene.start('Game', { levelId });
      },
    });

    UI.button(this, {
      x: 360,
      y: won ? 1056 : 1076,
      width: 420,
      height: 76,
      label: 'Volver al menú',
      variant: 'secondary',
      fontSize: 21,
      onClick: () => this.goToMenu(),
    });
  }

  goToMenu() {
    this.audio?.click();
    this.scene.start('MainMenu');
  }
}
