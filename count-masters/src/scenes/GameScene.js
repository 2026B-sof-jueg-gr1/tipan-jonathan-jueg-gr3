/**
 * GameScene: coordinación de la simulación completa.
 *
 * Responsabilidades:
 *  - construir el escenario a través de LevelFactory,
 *  - mover al jugador y la cámara,
 *  - resolver puertas, obstáculos, monedas y combates,
 *  - mantener el HUD, la pausa y las condiciones de fin de partida.
 *
 * La lógica matemática vive en `gameplay/rules.js`; la representación de la
 * multitud en `entities/CrowdManager.js`. Esta escena solo orquesta.
 */

import Phaser from 'phaser';
import {
  CAMERA_SCROLL_X,
  COLORS,
  CROWD_CONFIG,
  DEPTHS,
  GAME_CONFIG,
} from '../config/gameConfig.js';
import { GAME_STATES, GameStateMachine } from '../gameplay/states.js';
import {
  applyGateOperation,
  applyHazardDamage,
  calculateRewards,
  computeHazardLoss,
  getCoinBonusLevel,
  getStartingCrowdBonus,
  resolveBattle,
} from '../gameplay/rules.js';
import { getLevel, getNextLevelId, LEVEL_COUNT } from '../data/levels.js';
import { LevelFactory } from '../systems/LevelFactory.js';
import { InputController } from '../systems/InputController.js';
import CrowdManager from '../entities/CrowdManager.js';
import { UI, textStyle } from '../ui/UIComponents.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  /** Reinicia TODO el estado mutable: la escena se reutiliza al reiniciar. */
  init(data) {
    this.level = getLevel(data?.levelId) ?? getLevel(1);
    this.levelId = this.level.id;
    this.runId = `${this.levelId}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    this.state = new GameStateMachine(GAME_STATES.READY);
    this.playerX = GAME_CONFIG.worldCenterX;
    this.playerY = this.level.startY;
    this.previousY = this.playerY;
    this.elapsed = 0;

    this.coinCount = 0;
    this.displayPopulation = 0;
    this.hudTimer = 0;

    this.resultCommitted = false;
    this.resultSent = false;
    this.battle = null;
    this.battleTween = null;
    this.castleConquered = false;
    this.stateBeforePause = GAME_STATES.RUNNING;

    this.pendingTimers = [];
    this.gates = [];
    this.hazards = [];
    this.coins = [];
    this.enemies = [];
    this.track = null;
    this.crowd = null;
    this.crowdSensor = null;
    this.coinGroup = null;
    this.inputCtl = null;
    this.pauseOverlay = null;
    this.toast = null;
    this.hud = {};
  }

  create() {
    this.progressManager = this.registry.get('progressManager');
    this.audio = this.registry.get('audio');
    this.progress = this.progressManager.get();

    // Estado de motores que puede haber quedado pausado en la partida anterior.
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
    this.cameras.main.scrollX = CAMERA_SCROLL_X;
    this.cameras.main.scrollY = this.cameraTargetY(this.playerY);

    this.coinGroup = this.physics.add.staticGroup();
    this.crowdSensor = this.physics.add
      .image(this.playerX, this.playerY, 'pixel')
      .setVisible(false);
    this.crowdSensor.body.setAllowGravity(false);

    const factory = new LevelFactory(this);
    const built = factory.build(this.level, { coinGroup: this.coinGroup });
    this.track = built.track;
    this.gates = built.gates;
    this.hazards = built.hazards;
    this.coins = built.coins;
    this.enemies = built.enemies;

    const startPopulation =
      this.level.startPopulation + getStartingCrowdBonus(this.progress);

    this.crowd = new CrowdManager(this, {
      x: this.playerX,
      y: this.playerY,
      population: startPopulation,
    });
    this.displayPopulation = this.crowd.population;

    this.physics.add.overlap(
      this.crowdSensor,
      this.coinGroup,
      this.handleCoinOverlap,
      undefined,
      this,
    );

    this.updateSensor();
    this.buildHud();
    this.setupInput();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.startCountdown();
  }

  // ------------------------------------------------------------- arranque

  cameraTargetY(y) {
    return clamp(
      y - GAME_CONFIG.height * GAME_CONFIG.cameraFollowRatio,
      0,
      GAME_CONFIG.worldHeight - GAME_CONFIG.height,
    );
  }

  startCountdown() {
    const steps = ['3', '2', '1', '¡YA!'];
    const label = this.add
      .text(360, 620, '', textStyle({ size: 96, shadow: true }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTHS.hud + 3)
      .setAlpha(0);

    let index = 0;
    const tick = () => {
      if (index >= steps.length) {
        label.destroy();
        this.beginRun();
        return;
      }

      const text = steps[index];
      index += 1;

      label.setText(text).setAlpha(1).setScale(1.5);
      this.tweens.add({
        targets: label,
        scale: 1,
        alpha: 0.9,
        duration: 340,
        ease: 'Quad.easeOut',
      });
      this.audio?.tone({
        freq: text === '¡YA!' ? 880 : 520,
        duration: 0.09,
        type: 'triangle',
        gain: 0.05,
      });

      this.pendingTimers.push(this.time.delayedCall(GAME_CONFIG.countdownStep, tick));
    };

    tick();
  }

  beginRun() {
    if (!this.state.is(GAME_STATES.READY)) return;
    this.state.transition(GAME_STATES.RUNNING);
    this.showHint();
  }

  setupInput() {
    const bounds = this.crowd.getLateralBounds();
    this.inputCtl = new InputController(this, {
      onActivity: () => this.dismissHint(),
    });
    this.inputCtl.setBounds(bounds.min, bounds.max);
  }

  // ------------------------------------------------------------------ loop

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed += dt;

    const paused = this.state.is(GAME_STATES.PAUSED);

    if (!paused) {
      this.crowd?.update(time, dt);
      this.enemies.forEach((enemy) => enemy.update(time, dt));
      const hazardsActive = this.state.is(GAME_STATES.RUNNING);
      this.hazards.forEach((hazard) => hazard.update(time, dt, hazardsActive));
    }

    if (this.state.is(GAME_STATES.RUNNING)) {
      this.stepRun(dt);
    }

    this.updateCamera(dt);
    this.updateHud(dt);
  }

  stepRun(dt) {
    this.previousY = this.playerY;

    const bounds = this.crowd.getLateralBounds();
    this.inputCtl.setBounds(bounds.min, bounds.max);
    this.playerX = this.inputCtl.update(dt, this.playerX);

    this.playerY -= this.level.forwardSpeed * dt;
    if (this.playerY < this.level.finishY) this.playerY = this.level.finishY;

    this.crowd.setPosition(this.playerX, this.playerY);
    this.updateSensor();

    this.checkGates();
    if (!this.state.is(GAME_STATES.RUNNING)) return;

    this.checkHazards();
    if (!this.state.is(GAME_STATES.RUNNING)) return;

    this.checkEnemies();
    if (!this.state.is(GAME_STATES.RUNNING)) return;

    if (this.playerY <= this.level.finishY) this.finishRun();
  }

  updateSensor() {
    if (!this.crowdSensor || !this.crowd) return;
    const width = Math.max(60, this.crowd.halfWidth * 2 + 40);
    this.crowdSensor.body.setSize(width, 70, true);
    this.crowdSensor.setPosition(this.playerX, this.playerY - 8);
  }

  updateCamera(dt) {
    const camera = this.cameras.main;
    camera.scrollX = CAMERA_SCROLL_X;

    const target = this.cameraTargetY(this.playerY);
    const smoothing = 1 - Math.exp(-GAME_CONFIG.cameraSmoothing * dt);
    camera.scrollY = Phaser.Math.Linear(camera.scrollY, target, smoothing);
  }

  // --------------------------------------------------------------- puertas

  checkGates() {
    for (const pair of this.gates) {
      if (!pair.isCrossed(this.previousY, this.playerY)) continue;

      const chosen = pair.resolve(this.playerX);
      if (!chosen) continue;

      const before = this.crowd.population;
      const after = applyGateOperation(before, { op: chosen.op, value: chosen.value });
      this.crowd.setPopulation(after);

      const difference = after - before;
      this.audio?.gate(difference >= 0);

      UI.floatingText(this, chosen.gate.x, pair.y + 30, `${difference >= 0 ? '+' : ''}${difference}`, {
        color: difference >= 0 ? '#2ee6a8' : '#ff5f6d',
        size: 48,
        duration: 950,
      });
      this.spawnSpark(chosen.gate.x, pair.y + 70, difference >= 0 ? COLORS.gain : COLORS.loss, 8);

      if (after <= 0) {
        this.finalizeRun(false, 'Una puerta redujo la multitud a cero.');
        return;
      }
    }
  }

  // ------------------------------------------------------------ obstáculos

  checkHazards() {
    for (const hazard of this.hazards) {
      if (!hazard.isCrossed(this.previousY, this.playerY)) continue;

      const hit = hazard.evaluate(this.playerX, this.crowd.halfWidth);
      hazard.markResolved(hit);

      if (!hit) {
        UI.floatingText(this, this.playerX, this.playerY - 20, '¡ESQUIVADO!', {
          color: '#7cf5d2',
          size: 28,
          duration: 800,
        });
        continue;
      }

      const loss = computeHazardLoss(this.crowd.population, hazard.config);
      const after = applyHazardDamage(this.crowd.population, loss);
      this.crowd.setPopulation(after);

      this.audio?.hazard();
      this.cameras.main.shake(180, 0.006);
      UI.floatingText(this, this.playerX, this.playerY - 30, `-${loss}`, {
        color: '#ff5f6d',
        size: 44,
        duration: 850,
      });
      this.spawnSpark(this.playerX, this.playerY - 10, COLORS.loss, 10);

      if (after <= 0) {
        this.finalizeRun(false, 'Un obstáculo acabó con toda la multitud.');
        return;
      }
    }
  }

  // --------------------------------------------------------------- monedas

  handleCoinOverlap(_sensor, coinSprite) {
    const collectible = coinSprite.getData('collectible');
    if (!collectible || collectible.collected) return;

    const value = collectible.collect();
    if (value <= 0) return;

    this.coinCount += value;
    this.audio?.coin();
    UI.floatingText(this, coinSprite.x, coinSprite.y - 18, `+${value}`, {
      color: '#ffc93c',
      size: 30,
      duration: 700,
      rise: 60,
    });
    this.spawnSpark(coinSprite.x, coinSprite.y, COLORS.coin, 5);
  }

  // -------------------------------------------------------------- combate

  checkEnemies() {
    for (const enemy of this.enemies) {
      if (enemy.started) continue;
      if (this.previousY > enemy.triggerY && this.playerY <= enemy.triggerY) {
        this.startBattle(enemy);
        return;
      }
    }
  }

  startBattle(enemy) {
    enemy.started = true;
    this.battle = enemy;

    this.state.transition(GAME_STATES.BATTLE);
    this.inputCtl.setEnabled(false);

    this.playerY = enemy.triggerY;
    this.crowd.setPosition(this.playerX, this.playerY);
    this.updateSensor();

    const result = resolveBattle(this.crowd.population, enemy.population);

    this.audio?.battle();
    this.cameras.main.shake(240, 0.008);
    this.showBattleBanner(enemy);

    const allyStart = this.crowd.renderedCount;
    const enemyStart = enemy.renderedCount;
    const allyEnd =
      result.playerSurvivors > 0
        ? Math.min(result.playerSurvivors, CROWD_CONFIG.maxRenderedAllies)
        : 0;
    const enemyEnd =
      result.enemySurvivors > 0
        ? Math.min(result.enemySurvivors, CROWD_CONFIG.maxRenderedEnemies)
        : 0;

    const proxy = { t: 0 };
    this.battleTween = this.tweens.add({
      targets: proxy,
      t: 1,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.crowd.setVisualCount(Math.round(allyStart + (allyEnd - allyStart) * proxy.t));
        enemy.setVisibleCount(Math.round(enemyStart + (enemyEnd - enemyStart) * proxy.t));
        if (Math.random() < 0.2) this.spawnClash(enemy);
      },
      onComplete: () => this.finishBattle(result),
    });
  }

  finishBattle(result) {
    const enemy = this.battle;
    this.battle = null;
    this.battleTween = null;
    this.hideBattleBanner();

    // La animación nunca decide: la población final viene de resolveBattle.
    this.crowd.setPopulation(result.playerSurvivors);
    enemy.setPopulation(result.enemySurvivors);

    if (result.playerWon) {
      enemy.playDefeat();

      if (enemy.isBoss) {
        this.castleConquered = true;
        this.track.conquerCastle();
        this.cameras.main.flash(420, 255, 201, 60);
        this.showToast('¡CASTILLO CONQUISTADO!');
      } else {
        this.showToast('¡VICTORIA!');
      }

      this.pendingTimers.push(
        this.time.delayedCall(620, () => {
          if (!this.state.is(GAME_STATES.BATTLE)) return;
          this.state.transition(GAME_STATES.RUNNING);
          this.inputCtl.setEnabled(true);
        }),
      );
    } else {
      this.finalizeRun(
        false,
        enemy.isBoss
          ? 'El rey del castillo superó a tu multitud.'
          : 'La multitud rival era más numerosa.',
      );
    }
  }

  spawnClash(enemy) {
    const x = (this.playerX + enemy.x) / 2 + Phaser.Math.Between(-80, 80);
    const y = (this.playerY + enemy.y) / 2 + Phaser.Math.Between(-40, 40);
    this.spawnSpark(x, y, Math.random() < 0.5 ? COLORS.ally : COLORS.enemy, 3);
  }

  // ------------------------------------------------------------------ final

  finishRun() {
    if (this.resultCommitted) return;
    this.finalizeRun(true, null);
  }

  finalizeRun(won, reason) {
    if (this.resultCommitted) return;
    this.resultCommitted = true;

    this.inputCtl?.setEnabled(false);

    if (won) {
      this.state.transition(GAME_STATES.WIN_ANIMATION);
      this.audio?.victory();
      this.cameras.main.flash(420, 124, 245, 210);
      this.celebrate();
      this.pendingTimers.push(this.time.delayedCall(1500, () => this.goToResult(true, null)));
    } else {
      this.state.transition(GAME_STATES.LOST);
      this.audio?.defeat();
      this.cameras.main.shake(420, 0.012);
      this.pendingTimers.push(this.time.delayedCall(1400, () => this.goToResult(false, reason)));
    }
  }

  celebrate() {
    this.crowd.celebrate();
    for (let i = 0; i < 26; i += 1) {
      const color = [COLORS.gold, COLORS.ally, COLORS.multiply][i % 3];
      this.spawnSpark(
        Phaser.Math.Between(60, 660),
        Phaser.Math.Between(220, 1060),
        color,
        2,
        true,
      );
    }
    this.pendingTimers.push(this.time.delayedCall(520, () => this.crowd?.celebrate()));
  }

  goToResult(won, reason) {
    if (this.resultSent) return;
    this.resultSent = true;

    const survivors = this.crowd?.population ?? 0;
    let reward = null;

    if (won) {
      this.state.transition(GAME_STATES.WON);

      reward = calculateRewards({
        runCoins: this.coinCount,
        levelReward: this.level.reward,
        survivors,
        coinBonusLevel: getCoinBonusLevel(this.progress),
      });

      // `commitLevelReward` es idempotente por runId: no puede duplicarse.
      this.progressManager.commitLevelReward({
        levelId: this.level.id,
        coinsEarned: reward.total,
        survivors,
        runId: this.runId,
        levelCount: LEVEL_COUNT,
      });
    } else {
      this.progressManager.recordDefeat();
    }

    const nextLevelId = getNextLevelId(this.level.id);
    const nextUnlocked =
      nextLevelId !== null && this.progressManager.isLevelUnlocked(nextLevelId);

    this.scene.start('Result', {
      won,
      levelId: this.level.id,
      levelName: this.level.name,
      survivors,
      coinsCollected: this.coinCount,
      reward,
      reason,
      nextLevelId: nextUnlocked ? nextLevelId : null,
      totalCoins: this.progressManager.getCoins(),
    });
  }

  // ------------------------------------------------------------------ HUD

  buildHud() {
    const depth = DEPTHS.hud;

    const bar = this.add.graphics().setScrollFactor(0).setDepth(depth - 1);
    bar.fillStyle(0x05070f, 0.6);
    bar.fillRoundedRect(16, 16, 688, 128, 28);
    bar.lineStyle(2, 0x2a3555, 0.9);
    bar.strokeRoundedRect(16, 16, 688, 128, 28);

    UI.chip(this, {
      x: 108,
      y: 46,
      width: 156,
      height: 42,
      text: `NIVEL ${this.level.id}`,
      fontSize: 18,
      align: 'center',
      depth,
    });

    this.pauseButton = UI.button(this, {
      x: 652,
      y: 46,
      width: 64,
      height: 42,
      label: 'II',
      variant: 'secondary',
      fontSize: 20,
      depth,
      onClick: () => this.pauseGame(),
    });

    // Población.
    this.add.image(54, 102, 'ally').setScale(0.8).setScrollFactor(0).setDepth(depth);
    this.hud.populationText = this.add
      .text(76, 102, String(this.crowd.population), textStyle({ size: 40 }))
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth);

    this.hud.populationCaption = this.add
      .text(78, 128, 'TU MULTITUD', {
        ...textStyle({ size: 11, color: '#8fa3c8', bold: true }),
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0.85);

    // Monedas.
    this.add.image(592, 102, 'coin').setScale(0.72).setScrollFactor(0).setDepth(depth);
    this.hud.coinText = this.add
      .text(612, 102, String(this.coinCount), textStyle({ size: 26, color: '#ffd166' }))
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth);

    // Barra de progreso.
    this.hud.progressBar = UI.progressBar(this, {
      x: 360,
      y: 170,
      width: 600,
      height: 14,
      fill: this.level.theme?.curb ?? COLORS.gain,
      depth,
    });

    this.hud.progressText = this.add
      .text(676, 170, '0 %', textStyle({ size: 15, color: '#8fa3c8' }))
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth);

    this.hud.metaText = this.add
      .text(40, 170, 'META', {
        ...textStyle({ size: 13, color: '#8fa3c8', bold: true }),
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0.8);

    this.buildBattleBanner();
  }

  buildBattleBanner() {
    const container = this.add
      .container(360, 300)
      .setScrollFactor(0)
      .setDepth(DEPTHS.hud + 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0e14, 0.92);
    bg.fillRoundedRect(-240, -50, 480, 100, 26);
    bg.lineStyle(3, COLORS.enemy, 0.95);
    bg.strokeRoundedRect(-240, -50, 480, 100, 26);

    const title = this.add
      .text(0, -20, '¡BATALLA!', textStyle({ size: 30, color: '#ff9a8f' }))
      .setOrigin(0.5);

    const detail = this.add
      .text(0, 20, '', textStyle({ size: 20, color: '#ffffff' }))
      .setOrigin(0.5);

    container.add([bg, title, detail]);
    container.setVisible(false);

    this.hud.battleBanner = container;
    this.hud.battleDetail = detail;
  }

  showBattleBanner(enemy) {
    const banner = this.hud.battleBanner;
    if (!banner) return;
    this.hud.battleDetail.setText(
      `${this.crowd.population} TUYOS   ·   ${enemy.population} RIVALES`,
    );
    banner.setVisible(true).setAlpha(1).setScale(0.85);
    this.tweens.add({ targets: banner, scale: 1, duration: 260, ease: 'Back.easeOut' });
  }

  hideBattleBanner() {
    const banner = this.hud.battleBanner;
    if (!banner || !banner.visible) return;
    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 240,
      onComplete: () => banner.setVisible(false),
    });
  }

  updateHud(dt) {
    this.hudTimer += dt;
    if (this.hudTimer < 0.06) return;
    this.hudTimer = 0;

    const target = this.crowd.population;
    this.displayPopulation += (target - this.displayPopulation) * 0.3;
    if (Math.abs(target - this.displayPopulation) < 0.5) this.displayPopulation = target;
    this.hud.populationText?.setText(String(Math.round(this.displayPopulation)));
    this.hud.coinText?.setText(String(this.coinCount));

    const progress = clamp(
      (this.level.startY - this.playerY) / (this.level.startY - this.level.finishY),
      0,
      1,
    );
    this.hud.progressBar?.setProgress(progress);
    this.hud.progressText?.setText(`${Math.round(progress * 100)} %`);
  }

  showHint() {
    const hint = this.add
      .text(
        360,
        1210,
        'Arrastra, toca o usa ← → para moverte',
        textStyle({ size: 20, color: '#c9d6f5', bold: false }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTHS.hud)
      .setAlpha(0.9);

    this.hintText = hint;
    this.pendingTimers.push(
      this.time.delayedCall(4200, () => {
        if (!hint.active) return;
        this.tweens.add({
          targets: hint,
          alpha: 0,
          duration: 500,
          onComplete: () => hint.destroy(),
        });
      }),
    );
  }

  dismissHint() {
    if (!this.hintText?.active) return;
    this.tweens.add({
      targets: this.hintText,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.hintText?.destroy();
        this.hintText = null;
      },
    });
  }

  showToast(message) {
    this.toast?.destroy(true);

    const container = this.add
      .container(360, 400)
      .setScrollFactor(0)
      .setDepth(DEPTHS.toast);

    const bg = this.add.graphics();
    bg.fillStyle(0x05070f, 0.9);
    bg.fillRoundedRect(-250, -42, 500, 84, 24);
    bg.lineStyle(3, COLORS.gold, 0.9);
    bg.strokeRoundedRect(-250, -42, 500, 84, 24);

    const label = this.add
      .text(0, 0, message, textStyle({ size: 28, color: '#ffd166' }))
      .setOrigin(0.5);

    container.add([bg, label]);
    container.setScale(0.8).setAlpha(0);
    this.toast = container;

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: container,
      alpha: 0,
      delay: 1100,
      duration: 320,
      onComplete: () => {
        container.destroy(true);
        if (this.toast === container) this.toast = null;
      },
    });
  }

  // ---------------------------------------------------------------- pausa

  pauseGame() {
    if (!this.state.is(GAME_STATES.RUNNING, GAME_STATES.BATTLE)) return;

    this.stateBeforePause = this.state.state;
    this.state.transition(GAME_STATES.PAUSED);

    this.inputCtl?.setEnabled(false);
    this.tweens.pauseAll();
    this.time.paused = true;
    this.physics.world.pause();

    this.buildPauseOverlay();
  }

  buildPauseOverlay() {
    if (this.pauseOverlay) return;

    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(DEPTHS.overlay);

    const dim = this.add
      .rectangle(360, 640, 720, 1280, COLORS.overlay, 0.82)
      .setInteractive();

    const panel = UI.panel(this, {
      x: 360,
      y: 620,
      width: 580,
      height: 520,
      radius: 36,
      depth: DEPTHS.overlay + 1,
    });

    const title = this.add
      .text(360, 448, 'PAUSA', textStyle({ size: 44, shadow: true }))
      .setOrigin(0.5);

    const info = this.add
      .text(
        360,
        512,
        `Nivel ${this.level.id} · ${this.crowd.population} integrantes`,
        textStyle({ size: 19, color: COLORS.textMutedHex, bold: false }),
      )
      .setOrigin(0.5);

    const resume = UI.button(this, {
      x: 360,
      y: 600,
      width: 400,
      height: 92,
      label: 'CONTINUAR',
      variant: 'primary',
      fontSize: 28,
      onClick: () => this.resumeGame(),
    });

    const restart = UI.button(this, {
      x: 360,
      y: 706,
      width: 400,
      height: 84,
      label: 'REINICIAR NIVEL',
      variant: 'secondary',
      fontSize: 24,
      onClick: () => this.restartLevel(),
    });

    const menu = UI.button(this, {
      x: 360,
      y: 802,
      width: 400,
      height: 84,
      label: 'VOLVER AL MENÚ',
      variant: 'ghost',
      fontSize: 24,
      onClick: () => this.goToMenu(),
    });

    container.add([dim, panel, title, info, resume, restart, menu]);
    // La cámara sigue al jugador, así que todo el overlay debe ser fijo en
    // pantalla también para el hit-test (ver UI.fixScrollFactor).
    UI.fixScrollFactor(container, 0);
    this.pauseOverlay = container;
  }

  resumeGame() {
    if (!this.state.is(GAME_STATES.PAUSED)) return;

    this.closePauseOverlay();
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();

    const target =
      this.stateBeforePause === GAME_STATES.BATTLE ? GAME_STATES.BATTLE : GAME_STATES.RUNNING;
    this.state.transition(target);
    this.inputCtl?.setEnabled(true);
  }

  closePauseOverlay() {
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = null;
  }

  restartLevel() {
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();
    this.scene.restart({ levelId: this.levelId });
  }

  goToMenu() {
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();
    this.scene.start('MainMenu');
  }

  // ---------------------------------------------------------------- efectos

  spawnSpark(x, y, color, count = 4, screenSpace = false) {
    for (let i = 0; i < count; i += 1) {
      const spark = this.add
        .image(x, y, 'spark')
        .setDepth(DEPTHS.effects)
        .setTint(color)
        .setScale(Phaser.Math.FloatBetween(0.5, 1.2));

      if (screenSpace) spark.setScrollFactor(0);

      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(24, 78);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(300, 620),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // -------------------------------------------------------------- limpieza

  /**
   * Limpieza al cerrar la escena (reinicio, derrota, victoria o salida al menú).
   *
   * Importante: en Phaser 4 los plugins de la escena se suscriben a SHUTDOWN
   * durante el arranque, antes que este método. Cuando se ejecuta:
   *   - `DisplayList.shutdown()` ya destruyó todos los GameObjects de la escena,
   *   - el plugin de física ya anuló `this.physics.world`,
   *   - el reloj y el gestor de tweens ya eliminaron sus eventos.
   * Por eso aquí NO se destruyen objetos ni se toca el mundo físico: solo se
   * sueltan referencias y se retiran los escuchadores propios. Así el reinicio
   * parte siempre de una escena limpia sin dobles destrucciones.
   */
  handleShutdown() {
    this.pendingTimers.length = 0;
    this.battleTween = null;

    this.inputCtl?.destroy();
    this.inputCtl = null;

    this.coins = [];
    this.gates = [];
    this.hazards = [];
    this.enemies = [];

    this.track = null;
    this.crowd = null;
    this.coinGroup = null;
    this.crowdSensor = null;
    this.pauseOverlay = null;
    this.toast = null;
    this.hintText = null;
    this.hud = {};
    this.battle = null;
  }
}
