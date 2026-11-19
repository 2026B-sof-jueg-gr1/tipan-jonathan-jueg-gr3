/**
 * Componentes de interfaz reutilizables.
 *
 * Todos los elementos se crean con gráficos vectoriales y texto de Phaser, sin
 * imágenes externas. Los botones devuelven un `Container` con estados visuales
 * (normal, hover, pulsado, deshabilitado) y áreas táctiles de tamaño generoso.
 *
 * Estilo: madera oscura, bronce y serifa. La interfaz del juego usa la misma
 * paleta y la misma tipografía que la landing page; un botón azul redondeado
 * habría delatado que son dos productos distintos.
 */

import { COLORS, DEPTHS, FONT_DISPLAY, FONT_FAMILY } from '../config/gameConfig.js';

const INK = 0x120c08;

export const VARIANTS = Object.freeze({
  primary: { fill: 0xb4552f, hover: 0xd4713f, stroke: 0xf2c879, text: '#f7efe0' },
  secondary: { fill: 0x2a1e14, hover: 0x3b2a1b, stroke: 0x6b4a2f, text: '#efe4d2' },
  danger: { fill: 0x8e2f4a, hover: 0xa93c5a, stroke: 0xe0a6b4, text: '#ffeef2' },
  ghost: { fill: 0x120c08, hover: 0x1f150e, stroke: 0x3b2a1b, text: '#a2937e' },
  gold: { fill: 0xc98a3c, hover: 0xe0a44a, stroke: 0xf2c879, text: '#1a1208' },
  gain: { fill: 0x2b7f6e, hover: 0x359a86, stroke: 0x3fc9b0, text: '#f0fffb' },
});

export function textStyle({
  size = 28,
  color = COLORS.textHex,
  bold = true,
  align = 'center',
  lineSpacing = 4,
  shadow = false,
  family = FONT_FAMILY,
  display = false,
  letterSpacing = 0,
} = {}) {
  const style = {
    fontFamily: display ? FONT_DISPLAY : family,
    fontSize: `${Math.round(size)}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
    align,
    lineSpacing,
  };
  if (letterSpacing) style.letterSpacing = letterSpacing;
  if (shadow) {
    style.shadow = { offsetX: 0, offsetY: 4, color: '#000000', blur: 12, fill: true };
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
   * scrollFactor del HIJO, no con el del contenedor.
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

  /** Filete horizontal de 1 px: el separador de toda la interfaz. */
  rule(scene, { x, y, width, color = 0x4a3624, alpha = 0.9, depth = DEPTHS.hud }) {
    const g = scene.add.graphics().setDepth(depth);
    g.fillStyle(color, alpha);
    g.fillRect(x, y, width, 1);
    return g;
  },

  /**
   * Marco de bronce con esquinas marcadas. Es el contenedor base de paneles,
   * tarjetas y botones: da el acabado de objeto forjado sin añadir imágenes.
   */
  frame(g, { x, y, width, height, radius = 20, fill = COLORS.panel, fillAlpha = 0.97, stroke = COLORS.bronze }) {
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(x, y + 10, width, height, radius);

    g.fillStyle(fill, fillAlpha);
    g.fillRoundedRect(x, y, width, height, radius);

    // Degradado superior: la luz entra desde arriba.
    g.fillStyle(0xffffff, 0.045);
    g.fillRoundedRect(x + 2, y + 2, width - 4, height * 0.34, radius * 0.8);

    g.lineStyle(2, stroke, 0.85);
    g.strokeRoundedRect(x, y, width, height, radius);

    // Hairline interior.
    g.lineStyle(1, stroke, 0.28);
    g.strokeRoundedRect(x + 5, y + 5, width - 10, height - 10, Math.max(2, radius - 5));

    // Esquinas: pequeños remaches de bronce.
    const tick = 10;
    g.fillStyle(stroke, 0.9);
    [
      [x + radius * 0.6, y + 3],
      [x + width - radius * 0.6 - tick, y + 3],
      [x + radius * 0.6, y + height - 5],
      [x + width - radius * 0.6 - tick, y + height - 5],
    ].forEach(([tx, ty]) => g.fillRect(tx, ty, tick, 2));
  },

  /** Panel con marco de bronce. */
  panel(
    scene,
    {
      x,
      y,
      width,
      height,
      radius = 24,
      fill = COLORS.panel,
      fillAlpha = 0.97,
      stroke = COLORS.bronze,
      depth = DEPTHS.hud,
    },
  ) {
    const g = scene.add.graphics().setDepth(depth);
    UI.frame(g, { x: x - width / 2, y: y - height / 2, width, height, radius, fill, fillAlpha, stroke });
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
      fontSize = 32,
      onClick = null,
      depth = DEPTHS.hud,
      scrollFactor = 0,
      display = true,
    },
  ) {
    const style = VARIANTS[variant] ?? VARIANTS.primary;
    const radius = Math.min(18, height / 2);
    const container = scene.add.container(x, y).setDepth(depth);
    if (scrollFactor !== null) container.setScrollFactor(scrollFactor);

    const bg = scene.add.graphics();
    const labelText = scene.add
      .text(
        0,
        sublabel ? -12 : 0,
        label,
        textStyle({
          size: fontSize,
          color: style.text,
          display,
          letterSpacing: display ? 1.2 : 0,
        }),
      )
      .setOrigin(0.5);
    const subText = sublabel
      ? scene.add
          .text(0, 24, sublabel, textStyle({ size: 16, color: style.text, bold: false }))
          .setOrigin(0.5)
      : null;

    const hit = scene.add
      .rectangle(0, 0, width, height, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    let enabled = true;
    let state = 'idle';

    const draw = () => {
      const alpha = !enabled ? 0.42 : state === 'press' ? 0.9 : 1;
      bg.clear();

      // Sombra.
      bg.fillStyle(0x000000, 0.42);
      bg.fillRoundedRect(-width / 2, -height / 2 + 8, width, height, radius);

      // Cuerpo.
      bg.fillStyle(state === 'idle' ? style.fill : style.hover, alpha);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

      // Luz superior.
      bg.fillStyle(0xffffff, state === 'idle' ? 0.06 : 0.12);
      bg.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, height * 0.4, radius * 0.7);

      // Bisel de bronce.
      bg.lineStyle(2, style.stroke, state === 'idle' ? 0.7 : 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
      bg.lineStyle(1, style.stroke, 0.25);
      bg.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, Math.max(2, radius - 4));

      labelText.setAlpha(enabled ? 1 : 0.65);
      subText?.setAlpha(enabled ? 0.82 : 0.5);
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

  /** Píldora con icono opcional y texto. Devuelve un Container con setText(). */
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
      fontSize = 24,
      align = 'left',
      fill = COLORS.panelLight,
      fillAlpha = 0.96,
      stroke = COLORS.panelStroke,
      textColor = COLORS.textHex,
      display = false,
      depth = DEPTHS.hud,
      scrollFactor = 0,
    },
  ) {
    const container = scene.add.container(x, y).setDepth(depth);
    if (scrollFactor !== null) container.setScrollFactor(scrollFactor);

    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-width / 2, -height / 2 + 4, width, height, height / 2);
    g.fillStyle(fill, fillAlpha);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, height * 0.42, height / 3);
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
      .text(
        textX,
        0,
        text,
        textStyle({ size: fontSize, color: textColor, bold: true, display, letterSpacing: display ? 1 : 0 }),
      )
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
      .text(x, y, str, textStyle({ size, color, shadow: true, display: true }))
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

  /** Barra de progreso. Devuelve un Container con setProgress(0..1). */
  progressBar(
    scene,
    {
      x,
      y,
      width = 320,
      height = 14,
      fill = COLORS.gain,
      track = 0x1a1208,
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
      g.fillStyle(INK, 0.9);
      g.fillRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, (height + 4) / 2);
      g.fillStyle(track, 0.95);
      g.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
      if (clamped > 0.001) {
        g.fillStyle(fill, 1);
        g.fillRoundedRect(-width / 2, -height / 2, Math.max(height, width * clamped), height, height / 2);
        g.fillStyle(0xffffff, 0.22);
        g.fillRoundedRect(
          -width / 2 + 3,
          -height / 2 + 2,
          Math.max(0, width * clamped - 6),
          height * 0.35,
          height / 4,
        );
      }
      g.lineStyle(1, COLORS.bronze, 0.5);
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

  /** Fondo oscuro a pantalla completa que bloquea la interacción con lo de atrás. */
  dimmer(scene, { alpha = 0.78, depth = DEPTHS.overlay } = {}) {
    const rect = scene.add
      .rectangle(360, 640, 720, 1280, COLORS.overlay, alpha)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive();
    return rect;
  },
};

export default UI;
