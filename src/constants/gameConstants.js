// Power-up icon paths
export const POWERUP_ICONS = {
  shield: new Path2D(`
    M12 2L4 5v6c0 5.25 3.438 9.75 8 11
    4.563-1.25 8-5.75 8-11V5l-8-3z
  `),

  speed: new Path2D(`
    M13 2L3 14h7l-1 8 10-12h-7l1-8z
  `),

  slow: new Path2D(`
    M12 2v20
    M4.93 4.93l14.14 14.14
    M2 12h20
    M4.93 19.07L19.07 4.93
  `),
};

// Audio icon paths
export const AUDIO_ICONS = {
  speaker: new Path2D(`
    M3 9v6h4l5 5V4L7 9H3z
    M15.54 3.54A6.5 6.5 0 0120 10a6.5 6.5 0 01-4.46 6.46
    M17 16.95A10 10 0 0023 10a10 10 0 00-6-9.05
  `),

  muted: new Path2D(`
    M3 9v6h4l5 5V4L7 9H3z
    M23 9l-6 6m0-6l6 6
  `),
};

// Color palette
export const PALETTE = {
  bg0: "#070814",
  bg1: "#0b1030",
  neonA: "#7c3aed",
  neonB: "#22d3ee",
  neonC: "#34d399",
  danger: "#fb7185",
  text: "rgba(255,255,255,0.92)",
  textDim: "rgba(255,255,255,0.72)",
  glass: "rgba(255,255,255,0.06)",
  glass2: "rgba(255,255,255,0.10)",
};

// Enemy colors by attack type
export const ENEMY_COLORS = {
  aggressive: "#7c3aed", // purple
  wavy: "#34d399", // green
  orbital: "#ff8c00", // orange
  bouncy: "#ffff00", // yellow
};

// Power-up colors
export const POWERUP_COLORS = {
  shield: "#a855f7",
  speed: "#22c55e",
  slow: "#3b82f6",
};

// Game configuration
export const GAME_CONFIG = {
  PATTERN_NAMES: ["WARMUP GRID", "WAVE BREAK", "ORBIT LOCK", "RICOCHET PULSE", "NEON STORM"],
  DEFAULT_CANVAS_WIDTH: 900,
  DEFAULT_CANVAS_HEIGHT: 520,
  PLAYER_RADIUS: 8,
  PLAYER_SPEED: 950,
  PLAYER_SPEED_MULTIPLIER: 1.8,
  DASH_DISTANCE: 240,
  DASH_COOLDOWN_MAX: 1.2,
  DASH_TRAIL_LIFE: 0.25,
  PLAYER_TRAIL_LIFE: 0.35,
  PLAYER_TRAIL_MAX_LENGTH: 25,
  INITIAL_LIVES: 3,
  INVULN_DURATION: 1.0,
  HIT_INVULN_DURATION: 1.1,
  POWERUP_SPAWN_INTERVAL_BASE: 8,
  POWERUP_SPAWN_INTERVAL_REDUCTION: 1.2,
  SPAWN_INTERVAL_MIN: 0.1,
  SPAWN_INTERVAL_MAX: 0.6,
  SPAWN_DIFFICULTY_REDUCTION: 0.08,
  ENEMY_SPEED_MIN: 130,
  ENEMY_SPEED_MAX: 200,
  ENEMY_SPEED_DIFFICULTY_MULTIPLIER: 0.35,
  ENEMY_SIZE_MIN: 10,
  ENEMY_SIZE_MAX: 22,
  ENEMY_ATTACK_ANGLE_VARIANCE: 0.35,
  DIFFICULTY_INCREMENT_RATE: 0.06,
  MAX_DIFFICULTY: 4,
  SCORE_GAIN_BASE: 12,
  COMBO_SCORE: 100,
  COMBO_TIMER_THRESHOLD: 0.6,
  COMBO_MAX: 9,
  SHAKE_DECAY_RATE: 22,
};

export const FREEPLAY_PATTERN_CONFIGS = [
  {
    id: 1,
    name: "Warmup Grid",
    duration: 16,
    startDifficulty: 0.35,
    endDifficulty: 0.9,
    spawnIntervalMin: 0.9,
    spawnIntervalMax: 1.3,
    powerUpInterval: 9,
    enemyWeights: {
      aggressive: 0.7,
      wavy: 0.3,
      orbital: 0,
      bouncy: 0,
    },
  },
  {
    id: 2,
    name: "Wave Break",
    duration: 18,
    startDifficulty: 0.8,
    endDifficulty: 1.4,
    spawnIntervalMin: 0.75,
    spawnIntervalMax: 1.15,
    powerUpInterval: 8,
    enemyWeights: {
      aggressive: 0.35,
      wavy: 0.45,
      orbital: 0.2,
      bouncy: 0,
    },
  },
  {
    id: 3,
    name: "Orbit Lock",
    duration: 20,
    startDifficulty: 1.25,
    endDifficulty: 2,
    spawnIntervalMin: 0.65,
    spawnIntervalMax: 1,
    powerUpInterval: 7.5,
    enemyWeights: {
      aggressive: 0.2,
      wavy: 0.25,
      orbital: 0.4,
      bouncy: 0.15,
    },
  },
  {
    id: 4,
    name: "Ricochet Pulse",
    duration: 22,
    startDifficulty: 1.8,
    endDifficulty: 2.8,
    spawnIntervalMin: 0.55,
    spawnIntervalMax: 0.9,
    powerUpInterval: 7,
    enemyWeights: {
      aggressive: 0.2,
      wavy: 0.2,
      orbital: 0.2,
      bouncy: 0.4,
    },
  },
  {
    id: 5,
    name: "Neon Storm",
    duration: 24,
    startDifficulty: 2.5,
    endDifficulty: 3.8,
    spawnIntervalMin: 0.45,
    spawnIntervalMax: 0.75,
    powerUpInterval: 6.5,
    enemyWeights: {
      aggressive: 0.25,
      wavy: 0.25,
      orbital: 0.25,
      bouncy: 0.25,
    },
  },
];

// Power-up durations
export const POWERUP_DURATIONS = {
  shield: 4,
  speed: 3,
  slow: 4,
};

// Enemy attack types
export const ENEMY_ATTACK_TYPES = {
  AGGRESSIVE: "aggressive",
  WAVY: "wavy",
  ORBITAL: "orbital",
  BOUNCY: "bouncy",
};

// Sound types
export const SOUND_TYPES = {
  DASH: "dash",
  SPEED: "speed",
  SLOW: "slow",
  SHIELD: "shield",
  HIT: "hit",
};
