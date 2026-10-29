/**
 * Audio procedural opcional.
 *
 * No hay archivos de sonido en el proyecto: los efectos se sintetizan con la
 * Web Audio API. Si el navegador bloquea el contexto (política de reproducción
 * automática), no hay `AudioContext` o el usuario desactiva el sonido, todos los
 * métodos se convierten en no-ops y el juego sigue siendo completamente
 * funcional.
 */

export class AudioManager {
  constructor({ enabled = true } = {}) {
    this.enabled = Boolean(enabled);
    this.ctx = null;
    this.master = null;
  }

  /** Crea o reanuda el contexto. Debe llamarse desde un gesto del usuario. */
  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const Ctor = typeof window !== 'undefined' ? window.AudioContext ?? window.webkitAudioContext : null;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.enabled) this.unlock();
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Emite un tono corto. `slideTo` permite barridos de frecuencia.
   */
  tone({ freq = 440, duration = 0.09, type = 'sine', gain = 0.08, slideTo = null, delay = 0 } = {}) {
    if (!this.enabled) return;
    if (!this.ctx) this.unlock();
    if (!this.ctx || !this.master) return;

    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);

      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(gain, now + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(env);
      env.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // El audio nunca debe romper la partida.
    }
  }

  click() {
    this.tone({ freq: 520, duration: 0.06, type: 'square', gain: 0.05 });
  }

  gate(good = true) {
    if (good) {
      this.tone({ freq: 440, duration: 0.1, type: 'triangle', gain: 0.07 });
      this.tone({ freq: 660, duration: 0.12, type: 'triangle', gain: 0.06, delay: 0.07 });
    } else {
      this.tone({ freq: 260, duration: 0.16, type: 'sawtooth', gain: 0.06, slideTo: 120 });
    }
  }

  coin() {
    this.tone({ freq: 980, duration: 0.07, type: 'square', gain: 0.045 });
    this.tone({ freq: 1320, duration: 0.07, type: 'square', gain: 0.035, delay: 0.05 });
  }

  hazard() {
    this.tone({ freq: 180, duration: 0.22, type: 'sawtooth', gain: 0.09, slideTo: 70 });
  }

  battle() {
    this.tone({ freq: 200, duration: 0.16, type: 'square', gain: 0.08 });
    this.tone({ freq: 150, duration: 0.2, type: 'square', gain: 0.07, delay: 0.14 });
  }

  purchase() {
    [520, 660, 880].forEach((freq, index) => {
      this.tone({ freq, duration: 0.1, type: 'triangle', gain: 0.06, delay: index * 0.07 });
    });
  }

  victory() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      this.tone({ freq, duration: 0.18, type: 'triangle', gain: 0.07, delay: index * 0.11 });
    });
  }

  defeat() {
    [330, 262, 196].forEach((freq, index) => {
      this.tone({ freq, duration: 0.26, type: 'sawtooth', gain: 0.06, delay: index * 0.14 });
    });
  }
}
