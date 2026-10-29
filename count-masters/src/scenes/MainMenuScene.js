/**
 * MainMenuScene: título, acceso a jugar, selección de nivel, mejoras, sonido y
 * reinicio del progreso (con confirmación previa).
 */

import Phaser from 'phaser';
import { COLORS, DEPTHS, FONT_FAMILY } from '../config/gameConfig.js';
import { LEVEL_COUNT } from '../data/levels.js';
import { UI, textStyle } from '../ui/UIComponents.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    this.progress = this.registry.get('progressManager');
    this.audio = this.registry.get('audio');
    this.modal = null;

    this.buildBackground();
    this.buildHeader();
    this.buildTitle();
    this.buildButtons();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  // ------------------------------------------------------------- escenario

  buildBackground() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.background, 1);
    g.fillRect(0, 0, 720, 1280);

    for (let i = 0; i < 10; i += 1) {
      g.fillStyle(i % 2 === 0 ? 0x0e1428 : 0x111731, 1);
      g.fillRect(0, i * 128, 720, 128);
    }

    // Halos detrás del título.
    g.fillStyle(COLORS.accent, 0.1);
    g.fillCircle(360, 280, 280);
    g.fillStyle(COLORS.gain, 0.07);
    g.fillCircle(360, 280, 190);
    g.fillStyle(COLORS.gold, 0.05);
    g.fillCircle(360, 280, 120);

    // Franja de pista con multitud al pie de la pantalla.
    g.fillStyle(0x232c47, 1);
    g.fillRect(0, 1150, 720, 130);
    g.fillStyle(COLORS.gain, 0.85);
    g.fillRect(0, 1150, 720, 5);
    for (let x = 16; x < 720; x += 92) {
      g.fillStyle(COLORS.roadLine, 0.8);
      g.fillRect(x, 1214, 52, 6);
    }

    const crowd = [];
    for (let i = 0; i < 16; i += 1) {
      const x = 34 + i * 42 + (i % 3) * 5;
      const y = 1206 + (i % 4) * 12;
      const sprite = this.add
        .image(x, y, 'ally')
        .setOrigin(0.5, 1)
        .setDepth(2)
        .setScale(0.85 + (i % 3) * 0.1);
      this.tweens.add({
        targets: sprite,
        y: y - 7,
        duration: 420 + (i % 5) * 45,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      crowd.push(sprite);
    }

    for (let i = 0; i < 4; i += 1) {
      const sprite = this.add
        .image(660 + i * 14, 1246 + (i % 2) * 8, 'enemy')
        .setOrigin(0.5, 1)
        .setDepth(2)
        .setScale(0.8)
        .setAlpha(0.85);
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 5,
        duration: 520 + i * 40,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Puertas decorativas que anticipan la mecánica principal.
    this.buildDecorativeGate(96, 1050, '+10', COLORS.gain);
    this.buildDecorativeGate(624, 1050, '×2', COLORS.multiply);
  }

  buildDecorativeGate(x, y, label, color) {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(color, 0.1);
    g.fillRoundedRect(x - 78, y - 54, 156, 108, 12);
    g.lineStyle(3, color, 0.5);
    g.strokeRoundedRect(x - 78, y - 54, 156, 108, 12);
    g.fillStyle(color, 0.7);
    g.fillRect(x - 78, y - 58, 156, 7);

    this.add
      .text(x, y, label, textStyle({ size: 44, color: '#ffffff' }))
      .setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0.55);
  }

  buildHeader() {
    const coins = this.progress.getCoins();
    const unlocked = this.progress.get().highestUnlockedLevel;

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
    this.coinText = this.add
      .text(590, 70, String(coins), textStyle({ size: 27 }))
      .setOrigin(0, 0.5)
      .setDepth(6);

    UI.chip(this, {
      x: 116,
      y: 70,
      width: 184,
      height: 56,
      text: `NIVEL ${unlocked}/${LEVEL_COUNT}`,
      fontSize: 21,
      align: 'center',
      depth: 6,
    });
  }

  buildTitle() {
    this.add
      .text(360, 226, 'CROWD', {
        ...textStyle({ size: 78, shadow: true }),
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(360, 300, 'CONQUEST', {
        ...textStyle({ size: 78, color: '#7cf5d2', shadow: true }),
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(5);

    const underline = this.add.graphics().setDepth(5);
    underline.fillStyle(COLORS.gold, 0.95);
    underline.fillRoundedRect(250, 346, 220, 5, 3);

    this.add
      .text(360, 382, 'GATE RUSH', {
        ...textStyle({ size: 34, color: '#ffc93c' }),
        letterSpacing: 10,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(
        360,
        446,
        'Elige la puerta correcta, multiplica tu multitud\ny conquista el castillo del rey.',
        {
          ...textStyle({ size: 20, color: COLORS.textMutedHex, bold: false }),
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
  }

  buildButtons() {
    const highestUnlocked = Math.min(
      this.progress.get().highestUnlockedLevel,
      LEVEL_COUNT,
    );

    this.playButton = UI.button(this, {
      x: 360,
      y: 566,
      width: 400,
      height: 104,
      label: 'JUGAR',
      sublabel: `Continuar en el nivel ${highestUnlocked}`,
      variant: 'primary',
      fontSize: 38,
      onClick: () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('Game', { levelId: highestUnlocked });
      },
    });

    UI.button(this, {
      x: 360,
      y: 692,
      width: 400,
      height: 92,
      label: 'SELECCIONAR NIVEL',
      variant: 'secondary',
      fontSize: 27,
      onClick: () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('LevelSelect');
      },
    });

    UI.button(this, {
      x: 360,
      y: 802,
      width: 400,
      height: 92,
      label: 'MEJORAS',
      variant: 'secondary',
      fontSize: 27,
      onClick: () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('Upgrade');
      },
    });

    this.soundButton = UI.button(this, {
      x: 360,
      y: 912,
      width: 400,
      height: 88,
      label: this.soundLabel(),
      variant: 'ghost',
      fontSize: 24,
      onClick: () => this.toggleSound(),
    });

    UI.button(this, {
      x: 360,
      y: 1022,
      width: 300,
      height: 64,
      label: 'Reiniciar progreso',
      variant: 'ghost',
      fontSize: 20,
      onClick: () => this.openResetConfirm(),
    });

    this.add
      .text(
        360,
        1094,
        'Proyecto académico original · Phaser 4.2.1 · No afiliado a Count Masters',
        textStyle({ size: 14, color: '#66779c', bold: false }),
      )
      .setOrigin(0.5)
      .setDepth(5);
  }

  soundLabel() {
    const enabled = this.progress.get().settings.soundEnabled;
    return enabled ? 'SONIDO: ACTIVADO' : 'SONIDO: DESACTIVADO';
  }

  toggleSound() {
    this.audio.unlock();
    const enabled = this.progress.toggleSound();
    this.audio.setEnabled(enabled);
    this.soundButton.setLabel(this.soundLabel());
    if (enabled) this.audio.click();
  }

  // ---------------------------------------------------------------- modal

  openResetConfirm() {
    this.audio.unlock();
    this.audio.click();
    if (this.modal) return;

    const container = this.add.container(0, 0).setDepth(DEPTHS.overlay).setScrollFactor(0);

    const dim = this.add.rectangle(360, 640, 720, 1280, COLORS.overlay, 0.78).setInteractive();
    const panel = UI.panel(this, {
      x: 360,
      y: 620,
      width: 600,
      height: 400,
      radius: 34,
      depth: DEPTHS.overlay + 1,
    });

    const title = this.add
      .text(360, 512, '¿Reiniciar progreso?', textStyle({ size: 34 }))
      .setOrigin(0.5);
    const body = this.add
      .text(
        360,
        600,
        'Se borrarán las monedas, los niveles desbloqueados\ny las mejoras compradas. Esta acción no se puede deshacer.',
        {
          ...textStyle({ size: 20, color: COLORS.textMutedHex, bold: false }),
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: 500 },
        },
      )
      .setOrigin(0.5);

    const cancel = UI.button(this, {
      x: 238,
      y: 730,
      width: 220,
      height: 80,
      label: 'CANCELAR',
      variant: 'secondary',
      fontSize: 22,
      onClick: () => this.closeModal(),
    });

    const confirm = UI.button(this, {
      x: 482,
      y: 730,
      width: 220,
      height: 80,
      label: 'BORRAR',
      variant: 'danger',
      fontSize: 22,
      onClick: () => {
        this.progress.reset();
        this.audio.setEnabled(true);
        this.closeModal();
        this.scene.restart();
      },
    });

    container.add([dim, panel, title, body, cancel, confirm]);
    this.modal = container;
  }

  closeModal() {
    this.modal?.destroy(true);
    this.modal = null;
  }

  cleanup() {
    this.modal = null;
  }
}
