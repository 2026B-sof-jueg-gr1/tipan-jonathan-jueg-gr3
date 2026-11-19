/**
 * UpgradeScene: compra de mejoras con efecto real en la partida.
 *
 * - Refuerzos iniciales: +5 integrantes al empezar cada nivel.
 * - Bonificación de monedas: +20 % de recompensa al completar niveles.
 *
 * El saldo nunca puede quedar negativo: la compra se valida con reglas puras
 * antes de descontar monedas.
 */

import Phaser from 'phaser';
import { COLORS, DEPTHS } from '../config/gameConfig.js';
import { UPGRADES, upgradeCost } from '../data/upgrades.js';
import { UI, textStyle } from '../ui/UIComponents.js';

const CARD_WIDTH = 620;
const CARD_HEIGHT = 300;

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Upgrade' });
  }

  create() {
    this.progress = this.registry.get('progressManager');
    this.audio = this.registry.get('audio');
    this.toast = null;

    this.buildBackground();
    this.buildHeader();

    const startY = 470;
    const gap = 340;
    UPGRADES.forEach((upgrade, index) => {
      this.buildCard(upgrade, startY + index * gap);
    });

    this.add
      .text(
        360,
        1084,
        'Las mejoras se aplican automáticamente en la siguiente partida\ny se guardan en este navegador.',
        {
          ...textStyle({ size: 16, color: COLORS.textMutedHex, bold: false }),
          align: 'center',
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5)
      .setDepth(5);

    UI.button(this, {
      x: 360,
      y: 1190,
      width: 300,
      height: 72,
      label: 'Volver al menú',
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
    const terrain = this.add.tileSprite(0, 0, 720, 1280, 'tile_terrain').setOrigin(0, 0).setDepth(0);
    terrain.setTint(0x8a7560);

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(COLORS.overlay, 0.66);
    g.fillRect(0, 0, 720, 1280);
    g.fillStyle(COLORS.gold, 0.06);
    g.fillCircle(360, 140, 260);
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
      .text(360, 170, 'Mejoras', textStyle({ size: 42, display: true, shadow: true }))
      .setOrigin(0.5)
      .setDepth(5);

    const rule = this.add.graphics().setDepth(5);
    rule.fillStyle(COLORS.bronze, 0.5);
    rule.fillRect(360 - 50, 204, 100, 2);

    this.add
      .text(
        360,
        234,
        'Invierte las monedas que ganes en tus partidas',
        textStyle({ size: 18, color: COLORS.textMutedHex, bold: false }),
      )
      .setOrigin(0.5)
      .setDepth(5);
  }

  buildCard(upgrade, y) {
    const state = this.progress.get();
    const level = state.upgrades[upgrade.id] ?? 0;
    const maxed = level >= upgrade.maxLevel;
    const cost = upgradeCost(upgrade, level);
    const canAfford = state.coins >= cost;

    const container = this.add.container(0, 0).setDepth(5);

    container.add(
      UI.panel(this, {
        x: 360,
        y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        radius: 30,
        fill: COLORS.panel,
        fillAlpha: 0.96,
        stroke: maxed ? COLORS.gain : COLORS.panelStroke,
        depth: 5,
      }),
    );

    // Icono circular.
    const iconBg = this.add.graphics();
    iconBg.fillStyle(upgrade.color, 0.18);
    iconBg.fillCircle(110, y - 88, 38);
    iconBg.lineStyle(3, upgrade.color, 0.85);
    iconBg.strokeCircle(110, y - 88, 38);
    container.add(iconBg);
    container.add(
      this.add
        .image(110, y - 88, upgrade.id === 'coinBonus' ? 'coin' : 'ally')
        .setScale(upgrade.id === 'coinBonus' ? 1.5 : 1.6),
    );

    container.add(
      this.add.text(166, y - 104, upgrade.name, textStyle({ size: 27, display: true })).setOrigin(0, 0.5),
    );

    container.add(
      this.add
        .text(166, y - 68, upgrade.description, {
          ...textStyle({ size: 16, color: COLORS.textMutedHex, bold: false }),
          wordWrap: { width: 430 },
          lineSpacing: 4,
        })
        .setOrigin(0, 0),
    );

    container.add(
      this.add
        .text(166, y - 6, upgrade.effectLabel, textStyle({ size: 17, color: '#35e0d0' }))
        .setOrigin(0, 0.5),
    );

    // Indicadores de nivel (5 pips).
    const pips = this.add.graphics();
    for (let i = 0; i < upgrade.maxLevel; i += 1) {
      const px = 166 + i * 44;
      const filled = i < level;
      pips.fillStyle(filled ? upgrade.color : 0x2e2116, 1);
      pips.fillRoundedRect(px, y + 26, 34, 12, 6);
      if (!filled) {
        pips.lineStyle(2, 0x4a3624, 1);
        pips.strokeRoundedRect(px, y + 26, 34, 12, 6);
      }
    }
    container.add(pips);

    container.add(
      this.add
        .text(
          166,
          y + 66,
          maxed ? `Nivel máximo alcanzado (${level}/${upgrade.maxLevel})` : `Coste: ${cost} monedas`,
          textStyle({
            size: 17,
            color: maxed ? '#35e0d0' : canAfford ? '#f2c879' : '#e08b7a',
            bold: true,
          }),
        )
        .setOrigin(0, 0.5),
    );

    const buyButton = UI.button(this, {
      x: 520,
      y: y + 74,
      width: 220,
      height: 78,
      label: maxed ? 'Máximo' : 'Mejorar',
      sublabel: maxed ? null : `Nivel ${level + 1}`,
      variant: maxed ? 'ghost' : canAfford ? 'gold' : 'secondary',
      fontSize: 24,
      onClick: () => this.buy(upgrade),
    });
    buyButton.setEnabled(!maxed);
    container.add(buyButton);

    return container;
  }

  buy(upgrade) {
    this.audio.unlock();
    const result = this.progress.purchaseUpgrade(upgrade.id);

    if (!result.ok) {
      this.audio.defeat();
      const message =
        result.reason === 'insufficient-coins'
          ? 'Monedas insuficientes'
          : result.reason === 'max-level'
            ? 'Ya está al máximo'
            : 'No se pudo comprar';
      this.showToast(message, '#e08b7a');
      return;
    }

    this.audio.purchase();
    this.showToast(`¡${upgrade.name} mejorada!`, '#35e0d0');
    this.time.delayedCall(340, () => this.scene.restart());
  }

  showToast(message, color) {
    this.toast?.destroy(true);

    const container = this.add.container(360, 1130).setDepth(DEPTHS.overlay);
    const bg = this.add.graphics();
    bg.fillStyle(0x050302, 0.92);
    bg.fillRoundedRect(-220, -34, 440, 68, 24);
    bg.lineStyle(2, 0x4a3624, 1);
    bg.strokeRoundedRect(-220, -34, 440, 68, 24);

    const label = this.add
      .text(0, 0, message, textStyle({ size: 22, color }))
      .setOrigin(0.5);

    container.add([bg, label]);
    container.setAlpha(0);
    this.toast = container;

    this.tweens.add({
      targets: container,
      alpha: 1,
      y: 1110,
      duration: 180,
      ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: container,
      alpha: 0,
      delay: 1200,
      duration: 320,
      onComplete: () => {
        container.destroy(true);
        if (this.toast === container) this.toast = null;
      },
    });
  }

  cleanup() {
    this.toast?.destroy(true);
    this.toast = null;
  }
}
