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
