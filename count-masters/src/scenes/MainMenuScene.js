/**
 * MainMenuScene: título, acceso a jugar, selección de nivel, mejoras, sonido y
 * reinicio del progreso (con confirmación previa).
 *
 * Estilo: la portada de la landing trasladada al lienzo vertical. Misma serifa,
 * mismo bronce, misma multitud al pie.
 */

import Phaser from 'phaser';
import { COLORS, DEPTHS } from '../config/gameConfig.js';
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
    const terrain = this.add.tileSprite(0, 0, 720, 1280, 'tile_terrain').setOrigin(0, 0).setDepth(0);
    terrain.setTint(0x9a8570);

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(COLORS.overlay, 0.62);
    g.fillRect(0, 0, 720, 1280);

    // Halo cálido detrás del título. Se construye con la textura `glow` en vez
    // de círculos planos: los círculos de alfa constante dejaban un disco de
    // borde duro que se leía como una mancha sucia detrás del logotipo.
    this.add
      .image(360, 268, 'glow')
      .setTint(COLORS.accent)
      .setScale(4.6)
      .setAlpha(0.55)
      .setDepth(1);
    this.add
      .image(360, 268, 'glow')
      .setTint(COLORS.gold)
      .setScale(2.8)
      .setAlpha(0.4)
      .setDepth(1);

    // Calzada al pie con la multitud marchando.
    const road = this.add.tileSprite(0, 1140, 720, 140, 'tile_road').setOrigin(0, 0).setDepth(2);
    road.setAlpha(0.95);

    g.fillStyle(0x000000, 0.45);
    g.fillRect(0, 1136, 720, 6);
    g.fillStyle(COLORS.bronze, 0.85);
    g.fillRect(0, 1140, 720, 3);

    for (let i = 0; i < 18; i += 1) {
      const x = 24 + i * 40 + (i % 3) * 6;
      const y = 1214 + (i % 4) * 12;
      const sprite = this.add
        .image(x, y, 'ally')
        .setOrigin(0.5, 1)
        .setDepth(3)
        .setScale(0.62 + (i % 3) * 0.07);
      this.tweens.add({
        targets: sprite,
        y: y - 7,
        duration: 420 + (i % 5) * 45,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    for (let i = 0; i < 5; i += 1) {
      const sprite = this.add
        .image(648 + i * 13, 1240 + (i % 2) * 8, 'enemy')
        .setOrigin(0.5, 1)
        .setDepth(3)
        .setScale(0.58)
        .setAlpha(0.9);
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 5,
        duration: 520 + i * 40,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Puertas decorativas que anticipan la mecánica principal. Se colocan en
    // los márgenes, fuera de la columna de botones (180..540), y por debajo del
    // botón de reinicio: antes se solapaban con ambos y el pie era ilegible.
    this.buildDecorativeGate(104, 1062, '+40', COLORS.gain, 'REFUERZOS');
    this.buildDecorativeGate(616, 1062, '×2', COLORS.multiply, 'MULTIPLICA');
  }

  buildDecorativeGate(x, y, label, color, caption) {
    const g = this.add.graphics().setDepth(4);
    const w = 136;
    const h = 104;

    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(x - w / 2, y - h / 2 + 6, w, h, 10);

    g.fillStyle(0x1a1208, 0.94);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    g.lineStyle(2, color, 0.85);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    g.lineStyle(1, color, 0.28);
    g.strokeRoundedRect(x - w / 2 + 5, y - h / 2 + 5, w - 10, h - 10, 6);

    // Dintel de bronce.
    g.fillStyle(0x8a5f1e, 1);
    g.fillRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, 9);
    g.fillStyle(0xc98a3c, 1);
    g.fillRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, 4);

    this.add
      .text(x, y - 8, label, textStyle({ size: 36, color: '#f2c879', display: true }))
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(x, y + 30, caption, textStyle({ size: 11, color: '#a2937e', bold: false, letterSpacing: 1.6 }))
      .setOrigin(0.5)
      .setDepth(5);
  }

  buildHeader() {
    const coins = this.progress.getCoins();
    const unlocked = this.progress.get().highestUnlockedLevel;

    UI.chip(this, {
      x: 623,
      y: 68,
      width: 170,
      height: 54,
      text: String(coins),
      icon: 'coin',
      iconScale: 0.7,
      fontSize: 24,
      align: 'center',
      fill: COLORS.panel,
      stroke: COLORS.bronze,
      depth: 6,
    });

    UI.chip(this, {
      x: 120,
      y: 68,
      width: 190,
      height: 54,
      text: `Nivel ${unlocked}/${LEVEL_COUNT}`,
      fontSize: 19,
      align: 'center',
      fill: COLORS.panel,
      stroke: COLORS.bronze,
      depth: 6,
    });
  }

  buildTitle() {
    this.add
      .text(360, 214, 'Crowd', textStyle({ size: 76, color: '#efe4d2', display: true, shadow: true }))
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(360, 288, 'Conquest', textStyle({ size: 76, color: '#f2c879', display: true, shadow: true }))
      .setOrigin(0.5)
      .setDepth(5);

    const underline = this.add.graphics().setDepth(5);
    underline.fillStyle(COLORS.bronze, 0.9);
    underline.fillRect(360 - 96, 336, 192, 2);

    this.add
      .text(360, 368, 'GATE RUSH', textStyle({ size: 26, color: '#c98a3c', letterSpacing: 12, display: true }))
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(
        360,
        438,
        'El rey resta. Tú multiplicas.\nElige la puerta correcta y llega a la ciudadela.',
        {
          ...textStyle({ size: 19, color: COLORS.textMutedHex, bold: false, lineSpacing: 10 }),
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
  }

  buildButtons() {
    const highestUnlocked = Math.min(this.progress.get().highestUnlockedLevel, LEVEL_COUNT);

    this.playButton = UI.button(this, {
      x: 360,
      y: 556,
      width: 360,
      height: 104,
      label: 'Jugar',
      sublabel: `Continuar en el nivel ${highestUnlocked}`,
      variant: 'primary',
      fontSize: 36,
      onClick: () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('Game', { levelId: highestUnlocked });
      },
    });

    UI.button(this, {
      x: 360,
      y: 682,
      width: 360,
      height: 84,
      label: 'Seleccionar nivel',
      variant: 'secondary',
      fontSize: 24,
      onClick: () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('LevelSelect');
      },
    });

    UI.button(this, {
      x: 360,
      y: 782,
      width: 360,
      height: 84,
      label: 'Mejoras',
      variant: 'secondary',
      fontSize: 24,
      onClick: () => {
        this.audio.unlock();
        this.audio.click();
        this.scene.start('Upgrade');
      },
    });

    this.soundButton = UI.button(this, {
      x: 360,
      y: 880,
      width: 360,
      height: 74,
      label: this.soundLabel(),
      variant: 'ghost',
      fontSize: 20,
      onClick: () => this.toggleSound(),
    });

    UI.button(this, {
      x: 360,
      y: 976,
      width: 280,
      height: 58,
      label: 'Reiniciar progreso',
      variant: 'ghost',
      fontSize: 17,
      onClick: () => this.openResetConfirm(),
    });
  }

  soundLabel() {
    const enabled = this.progress.get().settings.soundEnabled;
    return enabled ? 'Sonido: activado' : 'Sonido: desactivado';
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

    const dim = this.add.rectangle(360, 640, 720, 1280, COLORS.overlay, 0.8).setInteractive();
    const panel = UI.panel(this, {
      x: 360,
      y: 620,
      width: 600,
      height: 400,
      radius: 20,
      depth: DEPTHS.overlay + 1,
    });

    const title = this.add
      .text(360, 512, '¿Reiniciar progreso?', textStyle({ size: 32, display: true }))
      .setOrigin(0.5);
    const body = this.add
      .text(
        360,
        600,
        'Se borrarán las monedas, los niveles desbloqueados\ny las mejoras compradas. Esta acción no se puede deshacer.',
        {
          ...textStyle({ size: 19, color: COLORS.textMutedHex, bold: false }),
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
      label: 'Cancelar',
      variant: 'secondary',
      fontSize: 21,
      onClick: () => this.closeModal(),
    });

    const confirm = UI.button(this, {
      x: 482,
      y: 730,
      width: 220,
      height: 80,
      label: 'Borrar',
      variant: 'danger',
      fontSize: 21,
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
