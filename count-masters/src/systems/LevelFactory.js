/**
 * Construcción del escenario a partir de los datos de nivel.
 *
 * Centraliza la creación de pista, puertas, obstáculos, monedas y enemigos para
 * que GameScene no duplique código de instanciación y para que añadir un nivel
 * nuevo sea solo añadir datos en `src/data/levels.js`.
 */

import { TrackRenderer } from './TrackRenderer.js';
import { GatePair } from '../entities/Gate.js';
import { Hazard } from '../entities/Hazard.js';
import { Collectible } from '../entities/Collectible.js';
import { EnemyCrowd } from '../entities/EnemyCrowd.js';

export class LevelFactory {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * @param {object} level configuración del nivel
   * @param {{coinGroup: Phaser.Physics.Arcade.StaticGroup}} options
   */
  build(level, { coinGroup } = {}) {
    const track = new TrackRenderer(this.scene).build(level);

    const gates = level.gates.map((gateConfig) => new GatePair(this.scene, gateConfig));

    const hazards = level.hazards.map((hazardConfig) =>
      new Hazard(this.scene, hazardConfig).build(),
    );

    const coins = level.collectibles.map((coinConfig, index) => {
      const collectible = new Collectible(this.scene, {
        id: `${level.id}-coin-${index + 1}`,
        x: coinConfig.x,
        y: coinConfig.y,
        value: coinConfig.value ?? 1,
      });
      if (coinGroup) collectible.build(coinGroup);
      return collectible;
    });

    const enemies = level.enemies.map((enemyConfig) =>
      new EnemyCrowd(this.scene, enemyConfig).build(),
    );

    level.enemies.forEach((enemyConfig) => {
      track.markBattleZone(
        enemyConfig.triggerY ?? enemyConfig.y + 240,
        enemyConfig.isBoss ? 'GUARDIA REAL' : 'ZONA DE COMBATE',
      );
    });

    return { track, gates, hazards, coins, enemies };
  }
}

export default LevelFactory;
