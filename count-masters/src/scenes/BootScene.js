/**
 * BootScene: arranque del juego.
 *
 * 1. Valida la configuración global.
 * 2. Genera todas las texturas procedurales (una sola vez).
 * 3. Prepara la persistencia y el audio y los publica en el registro.
 * 4. Continúa al menú principal.
 */

import Phaser from 'phaser';
import { GAME_CONFIG, TRACK_WIDTH } from '../config/gameConfig.js';
import { LEVEL_COUNT } from '../data/levels.js';
import { createGameTextures } from '../systems/TextureFactory.js';
import { ProgressManager } from '../systems/ProgressManager.js';
import { AudioManager } from '../systems/AudioManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b0f1c');

    try {
      this.validateConfig();
      createGameTextures(this);
    } catch (error) {
      this.showFatalError(error);
      return;
    }

    const progressManager = new ProgressManager({ levelCount: LEVEL_COUNT });
    const audio = new AudioManager({ enabled: progressManager.get().settings.soundEnabled });

    this.registry.set('progressManager', progressManager);
    this.registry.set('audio', audio);
    this.registry.set('levelCount', LEVEL_COUNT);

    this.scene.start('MainMenu');
  }

  /** Comprueba que los parámetros globales describen un mundo coherente. */
  validateConfig() {
    const problems = [];

    if (GAME_CONFIG.startY <= GAME_CONFIG.finishY) {
      problems.push('startY debe ser mayor que finishY (el recorrido avanza hacia arriba).');
    }
    if (GAME_CONFIG.trackLeft <= 0 || GAME_CONFIG.trackRight >= GAME_CONFIG.worldWidth) {
      problems.push('La pista debe quedar dentro de los límites del mundo.');
    }
    if (TRACK_WIDTH <= 200) {
      problems.push('La pista es demasiado estrecha para una multitud.');
    }
    if (GAME_CONFIG.worldHeight <= GAME_CONFIG.height) {
      problems.push('El mundo debe ser más alto que el área visible.');
    }
    if (GAME_CONFIG.forwardSpeed <= 0) {
      problems.push('forwardSpeed debe ser positivo.');
    }
    if (GAME_CONFIG.maxRenderedAllies <= 0 || GAME_CONFIG.maxRenderedEnemies <= 0) {
      problems.push('Los límites de representación deben ser positivos.');
    }

    if (problems.length > 0) {
      throw new Error(`Configuración inválida:\n- ${problems.join('\n- ')}`);
    }
  }

  showFatalError(error) {
    const message = error instanceof Error ? error.message : String(error);
    this.add
      .text(360, 640, `No se pudo iniciar el juego\n\n${message}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ff8a95',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);
    // Se relanza para que el error sea visible en la consola del navegador.
    throw error;
  }
}
