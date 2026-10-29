/**
 * Monedas recogibles.
 *
 * Cada moneda tiene identificador propio, se puede recoger una sola vez y se
 * desactiva inmediatamente después (cuerpo físico deshabilitado + animación de
 * recogida). La recogida se detecta con un único cuerpo sensor de la multitud
 * y Arcade Physics (overlap), no con un cuerpo por integrante.
 */

import { COLORS, DEPTHS } from '../config/gameConfig.js';

export class Collectible {
  constructor(scene, { id, x, y, value = 1 }) {
    this.scene = scene;
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = Math.max(1, Math.floor(Number(value) || 1));
    this.collected = false;

    this.group = null;
    this.sprite = null;
    this.glow = null;
    this.bobTween = null;
    this.glowTween = null;
  }

  build(group) {
    this.group = group;

    this.sprite = group.create(this.x, this.y, 'coin');
    this.sprite.setDepth(DEPTHS.collectible);
    this.sprite.setData('collectible', this);

    this.glow = this.scene.add
      .image(this.x, this.y, 'glow')
      .setTint(COLORS.coin)
      .setAlpha(0.28)
      .setScale(0.5)
      .setDepth(DEPTHS.collectible - 1);

    this.bobTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.y - 8,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.glowTween = this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.5,
      scale: 0.66,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return this;
  }

  /** Devuelve el valor de la moneda, o 0 si ya estaba recogida. */
  collect() {
    if (this.collected) return 0;
    this.collected = true;

    this.bobTween?.stop();
    this.glowTween?.stop();
    this.bobTween = null;
    this.glowTween = null;

    if (this.sprite?.body) this.sprite.body.enable = false;
    if (this.sprite) this.group?.remove(this.sprite, false);

    if (this.sprite) {
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.sprite.y - 52,
        alpha: 0,
        scale: 1.9,
        duration: 330,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.sprite?.destroy();
          this.sprite = null;
        },
      });
    }

    if (this.glow) {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0,
        scale: 1.5,
        duration: 260,
        onComplete: () => {
          this.glow?.destroy();
          this.glow = null;
        },
      });
    }

    return this.value;
  }

  destroy() {
    this.bobTween?.stop();
    this.glowTween?.stop();
    this.bobTween = null;
    this.glowTween = null;
    this.sprite?.destroy();
    this.glow?.destroy();
    this.sprite = null;
    this.glow = null;
  }
}
