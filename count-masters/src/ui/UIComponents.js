/**
 * Componentes de interfaz reutilizables.
 *
 * Todos los elementos se crean con gráficos vectoriales y texto de Phaser, sin
 * imágenes externas. Los botones devuelven un `Container` con estados visuales
 * (normal, hover, pulsado, deshabilitado) y áreas táctiles de tamaño generoso.
 */

import { COLORS, DEPTHS, FONT_FAMILY } from '../config/gameConfig.js';

export const VARIANTS = Object.freeze({
  primary: { fill: COLORS.accent, hover: COLORS.accentLight, stroke: 0x9db4ff, text: '#ffffff' },
  secondary: { fill: COLORS.panelLight, hover: 0x2c3866, stroke: COLORS.panelStroke, text: '#ffffff' },
  danger: { fill: 0xc23444, hover: 0xe4505f, stroke: 0xff8a95, text: '#ffffff' },
  ghost: { fill: 0x101733, hover: 0x1d2748, stroke: COLORS.panelStroke, text: '#c9d6f5' },
  gold: { fill: 0xc99a1e, hover: 0xe8b93a, stroke: COLORS.gold, text: '#1a1305' },
  gain: { fill: 0x14a37f, hover: 0x1fc79b, stroke: 0x7cf5d2, text: '#04120e' },
});

export function textStyle({
  size = 28,
  color = COLORS.textHex,
  bold = true,
  align = 'center',
  lineSpacing = 4,
  shadow = false,
  family = FONT_FAMILY,
} = {}) {
  const style = {
    fontFamily: family,
    fontSize: `${Math.round(size)}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
    align,
    lineSpacing,
  };
  if (shadow) {
    style.shadow = { offsetX: 0, offsetY: 4, color: '#000000', blur: 10, fill: true };
  }
  return style;
}

export const UI = {
  /**
   * Fija el scrollFactor de un Container y de todos sus hijos.
   *
   * En Phaser 4 `setScrollFactor(x, y)` ya NO acepta el tercer argumento
   * `updateChildren` que existía en Phaser 3, así que hay que propagarlo a mano.
   * Es imprescindible: `InputManager.hitTest` calcula el punto de impacto con el
   * scrollFactor del HIJO (`px = worldX + scrollX * child.scrollFactorX - scrollX`),
   * no con el del contenedor. Por eso un HUD con scrollFactor 0 dejaba de
   * responder en cuanto la cámara se desplazaba. El render multiplica el valor
   * del hijo por el del contenedor y lo restaura al terminar, de modo que fijar
   * ambos en 0 no altera el dibujado.
   */
  fixScrollFactor(container, factor) {
    if (factor === null || factor === undefined) return container;
    container.setScrollFactor(factor);
    for (const child of container.list) {
      if (typeof child.setScrollFactor === 'function') {
        child.setScrollFactor(factor);
      }
    }
    return container;
  },

  /** Panel redondeado con sombra y borde opcional. */
  panel(
    scene,
    {
      x,
      y,
      width,
      height,
      radius = 28,
      fill = COLORS.panel,
      fillAlpha = 0.96,
      stroke = COLORS.panelStroke,
      strokeWidth = 3,
      depth = DEPTHS.hud,
      shadow = true,
    },
  ) {
    const g = scene.add.graphics().setDepth(depth);
    if (shadow) {
      g.fillStyle(0x000000, 0.32);
      g.fillRoundedRect(x - width / 2, y - height / 2 + 8, width, height, radius);
    }
    g.fillStyle(fill, fillAlpha);
    g.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    if (stroke !== null) {
      g.lineStyle(strokeWidth, stroke, 1);
      g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    }
    return g;
  },

  /** Texto con estilo consistente. */
  text(scene, x, y, str, opts = {}) {
    const { originX = 0.5, originY = 0.5, ...styleOpts } = opts;
    return scene.add.text(x, y, str, textStyle(styleOpts)).setOrigin(originX, originY);
  },

  /**
   * Botón interactivo. Devuelve un Container con:
   *  - setEnabled(bool)
   *  - setLabel(str)
   *  - setSublabel(str)
   */
  button(
    scene,
    {
      x,
      y,
      width = 360,
      height = 96,
      label = '',
      sublabel = null,
      variant = 'primary',
      fontSize = 34,
      onClick = null,
      depth = DEPTHS.hud,
      scrollFactor = 0,
    },
  ) {
    const style = VARIANTS[variant] ?? VARIANTS.primary;
    const radius = Math.min(28, height / 2);
    const container = scene.add.container(x, y).setDepth(depth);
    if (scrollFactor !== null) container.setScrollFactor(scrollFactor);

    const bg = scene.add.graphics();
    const labelText = scene.add
      .text(0, sublabel ? -12 : 0, label, textStyle({ size: fontSize, color: style.text }))
      .setOrigin(0.5);
    const subText = sublabel
      ? scene.add
          .text(0, 24, sublabel, textStyle({ size: 17, color: style.text, bold: false }))
          .setOrigin(0.5)
      : null;

    const hit = scene.add
      .rectangle(0, 0, width, height, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    let enabled = true;
    let state = 'idle';

    const draw = () => {
      const current = !enabled ? 0.45 : state === 'idle' ? 1 : state === 'hover' ? 1 : 0.88;
      bg.clear();
      bg.fillStyle(0x000000, 0.35);
      bg.fillRoundedRect(-width / 2, -height / 2 + 7, width, height, radius);
      bg.fillStyle(state === 'idle' ? style.fill : style.hover, current);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
      bg.lineStyle(3, style.stroke, state === 'idle' ? 0.55 : 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
      bg.fillStyle(0xffffff, state === 'idle' ? 0.07 : 0.14);
      bg.fillRoundedRect(-width / 2 + 8, -height / 2 + 6, width - 16, height * 0.3, radius * 0.6);
      labelText.setAlpha(enabled ? 1 : 0.6);
      subText?.setAlpha(enabled ? 0.85 : 0.5);
    };

    const resetPosition = () => {
      container.y = y;
    };

    hit.on('pointerover', () => {
      if (!enabled) return;
      state = 'hover';
      draw();
    });
    hit.on('pointerout', () => {
      state = 'idle';
      resetPosition();
      draw();
    });
    hit.on('pointerdown', () => {
      if (!enabled) return;
      state = 'press';
      container.y = y + 3;
      draw();
    });
    hit.on('pointerup', () => {
      if (!enabled) return;
      state = 'hover';
      resetPosition();
      draw();
      onClick?.(container);
    });

    container.add([bg, labelText, ...(subText ? [subText] : []), hit]);
    UI.fixScrollFactor(container, scrollFactor);
    draw();

    container.setEnabled = (value) => {
      enabled = Boolean(value);
      if (enabled) hit.setInteractive({ useHandCursor: true });
      else {
        hit.disableInteractive();
        state = 'idle';
        resetPosition();
      }
      draw();
      return container;
    };
    container.setLabel = (value) => {
      labelText.setText(value);
      return container;
    };
    container.setSublabel = (value) => {
      subText?.setText(value);
      return container;
    };
    container.isUIButton = true;

    return container;
  },

  /**
   * Píldora con icono opcional y texto. Devuelve un Container con setText().
   */
  chip(
    scene,
    {
      x,
      y,
      width = 180,
      height = 52,
      text = '',
      icon = null,
      iconScale = 0.7,
      fontSize = 26,
      align = 'left',
      fill = COLORS.panelLight,
      fillAlpha = 0.95,
      stroke = COLORS.panelStroke,
      textColor = COLORS.textHex,
      depth = DEPTHS.hud,
      scrollFactor = 0,
    },
  ) {
    const container = scene.add.container(x, y).setDepth(depth);
    if (scrollFactor !== null) container.setScrollFactor(scrollFactor);

    const g = scene.add.graphics();
    g.fillStyle(fill, fillAlpha);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    g.lineStyle(2, stroke, 0.9);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);

    const children = [g];
    let textX = 0;
    if (icon) {
      const iconImage = scene.add.image(-width / 2 + height / 2 + 4, 0, icon).setScale(iconScale);
      children.push(iconImage);
      if (align === 'left') textX = -width / 2 + height + 6;
    }

    const label = scene.add
      .text(textX, 0, text, textStyle({ size: fontSize, color: textColor, bold: true }))
      .setOrigin(align === 'left' ? 0 : 0.5, 0.5);
    children.push(label);

    container.add(children);
    UI.fixScrollFactor(container, scrollFactor);
    container.setText = (value) => {
      label.setText(value);
      return container;
    };
    return container;
  },

  /** Texto flotante en coordenadas de mundo (sube y se desvanece). */
  floatingText(
    scene,
    x,
    y,
    str,
    { color = COLORS.textHex, size = 40, duration = 900, rise = 90, depth = DEPTHS.effects } = {},
  ) {
    const label = scene.add
      .text(x, y, str, textStyle({ size, color, shadow: true }))
      .setOrigin(0.5)
      .setDepth(depth)
      .setScale(0.6);

    scene.tweens.add({
      targets: label,
      y: y - rise,
      scale: 1,
      duration: duration * 0.35,
      ease: 'Back.easeOut',
    });
    scene.tweens.add({
      targets: label,
      alpha: 0,
      delay: duration * 0.45,
      duration: duration * 0.55,
      ease: 'Quad.easeIn',
      onComplete: () => label.destroy(),
    });
    return label;
  },

  /**
   * Barra de progreso. Devuelve un Container con setProgress(0..1).
   */
  progressBar(
    scene,
    {
      x,
      y,
      width = 320,
      height = 14,
      fill = COLORS.gain,
      track = 0x0a0f1e,
      depth = DEPTHS.hud,
      scrollFactor = 0,
    },
  ) {
    const container = scene.add.container(x, y).setDepth(depth);
    if (scrollFactor !== null) container.setScrollFactor(scrollFactor);

    const g = scene.add.graphics();
    let value = 0;

    const draw = () => {
      const clamped = Math.min(1, Math.max(0, value));
      g.clear();
      g.fillStyle(track, 0.9);
      g.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
      if (clamped > 0.001) {
        g.fillStyle(fill, 1);
        g.fillRoundedRect(-width / 2, -height / 2, Math.max(height, width * clamped), height, height / 2);
        g.fillStyle(0xffffff, 0.25);
        g.fillRoundedRect(-width / 2 + 3, -height / 2 + 2, Math.max(0, width * clamped - 6), height * 0.35, height / 4);
      }
      g.lineStyle(2, 0x2a3555, 1);
      g.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    };

    draw();
    container.add(g);
    UI.fixScrollFactor(container, scrollFactor);
    container.setProgress = (next) => {
      value = Number(next) || 0;
      draw();
      return container;
    };
    return container;
  },

  /**
   * Fondo oscuro a pantalla completa que bloquea la interacción con lo de atrás.
   */
  dimmer(scene, { alpha = 0.72, depth = DEPTHS.overlay } = {}) {
    const rect = scene.add
      .rectangle(360, 640, 720, 1280, COLORS.overlay, alpha)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive();
    return rect;
  },
};

export default UI;
