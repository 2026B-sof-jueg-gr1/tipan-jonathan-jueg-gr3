import Phaser from 'phaser';
import './styles/main.css';

import { GAME_CONFIG, COLORS } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import UpgradeScene from './scenes/UpgradeScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: COLORS.backgroundHex,
  banner: false,
  // Escalado responsivo: se conserva la proporción 9:16 y se centra el lienzo.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    expandParent: false,
  },
  // Arcade Physics solo se usa para el solapamiento de recogida de monedas
  // (un único cuerpo sensor para toda la multitud). El resto de reglas son
  // detecciones de cruce en coordenadas de mundo.
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
      fps: 60,
    },
  },
  render: {
    antialias: true,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
  input: {
    activePointers: 2,
    disableContextMenu: true,
  },
  // Orden de arranque: la primera escena de la lista se inicia automáticamente.
  scene: [BootScene, MainMenuScene, LevelSelectScene, UpgradeScene, GameScene, ResultScene],
};

// Instancia única del juego. Se expone en window solo para depuración manual.
const game = new Phaser.Game(config);
window.__CROWD_CONQUEST__ = game;

export default game;
