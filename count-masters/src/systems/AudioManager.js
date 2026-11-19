/**
 * Audio procedural.
 *
 * No hay archivos de sonido en el proyecto: todos los efectos se sintetizan con
 * la Web Audio API. Si el navegador bloquea el contexto (política de
 * reproducción automática), no hay `AudioContext` o el usuario desactiva el
 * sonido, todos los métodos se convierten en no-ops y el juego sigue siendo
 * completamente funcional.
 *
 * La paleta sonora busca la misma coherencia que la visual: cuerno de bronce,
 * percusión de tambor de guerra, impactos de piedra y madera, y arpegios
 * cortos de lira para las ganancias. Nada de pitidos cuadrados genéricos.
 */

export class AudioManager {
  constructor({ enabled = true } = {}) {
    this.enabled = Boolean(enabled);
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  /** Crea o reanuda el contexto. Debe llamarse desde un gesto del usuario. */
  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const Ctor =
          typeof window !== 'undefined'
            ? (window.AudioContext ?? window.webkitAudioContext)
            : null;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.42;
        // Compresor suave: evita que un impacto con muchos parciales sature.
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 6;
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        this.noiseBuffer = this.buildNoiseBuffer();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
  }

  /** Ruido blanco de un segundo, reutilizado por todos los efectos. */
  buildNoiseBuffer() {
    try {
      const rate = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, rate, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      return buffer;
    } catch {
      return null;
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.enabled) this.unlock();
  }

  isEnabled() {
    return this.enabled;
  }

  /** Emite un tono corto. `slideTo` permite barridos de frecuencia. */
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
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
      }

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

  /**
   * Golpe de ruido filtrado: la base de impactos, rozaduras y viento.
   * `sweepTo` mueve la frecuencia del filtro para simular un barrido.
   */
  noise({
    duration = 0.18,
    gain = 0.1,
    filterType = 'bandpass',
    freq = 900,
    q = 1.2,
    sweepTo = null,
    delay = 0,
  } = {}) {
    if (!this.enabled) return;
    if (!this.ctx) this.unlock();
    if (!this.ctx || !this.master || !this.noiseBuffer) return;

    try {
      const now = this.ctx.currentTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.value = q;
      if (sweepTo) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), now + duration);
      }

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.02, duration * 0.25));
      env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      src.connect(filter);
      filter.connect(env);
      env.connect(this.master);
      src.start(now);
      src.stop(now + duration + 0.03);
    } catch {
      // Silencio ante cualquier fallo del contexto.
    }
  }

  // ------------------------------------------------------------------ UI

  click() {
    this.tone({ freq: 620, duration: 0.05, type: 'triangle', gain: 0.05 });
    this.noise({ duration: 0.05, gain: 0.03, freq: 2400, q: 0.8 });
  }

  hover() {
    this.tone({ freq: 880, duration: 0.035, type: 'sine', gain: 0.022 });
  }

  // -------------------------------------------------------------- puertas

  /**
   * Puerta resuelta. Ganancia: arpegio de lira ascendente. Pérdida: descenso
   * grave con algo de fricción.
   */
  gate(good = true) {
    if (good) {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        this.tone({ freq, duration: 0.14, type: 'triangle', gain: 0.055, delay: i * 0.045 });
      });
    } else {
      this.tone({ freq: 300, duration: 0.2, type: 'sawtooth', gain: 0.05, slideTo: 110 });
      this.noise({ duration: 0.16, gain: 0.035, freq: 420, sweepTo: 160, q: 2 });
    }
  }

  /** Puerta de multiplicación: arpegio más brillante y con más cuerpo. */
  multiply() {
    [523.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      this.tone({ freq, duration: 0.16, type: 'triangle', gain: 0.05, delay: i * 0.05 });
    });
    this.tone({ freq: 261.63, duration: 0.34, type: 'sine', gain: 0.05 });
  }

  // ------------------------------------------------------------ obstáculos

  /** Impacto contra piedra: ruido seco con un golpe grave debajo. */
  hazard() {
    this.noise({ duration: 0.24, gain: 0.12, freq: 1100, sweepTo: 220, q: 1.6 });
    this.tone({ freq: 120, duration: 0.26, type: 'sine', gain: 0.11, slideTo: 52 });
  }

  /** Cuchilla de bronce al pasar: barrido de aire metálico. */
  whoosh() {
    this.noise({ duration: 0.26, gain: 0.055, freq: 3400, sweepTo: 700, q: 3.4 });
    this.tone({ freq: 1400, duration: 0.14, type: 'sine', gain: 0.018, slideTo: 900 });
  }

  /** Esquivar limpio: dos notas rápidas y aire. */
  dodge() {
    this.noise({ duration: 0.14, gain: 0.03, freq: 2600, sweepTo: 1200, q: 2 });
    this.tone({ freq: 880, duration: 0.08, type: 'sine', gain: 0.03, delay: 0.03 });
  }

  // ---------------------------------------------------------------- monedas

  coin() {
    this.tone({ freq: 1046.5, duration: 0.06, type: 'triangle', gain: 0.045 });
    this.tone({ freq: 1568, duration: 0.1, type: 'triangle', gain: 0.035, delay: 0.045 });
  }

  // ---------------------------------------------------------------- batalla

  /** Cuerno de guerra: dos sierras desafinadas con vibrato lento. */
  horn() {
    if (!this.enabled) return;
    if (!this.ctx) this.unlock();
    if (!this.ctx || !this.master) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.85;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.075, now + 0.12);
      env.gain.setValueAtTime(0.075, now + duration - 0.24);
      env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.4;

      // Vibrato: un LFO modula la frecuencia de ambas voces.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 5.2;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 3.5;
      lfo.connect(lfoGain);

      for (const detune of [0, 7, -6]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(146.83, now);
        osc.frequency.linearRampToValueAtTime(174.61, now + 0.3);
        osc.detune.value = detune;
        lfoGain.connect(osc.frequency);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      }

      lfo.start(now);
      lfo.stop(now + duration + 0.05);

      filter.connect(env);
      env.connect(this.master);
    } catch {
      // Silencio ante cualquier fallo del contexto.
    }
  }

  /** Tambor de guerra: golpe grave con rebote. */
  drum() {
    this.tone({ freq: 92, duration: 0.3, type: 'sine', gain: 0.13, slideTo: 46 });
    this.noise({ duration: 0.12, gain: 0.05, freq: 240, q: 0.9 });
  }

  /** Inicio de combate: cuerno + dos tambores. */
  battle() {
    this.drum();
    this.horn();
    this.tone({ freq: 110, duration: 0.2, type: 'sine', gain: 0.1, delay: 0.34, slideTo: 60 });
  }

  /** Golpe de espada durante el combate. */
  clash() {
    this.noise({ duration: 0.1, gain: 0.05, freq: 2600, sweepTo: 1400, q: 4 });
    this.tone({ freq: 720, duration: 0.07, type: 'square', gain: 0.03 });
  }

  // ------------------------------------------------------------- progreso

  purchase() {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      this.tone({ freq, duration: 0.12, type: 'triangle', gain: 0.05, delay: i * 0.06 });
    });
  }

  /** Victoria: fanfarria de cuerno y campanas. */
  victory() {
    this.horn();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this.tone({ freq, duration: 0.2, type: 'triangle', gain: 0.06, delay: 0.12 + i * 0.1 });
    });
    this.tone({ freq: 1318.5, duration: 0.5, type: 'sine', gain: 0.05, delay: 0.56 });
  }

  defeat() {
    [293.66, 233.08, 174.61].forEach((freq, i) => {
      this.tone({ freq, duration: 0.3, type: 'sawtooth', gain: 0.05, delay: i * 0.16 });
    });
    this.tone({ freq: 87.31, duration: 0.6, type: 'sine', gain: 0.08, delay: 0.4 });
  }
}
