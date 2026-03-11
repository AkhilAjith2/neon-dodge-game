import {
  GAME_CONFIG,
  ENEMY_ATTACK_TYPES,
  POWERUP_DURATIONS,
} from "../constants/gameConstants.js";
import {
  clamp,
  lerp,
  rand,
  getRandomAngle,
  normalizeVector,
  getDistance,
} from "./gameUtils.js";
import { playSound } from "./audio.js";

// ============ SPAWN LOGIC ============

export function spawnEnemy(g, isMobile) {
  const spawnOffset = isMobile ? 120 : 40;
  const side = Math.floor(rand(0, 4));
  let x = 0,
    y = 0;

  if (side === 0) {
    x = rand(0, g.w);
    y = -spawnOffset;
  } else if (side === 1) {
    x = g.w + spawnOffset;
    y = rand(0, g.h);
  } else if (side === 2) {
    x = rand(0, g.w);
    y = g.h + spawnOffset;
  } else {
    x = -spawnOffset;
    y = rand(0, g.h);
  }

  const speed =
    rand(GAME_CONFIG.ENEMY_SPEED_MIN, GAME_CONFIG.ENEMY_SPEED_MAX) *
    (1 + g.difficulty * GAME_CONFIG.ENEMY_SPEED_DIFFICULTY_MULTIPLIER);
  const angle =
    Math.atan2(g.py - y, g.px - x) +
    rand(
      -GAME_CONFIG.ENEMY_ATTACK_ANGLE_VARIANCE,
      GAME_CONFIG.ENEMY_ATTACK_ANGLE_VARIANCE,
    );

  const typeRand = Math.random();
  let attackType, huePick;
  if (typeRand < 0.25) {
    attackType = ENEMY_ATTACK_TYPES.AGGRESSIVE;
    huePick = 0.25;
  } else if (typeRand < 0.5) {
    attackType = ENEMY_ATTACK_TYPES.WAVY;
    huePick = 0.75;
  } else if (typeRand < 0.75) {
    attackType = ENEMY_ATTACK_TYPES.ORBITAL;
    huePick = 0.4;
  } else {
    attackType = ENEMY_ATTACK_TYPES.BOUNCY;
    huePick = 0.6;
  }

  g.enemies.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: rand(GAME_CONFIG.ENEMY_SIZE_MIN, GAME_CONFIG.ENEMY_SIZE_MAX),
    w: rand(0.6, 1.2),
    huePick,
    attackType,
    spawnTime: g.t,
    orbitAngle: Math.random() * Math.PI * 2,
    bounceTimer: 0,
  });
}

export function spawnPowerUp(g, mobileScale) {
  const types = ["shield", "speed", "slow"];
  let type = types[Math.floor(Math.random() * types.length)];

  if (g.powerUps.length && g.powerUps[g.powerUps.length - 1].type === type) {
    type = types[(types.indexOf(type) + 1) % types.length];
  }

  const side = Math.floor(rand(0, 4));
  let x = 0,
    y = 0;

  if (side === 0) {
    x = rand(0, g.w);
    y = -40;
  } else if (side === 1) {
    x = g.w + 40;
    y = rand(0, g.h);
  } else if (side === 2) {
    x = rand(0, g.w);
    y = g.h + 40;
  } else {
    x = -40;
    y = rand(0, g.h);
  }

  const angle = Math.atan2(g.h * 0.5 - y, g.w * 0.5 - x);
  const speed = rand(90, 130);

  g.powerUps.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    type,
    r: 22 * mobileScale,
    spawnTime: g.t,
  });
}

export function addParticles(x, y, count, power = 1, colorPick = 0, g) {
  for (let i = 0; i < count; i++) {
    const a = getRandomAngle();
    const sp = rand(40, 220) * power;
    g.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: rand(0.25, 0.9),
      max: 1,
      r: rand(1.5, 4.5),
      pick: colorPick,
    });
  }
}

// ============ PLAYER ABILITIES ============

export function performDash(g, audioContext, mobileScale) {
  if (!g.dashReady || !g.running) return;

  const moveDir = g.lastMoveDir;
  const mag = Math.hypot(moveDir.x, moveDir.y);
  const dx = mag > 0 ? moveDir.x / mag : 1;
  const dy = mag > 0 ? moveDir.y / mag : 0;

  const dashDist = GAME_CONFIG.DASH_DISTANCE;

  g.dashTrail.push({
    x1: g.px,
    y1: g.py,
    x2: g.px + dx * dashDist,
    y2: g.py + dy * dashDist,
    life: GAME_CONFIG.DASH_TRAIL_LIFE,
  });

  g.px += dx * dashDist;
  g.py += dy * dashDist;

  const pad = 20;
  g.px = clamp(g.px, pad, g.w - pad);
  g.py = clamp(g.py, pad, g.h - pad);

  g.dashReady = false;
  g.dashCooldown = g.dashCooldownMax;
  g.shake += 5;
  playSound(audioContext, "dash");

  addParticles(g.px, g.py, 20, 1.2, 0, g);
}

export function activatePowerUp(g, type, audioContext) {
  const dur = POWERUP_DURATIONS[type];

  let existing = g.activePowerUps.find((p) => p.type === type);

  if (existing) {
    existing.duration = dur;
    existing.maxDuration = dur;
  } else {
    g.activePowerUps.push({
      type,
      duration: dur,
      maxDuration: dur,
    });
  }

  if (type === "shield") {
    g.invuln = dur;
  }

  g.score += GAME_CONFIG.COMBO_SCORE;
  g.shake += 5;
  playSound(audioContext, type);
}

// ============ GAME UPDATE LOGIC ============

export function updateGame(dt, g, setUi, ui, audioContext) {
  const realDt = dt;
  const simDt = dt;

  // Time scale from slow power-up
  const slowPower = g.activePowerUps.find((p) => p.type === "slow");
  const targetTimeScale = slowPower ? 0.35 : 1;
  g.timeScale = lerp(g.timeScale, targetTimeScale, 3 * realDt);

  // Dash cooldown
  if (!g.dashReady) {
    g.dashCooldown -= dt;
    if (g.dashCooldown <= 0) {
      g.dashReady = true;
    }
  }

  // Update dash trail
  for (let i = g.dashTrail.length - 1; i >= 0; i--) {
    g.dashTrail[i].life -= dt;
    if (g.dashTrail[i].life <= 0) {
      g.dashTrail.splice(i, 1);
    }
  }

  // Update active power-ups
  for (let i = g.activePowerUps.length - 1; i >= 0; i--) {
    g.activePowerUps[i].duration -= realDt;
    if (g.activePowerUps[i].duration <= 0) {
      g.activePowerUps.splice(i, 1);
    }
  }

  // Difficulty scaling
  g.difficulty = Math.min(
    GAME_CONFIG.MAX_DIFFICULTY,
    g.t * GAME_CONFIG.DIFFICULTY_INCREMENT_RATE,
  );

  // Power-up spawn
  g.powerUpSpawnTimer -= realDt;
  if (g.powerUpSpawnTimer <= 0) {
    g.powerUpSpawnTimer =
      GAME_CONFIG.POWERUP_SPAWN_INTERVAL_BASE -
      g.difficulty * GAME_CONFIG.POWERUP_SPAWN_INTERVAL_REDUCTION;
    spawnPowerUp(g, 1);
  }

  // Enemy spawn
  g.spawnTimer -= realDt;
  const spawnEvery = clamp(
    GAME_CONFIG.SPAWN_INTERVAL_MAX -
      g.difficulty * GAME_CONFIG.SPAWN_DIFFICULTY_REDUCTION,
    GAME_CONFIG.SPAWN_INTERVAL_MIN,
    GAME_CONFIG.SPAWN_INTERVAL_MAX,
  );
  if (g.spawnTimer <= 0) {
    g.spawnTimer = spawnEvery;
    spawnEnemy(g, false);
  }

  // Player movement
  let moveSpeed = GAME_CONFIG.PLAYER_SPEED;
  const hasSpeed = g.activePowerUps.find((p) => p.type === "speed");
  if (hasSpeed) moveSpeed *= GAME_CONFIG.PLAYER_SPEED_MULTIPLIER;

  g.vx = g.ix * moveSpeed;
  g.vy = g.iy * moveSpeed;

  if (g.ix !== 0 || g.iy !== 0) {
    g.lastMoveDir = { x: g.ix, y: g.iy };
  }

  g.px += g.vx * simDt;
  g.py += g.vy * simDt;

  // Player trail
  const dx = g.px - g.prevTrailX;
  const dy = g.py - g.prevTrailY;
  const dist = Math.hypot(dx, dy);

  if (dist > 8) {
    g.playerTrail.push({
      x: g.px,
      y: g.py,
      life: GAME_CONFIG.PLAYER_TRAIL_LIFE,
    });

    if (g.playerTrail.length > GAME_CONFIG.PLAYER_TRAIL_MAX_LENGTH) {
      g.playerTrail.shift();
    }

    g.prevTrailX = g.px;
    g.prevTrailY = g.py;
  }

  // Keep in bounds
  const pad = 20;
  if (g.px < pad) g.vx += (pad - g.px) * 9;
  if (g.px > g.w - pad) g.vx -= (g.px - (g.w - pad)) * 9;
  if (g.py < pad) g.vy += (pad - g.py) * 9;
  if (g.py > g.h - pad) g.vy -= (g.py - (g.h - pad)) * 9;

  g.px = clamp(g.px, pad, g.w - pad);
  g.py = clamp(g.py, pad, g.h - pad);

  // Invulnerability
  g.invuln = Math.max(0, g.invuln - dt);

  // Update enemies
  updateEnemies(g, simDt, audioContext);

  // Update power-ups
  updatePowerUps(g, dt, audioContext);

  // Update particles
  updatePlayerTrail(g, simDt);
  updateParticles(g, dt);

  // Scoring
  const gain = GAME_CONFIG.SCORE_GAIN_BASE * dt * g.combo;
  g.score += gain;

  // Combo system
  const speed = Math.hypot(g.vx, g.vy);
  if (speed > 40) {
    g.comboTimer += realDt;
    if (g.comboTimer > GAME_CONFIG.COMBO_TIMER_THRESHOLD) {
      g.comboTimer = 0;
      g.combo = clamp(g.combo + 1, 1, GAME_CONFIG.COMBO_MAX);
    }
  } else {
    g.comboTimer = Math.max(0, g.comboTimer - realDt * 2.5);
  }

  // Shake decay
  g.shake = Math.max(0, g.shake - dt * GAME_CONFIG.SHAKE_DECAY_RATE);
}

function updateEnemies(g, simDt, audioContext) {
  const enemyDt = simDt * g.timeScale;

  for (let i = g.enemies.length - 1; i >= 0; i--) {
    const e = g.enemies[i];

    e.x += e.vx * enemyDt;
    e.y += e.vy * enemyDt;

    let ax = 0,
      ay = 0;
    const timeSinceSpawn = g.t - e.spawnTime;

    if (e.attackType === ENEMY_ATTACK_TYPES.AGGRESSIVE) {
      ax = (g.px - e.x) * 0.001 * (1 + g.difficulty * 0.08);
      ay = (g.py - e.y) * 0.001 * (1 + g.difficulty * 0.08);
    } else if (e.attackType === ENEMY_ATTACK_TYPES.WAVY) {
      const wave = Math.sin(timeSinceSpawn * 1.5) * 0.3;
      ax = (g.px - e.x) * 0.00045 * (1 + g.difficulty * 0.06) + wave * 0.15;
      ay =
        (g.py - e.y) * 0.00045 * (1 + g.difficulty * 0.06) +
        Math.cos(timeSinceSpawn * 1.2) * 0.15;
    } else if (e.attackType === ENEMY_ATTACK_TYPES.ORBITAL) {
      const targetDist = 120 + 60 * Math.sin(timeSinceSpawn * 2);
      e.orbitAngle += Math.PI * simDt;
      const targetX = g.px + Math.cos(e.orbitAngle) * targetDist;
      const targetY = g.py + Math.sin(e.orbitAngle) * targetDist;
      ax = (targetX - e.x) * 0.0004;
      ay = (targetY - e.y) * 0.0004;
    } else if (e.attackType === ENEMY_ATTACK_TYPES.BOUNCY) {
      e.bounceTimer += simDt;
      if (e.bounceTimer > 0.6) {
        e.bounceTimer = 0;
        const randomAngle = getRandomAngle();
        const bounceForce = 200;
        ax = Math.cos(randomAngle) * bounceForce;
        ay = Math.sin(randomAngle) * bounceForce;
      }
      ax += (g.px - e.x) * 0.00025;
      ay += (g.py - e.y) * 0.00025;
    }

    e.vx += ax * 1000 * enemyDt;
    e.vy += ay * 1000 * enemyDt;

    // Remove if far away
    if (e.x < -120 || e.x > g.w + 120 || e.y < -120 || e.y > g.h + 120) {
      g.enemies.splice(i, 1);
      continue;
    }

    // Collision with player
    checkEnemyCollision(g, e, i, audioContext);
  }
}

function checkEnemyCollision(g, e, index, audioContext) {
  const dx = e.x - g.px;
  const dy = e.y - g.py;
  const rr = e.r + g.r;

  if (dx * dx + dy * dy < rr * rr) {
    if (g.invuln <= 0) {
      g.lives -= 1;
      g.invuln = GAME_CONFIG.HIT_INVULN_DURATION;
      g.shake = 18;
      playSound(audioContext, "hit");
      g.combo = 1;
      g.comboTimer = 0;

      addParticles(g.px, g.py, 28, 1.3, 1, g);
      g.enemies.splice(index, 1);

      return { lives: g.lives, combo: 1, gameOver: g.lives <= 0 };
    } else {
      addParticles(e.x, e.y, 8, 0.7, 0, g);
      g.enemies.splice(index, 1);
    }
  }

  return null;
}

function updatePowerUps(g, dt, audioContext) {
  for (let i = g.powerUps.length - 1; i >= 0; i--) {
    const p = g.powerUps[i];

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < -120 || p.x > g.w + 120 || p.y < -120 || p.y > g.h + 120) {
      g.powerUps.splice(i, 1);
      continue;
    }

    const dx = p.x - g.px;
    const dy = p.y - g.py;

    if (dx * dx + dy * dy < (p.r + g.r) * (p.r + g.r)) {
      activatePowerUp(g, p.type, audioContext);
      g.powerUps.splice(i, 1);
    }
  }

  return null;
}

function updatePlayerTrail(g, simDt) {
  for (let i = g.playerTrail.length - 1; i >= 0; i--) {
    const t = g.playerTrail[i];
    t.life -= simDt;

    if (t.life <= 0) {
      g.playerTrail.splice(i, 1);
    }
  }
}

function updateParticles(g, dt) {
  for (let i = g.particles.length - 1; i >= 0; i--) {
    const p = g.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.03, dt);
    p.vy *= Math.pow(0.03, dt);
    p.life -= dt;
    if (p.life <= 0) g.particles.splice(i, 1);
  }
}
