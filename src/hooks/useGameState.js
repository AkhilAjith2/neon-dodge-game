import { useRef, useState } from "react";
import { GAME_CONFIG } from "../constants/gameConstants.js";

export function useGameState() {
  const gameRef = useRef({
    running: false,
    paused: false,
    t: 0,
    dt: 0,
    last: 0,
    w: GAME_CONFIG.DEFAULT_CANVAS_WIDTH,
    h: GAME_CONFIG.DEFAULT_CANVAS_HEIGHT,

    // player
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    r: GAME_CONFIG.PLAYER_RADIUS,
    lives: GAME_CONFIG.INITIAL_LIVES,
    invuln: 0,

    // dash ability
    dashCooldown: 0,
    dashReady: true,
    dashCooldownMax: GAME_CONFIG.DASH_COOLDOWN_MAX,
    lastMoveDir: { x: 1, y: 0 },
    dashTrail: [],
    playerTrail: [],

    // input
    ix: 0,
    iy: 0,

    // enemies and particles
    enemies: [],
    particles: [],
    rings: [],
    nearMisses: [],
    spawnTimer: 0,
    difficulty: 0,

    // power-ups
    powerUps: [],
    activePowerUps: [],
    powerUpSpawnTimer: 0,
    lastPowerUpType: null,

    // scoring
    score: 0,
    best: 0,
    combo: 1,
    comboTimer: 0,

    // effects
    shake: 0,
    hitFlash: 0,
    chroma: 0,
    dashFlash: 0,
    nearMissFlash: 0,
    patternFlash: 2.4,
    lastPatternIndex: 0,
    lastScoreMilestone: 0,
    timeScale: 1,
    mode: "freeplay",
    patternIndex: 0,
    patternElapsed: 0,

    prevTrailX: 0,
    prevTrailY: 0,
  });

  const [ui, setUi] = useState({
    started: false,
    paused: false,
    gameOver: false,
    score: 0,
    best: 0,
    lives: GAME_CONFIG.INITIAL_LIVES,
    combo: 1,
    dashReady: true,
    dashProgress: 1,
    patternIndex: 0,
    patternName: "WARMUP GRID",
    activePowerUps: [],
    isMuted: false,
    gameMode: "freeplay",
  });

  return {
    gameRef,
    ui,
    setUi,
  };
}
