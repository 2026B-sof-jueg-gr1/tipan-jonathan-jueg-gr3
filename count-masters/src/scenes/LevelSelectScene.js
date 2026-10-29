/**
 * LevelSelectScene: muestra los niveles, su estado de desbloqueo y el acceso a
 * los que están disponibles. Los bloqueados no se pueden iniciar.
 */

import Phaser from 'phaser';
import { COLORS, DEPTHS } from '../config/gameConfig.js';
import { LEVELS, LEVEL_COUNT } from '../data/levels.js';
import { UI, textStyle } from '../ui/UIComponents.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelect' });
  }

  create() {
    this.progress = this.registry.get('progressManager');
    this.audio = this.registry.get('audio');

    this.buildBackground();
    this.buildHeader();

    const startY = 356;
    const gap = 282;
    LEVELS.forEach((level, index) => {
      this.buildCard(level, startY + index * gap, index);
    });

    UI.button(this, {
      x: 360,
      y: 1190,
      width: 300,
      height: 72,
      label: 'VOLVER AL MENÚ',
      variant: 'secondary',
      fontSize: 22,
      onClick: () => {
        this.audio.click();
        this.scene.start('MainMenu');
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  buildBackground() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.background, 1);
    g.fillRect(0, 0, 720, 1280);
    for (let i = 0; i < 12; i += 1) {
      g.fillStyle(i % 2 === 0 ? 0x0e1428 : 0x121935, 1);
      g.fillRect(0, i * 107, 720, 107);
    }
    g.fillStyle(COLORS.accent, 0.08);
    g.fillCircle(360, 120, 240);
  }

  buildHeader() {
    UI.button(this, {
      x: 108,
      y: 70,
      width: 168,
      height: 56,
      label: '‹ MENÚ',
      variant: 'ghost',
      fontSize: 20,
      onClick: () => {
        this.audio.click();
        this.scene.start('MainMenu');
      },
    });

    UI.panel(this, {
      x: 623,
      y: 70,
      width: 166,
      height: 56,
      radius: 28,
      fill: COLORS.panel,
      fillAlpha: 0.9,
      depth: 5,
    });
    this.add.image(566, 70, 'coin').setScale(0.8).setDepth(6);
    this.add
      .text(590, 70, String(this.progress.getCoins()), textStyle({ size: 27 }))
      .setOrigin(0, 0.5)
      .setDepth(6);

    this.add
      .text(360, 168, 'SELECCIONA NIVEL', textStyle({ size: 40, shadow: true }))
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(
        360,
        216,
        `${this.progress.get().completedLevels.length} de ${LEVEL_COUNT} completados`,
        textStyle({ size: 19, color: COLORS.textMutedHex, bold: false }),
      )
      .setOrigin(0.5)
      .setDepth(5);
  }

  buildCard(level, y, index) {
    const state = this.progress.get();
    const unlocked = this.progress.isLevelUnlocked(level.id);
    const completed = state.completedLevels.includes(level.id);
    const best = state.bestResults?.[level.id];

    const container = this.add.container(0, 0).setDepth(5);

    const panel = UI.panel(this, {
      x: 360,
      y,
      width: 620,
      height: 250,
      radius: 30,
      fill: unlocked ? COLORS.panel : 0x0b1020,
      fillAlpha: 0.96,
      stroke: completed ? COLORS.gain : unlocked ? COLORS.panelStroke : 0x232a44,
      depth: 5,
    });
    container.add(panel);

    // Insignia del número de nivel.
    const badge = this.add.graphics();
    badge.fillStyle(unlocked ? (completed ? COLORS.gain : COLORS.accent) : 0x232a44, 1);
    badge.fillCircle(102, y, 40);
    badge.lineStyle(3, 0xffffff, 0.25);
    badge.strokeCircle(102, y, 40);
    container.add(badge);

    container.add(
      this.add
        .text(102, y, String(level.id), textStyle({ size: 40 }))
        .setOrigin(0.5),
    );

    container.add(
      this.add
        .text(164, y - 72, level.name, textStyle({ size: 30 }))
        .setOrigin(0, 0.5),
    );

    container.add(
      this.add
        .text(164, y - 38, level.subtitle, textStyle({ size: 18, color: '#8fa3c8', bold: false }))
        .setOrigin(0, 0.5),
    );

    const description = this.add
      .text(164, y - 8, level.description, {
        ...textStyle({ size: 17, color: COLORS.textMutedHex, bold: false }),
        wordWrap: { width: 420 },
        lineSpacing: 5,
      })
      .setOrigin(0, 0);
    container.add(description);

    const footer = completed
      ? `COMPLETADO · mejor: ${best?.survivors ?? 0} supervivientes`
      : `Recompensa: ${level.reward} monedas · ${level.enemies.length} combate(s)`;
    container.add(
      this.add
        .text(164, y + 96, footer, {
          ...textStyle({
            size: 16,
            color: completed ? '#7cf5d2' : '#8fa3c8',
            bold: true,
          }),
        })
        .setOrigin(0, 0.5),
    );

    if (unlocked) {
      const hit = this.add
        .rectangle(360, y, 620, 250, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => panel.setAlpha(1));
      hit.on('pointerout', () => panel.setAlpha(0.96));
      hit.on('pointerup', () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('Game', { levelId: level.id });
      });
      container.add(hit);

      container.add(
        this.add
          .text(640, y, '▶', textStyle({ size: 26, color: '#7cf5d2' }))
          .setOrigin(0.5)
          .setAlpha(0.9),
      );
    } else {
      // Velo de bloqueo: se explica el motivo sin depender solo del color.
      const veil = this.add.rectangle(360, y, 620, 250, 0x05070f, 0.55);
      container.add(veil);

      container.add(
        this.add
          .text(360, y - 14, 'BLOQUEADO', textStyle({ size: 30, color: '#ff9a8f' }))
          .setOrigin(0.5),
      );

      container.add(
        this.add
          .text(
            360,
            y + 26,
            `Completa el nivel ${level.id - 1} para desbloquearlo`,
            textStyle({ size: 17, color: COLORS.textMutedHex, bold: false }),
          )
          .setOrigin(0.5),
      );
    }

    return container;
  }

  cleanup() {
    // Los objetos de la escena se destruyen en el apagado; no hay temporizadores
    // propios que limpiar en esta escena.
  }
}
