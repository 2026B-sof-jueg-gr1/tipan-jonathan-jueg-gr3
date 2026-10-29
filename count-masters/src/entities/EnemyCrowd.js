/**
 * Multitud enemiga.
 *
 * Igual que la multitud aliada, mantiene un contador lógico (`population`)
 * separado de los sprites dibujados (máximo `maxRenderedEnemies`). El jefe es
 * una variante de esta misma clase (`isBoss: true`): cambia textura, escala,
 * etiqueta y añade un rey, pero comparte toda la lógica de formación y combate.
 */

import {
  COLORS,
  CROWD_CONFIG,
  DEPTHS,
  FONT_FAMILY,
  GAME_CONFIG,
  TRACK_CENTER,
} from '../config/gameConfig.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class EnemyCrowd {
  constructor(
    scene,
    {
      id,
      name = 'Multitud rival',
      x = TRACK_CENTER,
      y,
      population,
      isBoss = false,
      triggerY = null,
      maxRendered = CROWD_CONFIG.maxRenderedEnemies,
    },
  ) {
    this.scene = scene;
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.population = Math.max(0, Math.floor(Number(population) || 0));
    this.isBoss = Boolean(isBoss);
    this.triggerY = triggerY ?? y + GAME_CONFIG.battleTriggerDistance;
    this.maxRendered = maxRendered;

    this.sprites = [];
    this.objects = [];
    this.columns = 1;
    this.rows = 1;
    this.scaleValue = 1;
    this.visibleCount = Math.min(this.population, this.maxRendered);
    this.bobTime = 0;
    this.defeated = false;
    this.started = false;

    this.king = null;
    this.labelContainer = null;
    this.countText = null;
  }

  build() {
    const texture = this.isBoss ? 'enemy_boss' : 'enemy';

    for (let i = 0; i < this.maxRendered; i += 1) {
      const sprite = this.scene.add
        .image(this.x, this.y, texture)
        .setOrigin(0.5, 1)
        .setDepth(DEPTHS.enemy)
        .setVisible(false)
        .setActive(false);
      this.sprites.push(sprite);
    }

    if (this.isBoss) {
      this.king = this.scene.add
        .image(this.x, this.y + 22, 'king')
        .setOrigin(0.5, 1)
        .setScale(1.2)
        .setDepth(DEPTHS.enemy + 12);
      this.objects.push(this.king);
    }

    this.buildLabel();
    this.rebuildFormation();
    this.layout();
    return this;
  }

  buildLabel() {
    const container = this.scene.add.container(this.x, this.y).setDepth(DEPTHS.effects);

    const bg = this.scene.add.graphics();
    const width = this.isBoss ? 230 : 170;
    const height = this.isBoss ? 76 : 64;
    bg.fillStyle(0x1a0e14, 0.82);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 20);
    bg.lineStyle(3, this.isBoss ? COLORS.boss : COLORS.enemy, 0.95);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 20);

    const countText = this.scene.add
      .text(0, 2, String(this.population), {
        fontFamily: FONT_FAMILY,
        fontSize: this.isBoss ? '44px' : '38px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const nameText = this.scene.add
      .text(0, -height / 2 - 20, this.isBoss ? 'REY DEL CASTILLO' : this.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '17px',
        color: this.isBoss ? '#e0b3ff' : '#ffb3aa',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    container.add([bg, countText, nameText]);
    this.labelContainer = container;
    this.countText = countText;
    this.labelHeight = height;
  }

  get renderedCount() {
    return this.visibleCount;
  }

  rebuildFormation() {
    const count = Math.max(1, this.visibleCount);
    this.columns = clamp(Math.ceil(Math.sqrt(count * 1.35)), 1, CROWD_CONFIG.maxColumns);
    this.rows = Math.max(1, Math.ceil(count / this.columns));
    this.scaleValue = clamp(1 - (this.visibleCount - 14) * 0.0035, 0.6, 1);

    for (let i = 0; i < this.sprites.length; i += 1) {
      const visible = i < this.visibleCount;
      this.sprites[i].setVisible(visible).setActive(visible);
    }

    if (this.king) {
      this.king.setVisible(this.visibleCount > 0);
    }
  }

  setVisibleCount(count) {
    this.visibleCount = clamp(Math.floor(count), 0, this.maxRendered);
    this.rebuildFormation();
    this.layout();
  }

  setPopulation(population) {
    this.population = Math.max(0, Math.floor(population));
    this.countText?.setText(String(this.population));
    this.setVisibleCount(Math.min(this.population, this.maxRendered));
  }

  update(time, dt) {
    this.bobTime += dt;
    this.layout();
  }

  layout() {
    const count = this.visibleCount;
    const scale = this.scaleValue;
    const spacingX = CROWD_CONFIG.horizontalSpacing * scale;
    const spacingY = CROWD_CONFIG.verticalSpacing * scale;
    const halfCols = (this.columns - 1) / 2;

    for (let i = 0; i < count; i += 1) {
      const sprite = this.sprites[i];
      const col = i % this.columns;
      const row = Math.floor(i / this.columns);
      const bob = Math.sin(this.bobTime * 8 + i * 0.9 + 2) * 2 * scale;

      // Las filas enemigas se extienden hacia arriba: miran al jugador.
      sprite.setPosition(
        this.x + (col - halfCols) * spacingX,
        this.y - row * spacingY + bob,
      );
      sprite.setScale(scale);
      sprite.setDepth(DEPTHS.enemy + (this.rows - row));
    }

    if (this.labelContainer) {
      this.labelContainer.setPosition(this.x, this.y - this.rows * spacingY - 62);
    }

    if (this.king) {
      this.king.setPosition(this.x, this.y + 24);
      this.king.setScale(1.2 * scale + 0.1);
    }
  }

  /** Animación de derrota: la multitud cae y la etiqueta se desvanece. */
  playDefeat() {
    this.defeated = true;
    this.sprites.forEach((sprite, index) => {
      if (!sprite.visible) return;
      this.scene.tweens.add({
        targets: sprite,
        alpha: 0,
        y: sprite.y + 54,
        scale: sprite.scale * 0.7,
        duration: 520,
        delay: (index % 18) * 14,
        ease: 'Quad.easeIn',
      });
    });

    if (this.king) {
      this.scene.tweens.add({
        targets: this.king,
        alpha: 0,
        y: this.king.y + 70,
        angle: 24,
        duration: 700,
        ease: 'Quad.easeIn',
      });
    }

    if (this.labelContainer) {
      this.scene.tweens.add({
        targets: this.labelContainer,
        alpha: 0,
        duration: 500,
      });
    }
  }

  destroy() {
    this.sprites.forEach((sprite) => sprite.destroy());
    this.sprites.length = 0;
    this.objects.forEach((obj) => obj.destroy());
    this.objects.length = 0;
    this.labelContainer?.destroy(true);
    this.labelContainer = null;
    this.countText = null;
    this.king = null;
  }
}
