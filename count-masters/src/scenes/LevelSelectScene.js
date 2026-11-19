/**
 * LevelSelectScene: muestra los niveles, su estado de desbloqueo y el acceso a
 * los que están disponibles. Los bloqueados no se pueden iniciar.
 *
 * Estilo: tres estelas de piedra con sello de bronce, sobre el mismo terreno
 * cálido del juego.
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

    const startY = 384;
    const gap = 300;
    LEVELS.forEach((level, index) => {
      this.buildCard(level, startY + index * gap, index);
    });

    UI.button(this, {
      x: 360,
      y: 1192,
      width: 300,
      height: 68,
      label: 'Volver al menú',
      variant: 'secondary',
      fontSize: 20,
      onClick: () => {
        this.audio.click();
        this.scene.start('MainMenu');
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  buildBackground() {
    const terrain = this.add.tileSprite(0, 0, 720, 1280, 'tile_terrain').setOrigin(0, 0).setDepth(0);
    terrain.setTint(0x8a7560);

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(COLORS.overlay, 0.66);
    g.fillRect(0, 0, 720, 1280);
    g.fillStyle(COLORS.accent, 0.08);
    g.fillCircle(360, 130, 260);
  }

  buildHeader() {
    UI.button(this, {
      x: 106,
      y: 68,
      width: 168,
      height: 54,
      label: '‹ Menú',
      variant: 'ghost',
      fontSize: 18,
      onClick: () => {
        this.audio.click();
        this.scene.start('MainMenu');
      },
    });

    UI.chip(this, {
      x: 620,
      y: 68,
      width: 172,
      height: 54,
      text: String(this.progress.getCoins()),
      icon: 'coin',
      iconScale: 0.7,
      fontSize: 24,
      align: 'center',
      fill: COLORS.panel,
      stroke: COLORS.bronze,
      depth: 6,
    });

    this.add
      .text(360, 166, 'Selecciona nivel', textStyle({ size: 40, display: true, shadow: true }))
      .setOrigin(0.5)
      .setDepth(5);

    const rule = this.add.graphics().setDepth(5);
    rule.fillStyle(COLORS.bronze, 0.5);
    rule.fillRect(360 - 60, 202, 120, 2);

    this.add
      .text(
        360,
        232,
        `${this.progress.get().completedLevels.length} de ${LEVEL_COUNT} completados`,
        textStyle({ size: 18, color: COLORS.textMutedHex, bold: false }),
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
      height: 280,
      radius: 18,
      fill: unlocked ? COLORS.panel : 0x100b07,
      fillAlpha: 0.97,
      stroke: completed ? COLORS.gain : unlocked ? COLORS.bronze : 0x3b2a1b,
      depth: 5,
    });
    container.add(panel);

    // Sello de bronce con el número de nivel.
    const badge = this.add.graphics();
    const sealColor = completed ? COLORS.gain : unlocked ? COLORS.bronze : 0x4a3624;
    badge.fillStyle(0x000000, 0.4);
    badge.fillCircle(104, y + 4, 42);
    badge.fillStyle(0x1a1208, 1);
    badge.fillCircle(104, y, 42);
    badge.lineStyle(3, sealColor, 0.95);
    badge.strokeCircle(104, y, 42);
    badge.lineStyle(1, sealColor, 0.35);
    badge.strokeCircle(104, y, 34);
    container.add(badge);

    container.add(
      this.add
        .text(
          104,
          y,
          String(level.id),
          textStyle({ size: 38, color: completed ? '#35e0d0' : '#f2c879', display: true }),
        )
        .setOrigin(0.5),
    );

    container.add(
      this.add
        .text(168, y - 84, level.name, textStyle({ size: 29, display: true }))
        .setOrigin(0, 0.5),
    );

    container.add(
      this.add
        .text(168, y - 50, level.subtitle, textStyle({ size: 17, color: '#c98a3c', bold: false }))
        .setOrigin(0, 0.5),
    );

    const description = this.add
      .text(168, y - 26, level.description, {
        ...textStyle({ size: 16, color: COLORS.textMutedHex, bold: false }),
        wordWrap: { width: 410 },
        lineSpacing: 5,
      })
      .setOrigin(0, 0);
    container.add(description);

    const footer = completed
      ? `Completado · mejor: ${best?.survivors ?? 0} supervivientes`
      : `Recompensa: ${level.reward} monedas · ${level.enemies.length} combate(s) · ${level.hazards.length} obstáculos`;
    container.add(
      this.add
        .text(168, y + 112, footer, {
          ...textStyle({
            size: 15,
            color: completed ? '#35e0d0' : '#a2937e',
            bold: false,
          }),
        })
        .setOrigin(0, 0.5),
    );

    if (unlocked) {
      const hit = this.add
        .rectangle(360, y, 620, 280, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => panel.setAlpha(1));
      hit.on('pointerout', () => panel.setAlpha(0.97));
      hit.on('pointerup', () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('Game', { levelId: level.id });
      });
      container.add(hit);

      container.add(
        this.add
          .text(640, y, '›', textStyle({ size: 40, color: '#c98a3c', display: true }))
          .setOrigin(0.5)
          .setAlpha(0.9),
      );
    } else {
      const veil = this.add.rectangle(360, y, 620, 280, COLORS.overlay, 0.62);
      container.add(veil);

      container.add(
        this.add
          .text(360, y - 14, 'Bloqueado', textStyle({ size: 30, color: '#e08b7a', display: true }))
          .setOrigin(0.5),
      );

      container.add(
        this.add
          .text(
            360,
            y + 28,
            `Completa el nivel ${level.id - 1} para desbloquearlo`,
            textStyle({ size: 16, color: COLORS.textMutedHex, bold: false }),
          )
          .setOrigin(0.5),
      );
    }

    return container;
  }

  cleanup() {
    // Los objetos de la escena se destruyen en el apagado.
  }
}
