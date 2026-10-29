/**
 * Traducción de teclado, ratón y táctil a un objetivo horizontal.
 *
 * El desplazamiento lateral nunca es instantáneo: se aplica una velocidad
 * máxima y una aceleración, de modo que arrastrar el dedo produce un
 * movimiento suave y predecible. Los punteros que nacen en la franja del HUD
 * (botón de pausa) se ignoran para que no arrastren a la multitud.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}

export class InputController {
  constructor(
    scene,
    {
      maxSpeed = GAME_CONFIG.lateralMaxSpeed,
      acceleration = GAME_CONFIG.lateralAcceleration,
      uiTopInset = GAME_CONFIG.hudTopInset,
      deadZone = GAME_CONFIG.pointerDeadZone,
      onActivity = null,
    } = {},
  ) {
    this.scene = scene;
    this.maxSpeed = maxSpeed;
    this.acceleration = acceleration;
    this.uiTopInset = uiTopInset;
    this.deadZone = deadZone;
    this.onActivity = onActivity;

    this.enabled = true;
    this.vx = 0;
    this.minX = 0;
    this.maxX = GAME_CONFIG.worldWidth;
    this.dragging = false;
    this.activePointerId = null;
    this.targetX = GAME_CONFIG.worldCenterX;

    this.cursors = null;
    this.keys = null;
    this.attach();
  }

  attach() {
    const { input } = this.scene;

    const keyboard = input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.keys = keyboard.addKeys({ left: 'A', right: 'D' });
      keyboard.addCapture(['LEFT', 'RIGHT', 'A', 'D']);
    }

    this.handlePointerDown = (pointer) => {
      if (!this.enabled) return;
      // La franja superior pertenece al HUD: no inicia arrastre.
      if (pointer.y < this.uiTopInset) return;
      if (this.activePointerId !== null && pointer.id !== this.activePointerId) return;
      this.activePointerId = pointer.id;
      this.dragging = true;
      this.targetX = pointer.worldX;
      this.onActivity?.();
    };

    this.handlePointerMove = (pointer) => {
      if (!this.enabled || !this.dragging) return;
      if (this.activePointerId !== null && pointer.id !== this.activePointerId) return;
      this.targetX = pointer.worldX;
    };

    this.handlePointerUp = (pointer) => {
      if (this.activePointerId !== null && pointer.id !== this.activePointerId) return;
      this.dragging = false;
      this.activePointerId = null;
    };

    input.on('pointerdown', this.handlePointerDown);
    input.on('pointermove', this.handlePointerMove);
    input.on('pointerup', this.handlePointerUp);
    input.on('pointerupoutside', this.handlePointerUp);
  }

  setBounds(minX, maxX) {
    this.minX = Math.min(minX, maxX);
    this.maxX = Math.max(minX, maxX);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.vx = 0;
      this.dragging = false;
      this.activePointerId = null;
    }
  }

  /** Devuelve la nueva X del grupo para este fotograma. */
  update(dt, currentX) {
    if (!this.enabled) {
      this.vx = 0;
      return clamp(currentX, this.minX, this.maxX);
    }

    let direction = 0;
    const leftDown = this.cursors?.left?.isDown || this.keys?.left?.isDown;
    const rightDown = this.cursors?.right?.isDown || this.keys?.right?.isDown;
    if (leftDown) direction -= 1;
    if (rightDown) direction += 1;

    let desiredVx = 0;
    if (direction !== 0) {
      desiredVx = direction * this.maxSpeed;
    } else if (this.dragging) {
      const diff = this.targetX - currentX;
      if (Math.abs(diff) > this.deadZone) {
        desiredVx = clamp(diff * 9, -this.maxSpeed, this.maxSpeed);
      }
    }

    this.vx = approach(this.vx, desiredVx, this.acceleration * dt);

    let nextX = currentX + this.vx * dt;
    if (nextX <= this.minX) {
      nextX = this.minX;
      this.vx = 0;
    } else if (nextX >= this.maxX) {
      nextX = this.maxX;
      this.vx = 0;
    }
    return nextX;
  }

  /** Velocidad lateral actual (para orientar visualmente a la multitud). */
  get velocityX() {
    return this.vx;
  }

  destroy() {
    const { input } = this.scene;
    input.off('pointerdown', this.handlePointerDown);
    input.off('pointermove', this.handlePointerMove);
    input.off('pointerup', this.handlePointerUp);
    input.off('pointerupoutside', this.handlePointerUp);
    this.cursors = null;
    this.keys = null;
  }
}
