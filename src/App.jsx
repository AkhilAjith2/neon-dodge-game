import React, { useEffect, useMemo, useRef, useState } from "react";

const POWERUP_ICONS = {
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

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export default function NeonDodgeGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // game state stored in refs for smooth loop
  const gameRef = useRef({
    running: false,
    paused: false,
    t: 0,
    dt: 0,
    last: 0,
    w: 900,
    h: 520,

    // player
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    r: 8,
    lives: 3,
    invuln: 0,

    // dash ability
    dashCooldown: 0,
    dashReady: true,
    dashCooldownMax: 1.2,
    lastMoveDir: { x: 1, y: 0 },
    dashTrail: [],

    // input
    ix: 0,
    iy: 0,

    // enemies and particles
    enemies: [],
    particles: [],
    spawnTimer: 0,
    difficulty: 1,

    // power-ups
    powerUps: [],
    activePowerUps: [],
    powerUpSpawnTimer: 0,

    // scoring
    score: 0,
    best: 0,
    combo: 1,
    comboTimer: 0,

    // effects
    shake: 0,
    lastScoreMilestone: 0,
  });

  const [ui, setUi] = useState({
    started: false,
    paused: false,
    gameOver: false,
    score: 0,
    best: 0,
    lives: 3,
    combo: 1,
  });

  // Load best score
  useEffect(() => {
    const best = Number(localStorage.getItem("neon_dodge_best") || 0);
    gameRef.current.best = best;
    setUi((u) => ({ ...u, best }));
  }, []);

  // Resize canvas to container
  useEffect(() => {
    const el = wrapRef.current;
    const c = canvasRef.current;
    if (!el || !c) return;

    const resize = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      // keep a nice aspect ratio
      const targetW = rect.width;
      const targetH = Math.max(420, rect.height || 560);

      c.width = Math.floor(targetW * dpr);
      c.height = Math.floor(targetH * dpr);
      c.style.width = `${targetW}px`;
      c.style.height = `${targetH}px`;

      gameRef.current.w = c.width;
      gameRef.current.h = c.height;
      gameRef.current.dpr = dpr;

      // center player
      if (!gameRef.current.running && !ui.started) {
        gameRef.current.px = c.width * 0.5;
        gameRef.current.py = c.height * 0.5;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener("resize", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [ui.started]);

  // Input: keyboard
  useEffect(() => {
    const g = gameRef.current;

    const down = (e) => {
      if (e.repeat) return;
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        togglePause();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (g.running && g.dashReady) {
          performDash(g);
        } else if (!g.running && !ui.gameOver) start();
        else if (ui.gameOver) start();
        return;
      }
      if (e.key === "Enter") {
        if (!g.running) start();
        else if (ui.gameOver) start();
      }

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") g.ix = -1;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") g.ix = 1;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") g.iy = -1;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") g.iy = 1;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (g.ix === -1) g.ix = 0;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (g.ix === 1) g.ix = 0;
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        if (g.iy === -1) g.iy = 0;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        if (g.iy === 1) g.iy = 0;
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [ui.gameOver]);

  // Input: pointer/touch drag
  useEffect(() => {
    const el = wrapRef.current;
    const g = gameRef.current;
    if (!el) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e) => {
      dragging = true;
      const p = getPoint(e);
      lastX = p.x;
      lastY = p.y;
      if (!g.running) start();
    };
    const onMove = (e) => {
      if (!dragging) return;
      const p = getPoint(e);
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      lastX = p.x;
      lastY = p.y;

      // convert drag delta to input velocity
      g.vx += dx * (g.dpr || 1) * 0.3;
      g.vy += dy * (g.dpr || 1) * 0.3;
    };
    const onUp = () => {
      dragging = false;
    };

    const getPoint = (ev) => {
      const rect = el.getBoundingClientRect();
      const touch = ev.touches?.[0];
      const clientX = touch ? touch.clientX : ev.clientX;
      const clientY = touch ? touch.clientY : ev.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const palette = useMemo(
    () => ({
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
    }),
    [],
  );

  function resetGame() {
    const g = gameRef.current;
    g.running = true;
    g.paused = false;
    g.t = 0;
    g.dt = 0;
    g.last = 0;

    g.px = g.w * 0.5;
    g.py = g.h * 0.5;
    g.vx = 0;
    g.vy = 0;
    g.r = 8;
    g.lives = 3;
    g.invuln = 1.0;

    g.dashCooldown = 0;
    g.dashReady = true;
    g.lastMoveDir = { x: 1, y: 0 };
    g.dashTrail = [];

    g.enemies = [];
    g.particles = [];
    g.powerUps = [];
    g.activePowerUps = [];
    g.spawnTimer = 0;
    g.powerUpSpawnTimer = 0;
    g.difficulty = 1;

    g.score = 0;
    g.combo = 1;
    g.comboTimer = 0;
    g.lastScoreMilestone = 0;

    g.shake = 0;

    setUi((u) => ({
      ...u,
      started: true,
      paused: false,
      gameOver: false,
      score: 0,
      lives: 3,
      combo: 1,
    }));
  }

  function start() {
    cancelAnimationFrame(rafRef.current);
    resetGame();
    rafRef.current = requestAnimationFrame(loop);
  }

  function gameOver() {
    const g = gameRef.current;
    g.running = false;

    if (g.score > g.best) {
      g.best = g.score;
      localStorage.setItem("neon_dodge_best", String(g.best));
    }

    setUi((u) => ({
      ...u,
      paused: false,
      gameOver: true,
      score: Math.floor(g.score),
      best: Math.floor(g.best),
      lives: 0,
    }));
  }

  function togglePause() {
    const g = gameRef.current;
    if (!ui.started) return;
    if (!g.running) return;

    g.paused = !g.paused;
    setUi((u) => ({ ...u, paused: g.paused }));
    if (!g.paused) {
      g.last = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    }
  }

  function performDash(g) {
    if (!g.dashReady || !g.running) return;

    const dashDist = 240;
    const moveDir = g.lastMoveDir;
    const mag = Math.hypot(moveDir.x, moveDir.y);
    const dx = mag > 0 ? moveDir.x / mag : 1;
    const dy = mag > 0 ? moveDir.y / mag : 0;

    // Create dash trail effect with particles
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const trailX = g.px + dx * dashDist * t;
      const trailY = g.py + dy * dashDist * t;
      g.dashTrail.push({
        x: trailX,
        y: trailY,
        life: 0.35 - t * 0.08,
        size: (1 - t) * 10,
      });
    }

    g.px += dx * dashDist;
    g.py += dy * dashDist;

    // Clamp to bounds
    const pad = 20;
    g.px = clamp(g.px, pad, g.w - pad);
    g.py = clamp(g.py, pad, g.h - pad);

    g.dashReady = false;
    g.dashCooldown = g.dashCooldownMax;
    g.shake += 5;

    addParticles(g.px, g.py, 20, 1.2, 0);
  }

  function spawnPowerUp(g) {
    const type =
      Math.random() < 0.4 ? "shield" : Math.random() < 0.7 ? "speed" : "slow";

    // spawn from screen edges
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

    // slow straight movement toward center
    const angle = Math.atan2(g.h * 0.5 - y, g.w * 0.5 - x);

    const speed = rand(90, 130);

    g.powerUps.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type,
      r: 22, // bigger than enemies
      spawnTime: g.t,
    });
  }

  function activatePowerUp(g, type) {
    let existing = g.activePowerUps.find((p) => p.type === type);

    if (type === "shield") {
      if (existing) {
        existing.duration = 4;
        existing.maxDuration = 4;
      } else {
        g.activePowerUps.push({ type: "shield", duration: 4, maxDuration: 4 });
        g.invuln = 4;
      }
    } else if (type === "speed") {
      if (existing) {
        existing.duration = 3;
        existing.maxDuration = 3;
      } else {
        g.activePowerUps.push({ type: "speed", duration: 3, maxDuration: 3 });
      }
    } else if (type === "slow") {
      if (existing) {
        existing.duration = 4;
        existing.maxDuration = 4;
      } else {
        g.activePowerUps.push({ type: "slow", duration: 4, maxDuration: 4 });
      }
    }

    g.score += 100;
    g.shake += 5;
  }

  function playSound(type) {
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const now = audioContext.currentTime;

      if (type === "dash") {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "powerup") {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "hit") {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      // Audio context not available
    }
  }

  function spawnEnemy() {
    const g = gameRef.current;

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

    const speed = rand(130, 200) * (1 + g.difficulty * 0.35);
    const angle = Math.atan2(g.py - y, g.px - x) + rand(-0.35, 0.35);
    const typeRand = Math.random();
    let attackType, huePick;
    if (typeRand < 0.25) {
      attackType = "aggressive";
      huePick = 0.25; // purple
    } else if (typeRand < 0.5) {
      attackType = "wavy";
      huePick = 0.75; // green
    } else if (typeRand < 0.75) {
      attackType = "orbital";
      huePick = 0.4; // orange-ish
    } else {
      attackType = "bouncy";
      huePick = 0.6; // yellow-ish
    }

    g.enemies.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(10, 22),
      w: rand(0.6, 1.2),
      huePick,
      attackType,
      spawnTime: g.t,
      orbitAngle: Math.random() * Math.PI * 2,
      bounceTimer: 0,
    });
  }

  function addParticles(x, y, count, power = 1, colorPick = 0) {
    const g = gameRef.current;
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
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

  function loop(now) {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    if (!g.running) {
      draw(ctx);
      return;
    }
    if (g.paused) {
      draw(ctx);
      return;
    }

    const last = g.last || now;
    let dt = (now - last) / 1000;
    g.last = now;

    // clamp dt to avoid spikes
    dt = clamp(dt, 0, 0.033);
    g.dt = dt;
    g.t += dt;

    update(dt);
    draw(ctx);

    rafRef.current = requestAnimationFrame(loop);
  }

  function update(dt) {
    const g = gameRef.current;

    // handle dash cooldown
    if (!g.dashReady) {
      g.dashCooldown -= dt;
      if (g.dashCooldown <= 0) {
        g.dashReady = true;
      }
    }

    // update dash trail particles
    for (let i = g.dashTrail.length - 1; i >= 0; i--) {
      g.dashTrail[i].life -= dt;
      if (g.dashTrail[i].life <= 0) {
        g.dashTrail.splice(i, 1);
      }
    }

    // update active power-ups
    for (let i = g.activePowerUps.length - 1; i >= 0; i--) {
      g.activePowerUps[i].duration -= dt;
      if (g.activePowerUps[i].duration <= 0) {
        g.activePowerUps.splice(i, 1);
      }
    }

    // difficulty ramps slowly, capped at 4 to keep game playable
    g.difficulty = Math.min(4, g.t * 0.06);

    // power-up spawn logic
    g.powerUpSpawnTimer -= dt;
    if (g.powerUpSpawnTimer <= 0) {
      g.powerUpSpawnTimer = 8 - g.difficulty * 1.2;
      spawnPowerUp(g);
    }

    // spawn logic
    g.spawnTimer -= dt;
    const spawnEvery = clamp(0.6 - g.difficulty * 0.08, 0.1, 0.6);
    if (g.spawnTimer <= 0) {
      g.spawnTimer = spawnEvery;
      spawnEnemy();
    }

    // player movement - constant velocity
    let moveSpeed = 950;

    // apply speed power-up
    const hasSpeed = g.activePowerUps.find((p) => p.type === "speed");
    if (hasSpeed) moveSpeed *= 1.8;

    // apply slow power-up to player as well
    const hasSlow = g.activePowerUps.find((p) => p.type === "slow");
    if (hasSlow) moveSpeed *= 0.6;

    g.vx = g.ix * moveSpeed;
    g.vy = g.iy * moveSpeed;

    // track last movement direction for dash
    if (g.ix !== 0 || g.iy !== 0) {
      g.lastMoveDir = { x: g.ix, y: g.iy };
    }

    g.px += g.vx * dt;
    g.py += g.vy * dt;

    // keep in bounds with soft push
    const pad = 20;
    if (g.px < pad) g.vx += (pad - g.px) * 9;
    if (g.px > g.w - pad) g.vx -= (g.px - (g.w - pad)) * 9;
    if (g.py < pad) g.vy += (pad - g.py) * 9;
    if (g.py > g.h - pad) g.vy -= (g.py - (g.h - pad)) * 9;

    g.px = clamp(g.px, pad, g.w - pad);
    g.py = clamp(g.py, pad, g.h - pad);

    // invulnerability
    g.invuln = Math.max(0, g.invuln - dt);

    // enemies update
    for (let i = g.enemies.length - 1; i >= 0; i--) {
      const e = g.enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // distinct attack patterns based on type
      let ax = 0,
        ay = 0;
      const timeSinceSpawn = g.t - e.spawnTime;

      if (e.attackType === "aggressive") {
        // direct, aggressive pursuit
        ax = (g.px - e.x) * 0.001 * (1 + g.difficulty * 0.08);
        ay = (g.py - e.y) * 0.001 * (1 + g.difficulty * 0.08);
      } else if (e.attackType === "wavy") {
        // gentle wave pattern (slower and less intense)
        const wave = Math.sin(timeSinceSpawn * 1.5) * 0.3;
        ax = (g.px - e.x) * 0.00045 * (1 + g.difficulty * 0.06) + wave * 0.15;
        ay =
          (g.py - e.y) * 0.00045 * (1 + g.difficulty * 0.06) +
          Math.cos(timeSinceSpawn * 1.2) * 0.15;
      } else if (e.attackType === "orbital") {
        // circles around target, maintaining distance
        const targetDist = 120 + 60 * Math.sin(timeSinceSpawn * 2);
        const angle = Math.atan2(g.py - e.y, g.px - e.x);
        e.orbitAngle += Math.PI * dt;
        const targetX = g.px + Math.cos(e.orbitAngle) * targetDist;
        const targetY = g.py + Math.sin(e.orbitAngle) * targetDist;
        ax = (targetX - e.x) * 0.0004;
        ay = (targetY - e.y) * 0.0004;
      } else if (e.attackType === "bouncy") {
        // rapid unpredictable bouncing
        e.bounceTimer += dt;
        if (e.bounceTimer > 0.6) {
          e.bounceTimer = 0;
          const randomAngle = Math.random() * Math.PI * 2;
          const bounceForce = 200;
          ax = Math.cos(randomAngle) * bounceForce;
          ay = Math.sin(randomAngle) * bounceForce;
        }
        // slight homing so it doesn't just bounce randomly away
        ax += (g.px - e.x) * 0.00025;
        ay += (g.py - e.y) * 0.00025;
      }

      // apply slow power-up effect
      let speedMult = 1;
      const hasSlow = g.activePowerUps.find((p) => p.type === "slow");
      if (hasSlow) speedMult = 0.6;

      e.vx += ax * 1000 * dt * speedMult;
      e.vy += ay * 1000 * dt * speedMult;

      // apply slow to velocity directly for smoother slowdown feel
      if (hasSlow) {
        e.vx *= 0.95;
        e.vy *= 0.95;
      }

      // remove if far away
      if (e.x < -120 || e.x > g.w + 120 || e.y < -120 || e.y > g.h + 120) {
        g.enemies.splice(i, 1);
        continue;
      }

      // collision
      const dx = e.x - g.px;
      const dy = e.y - g.py;
      const rr = e.r + g.r;
      if (dx * dx + dy * dy < rr * rr) {
        if (g.invuln <= 0) {
          g.lives -= 1;
          g.invuln = 1.1;
          g.shake = 10;
          g.combo = 1;
          g.comboTimer = 0;

          addParticles(g.px, g.py, 28, 1.3, 1);
          g.enemies.splice(i, 1);

          setUi((u) => ({ ...u, lives: g.lives, combo: 1 }));
          if (g.lives <= 0) {
            gameOver();
            return;
          }
        } else {
          // grazing during invuln still feels good
          addParticles(e.x, e.y, 8, 0.7, 0);
          g.enemies.splice(i, 1);
        }
      }
    }

    // power-up movement + collection
    for (let i = g.powerUps.length - 1; i >= 0; i--) {
      const p = g.powerUps[i];

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // remove if far outside
      if (p.x < -120 || p.x > g.w + 120 || p.y < -120 || p.y > g.h + 120) {
        g.powerUps.splice(i, 1);
        continue;
      }

      // collection
      const dx = p.x - g.px;
      const dy = p.y - g.py;

      if (dx * dx + dy * dy < (p.r + g.r) * (p.r + g.r)) {
        activatePowerUp(g, p.type);
        playSound("powerup");
        g.powerUps.splice(i, 1);
      }
    }

    // particles update
    for (let i = g.particles.length - 1; i >= 0; i--) {
      const p = g.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.03, dt);
      p.vy *= Math.pow(0.03, dt);
      p.life -= dt;
      if (p.life <= 0) g.particles.splice(i, 1);
    }

    // score + combo
    const gain = 12 * dt * g.combo;
    g.score += gain;

    // combo grows while alive and moving
    const speed = Math.hypot(g.vx, g.vy);
    if (speed > 40) {
      g.comboTimer += dt;
      if (g.comboTimer > 0.6) {
        g.comboTimer = 0;
        g.combo = clamp(g.combo + 1, 1, 9);
        setUi((u) => ({ ...u, combo: g.combo }));
      }
    } else {
      g.comboTimer = Math.max(0, g.comboTimer - dt * 2.5);
    }

    // UI sync throttled
    if (Math.floor(g.score) !== Math.floor(ui.score)) {
      setUi((u) => ({ ...u, score: Math.floor(g.score) }));
    }

    // shake decay
    g.shake = Math.max(0, g.shake - dt * 30);
  }

  function draw(ctx) {
    const g = gameRef.current;

    const w = g.w;
    const h = g.h;

    // camera shake
    const sx = (Math.random() - 0.5) * g.shake * (g.dpr || 1);
    const sy = (Math.random() - 0.5) * g.shake * (g.dpr || 1);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(sx, sy);

    // apply greyscale effect if slow power-up is active
    const hasSlow = g.activePowerUps.find((p) => p.type === "slow");
    if (hasSlow) {
      ctx.filter = "saturate(0%) brightness(1.1)";
    }

    // background gradient
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, palette.bg0);
    bg.addColorStop(1, palette.bg1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // subtle grid
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    const step = 56 * (g.dpr || 1);
    ctx.beginPath();
    for (let x = 0; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ambient blobs
    const blob = (x, y, r, a, col) => {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, col);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = a;
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    blob(w * 0.2, h * 0.25, 220 * (g.dpr || 1), 0.35, "rgba(124,58,237,0.45)");
    blob(w * 0.78, h * 0.72, 260 * (g.dpr || 1), 0.28, "rgba(34,211,238,0.42)");

    // dash trail - smooth particle effect
    for (let i = g.dashTrail.length - 1; i >= 0; i--) {
      const t = g.dashTrail[i];
      const alpha = Math.max(0, t.life / 0.35) * 0.7;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(100, 255, 200, 0.95)";
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * (g.dpr || 1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // particles
    for (const p of g.particles) {
      const t = clamp(p.life / p.max, 0, 1);
      const a = t;
      ctx.globalAlpha = a;
      const col =
        p.pick < 0.5
          ? "rgba(34,211,238,0.95)"
          : p.pick < 0.85
            ? "rgba(124,58,237,0.95)"
            : "rgba(251,113,133,0.95)";
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (g.dpr || 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // power-ups - enhanced visuals
    for (const p of g.powerUps) {
      const colors = {
        shield: "#a855f7",
        speed: "#22c55e",
        slow: "#3b82f6",
      };

      const icons = {
        shield: "🛡",
        speed: "⚡",
        slow: "❄",
      };

      const base = colors[p.type];
      const r = p.r * (g.dpr || 1);

      // outer glow
      // pulsing glow strength
      const pulse = 0.6 + 0.4 * Math.sin(g.t * 4);

      // dynamic glow size
      const glowRadius = r * (2.2 + pulse * 0.8);

      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);

      glow.addColorStop(0, base);
      glow.addColorStop(0.4, base + "aa");
      glow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.globalAlpha = 0.6 + pulse * 0.4;

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;

      // main orb
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // icon
      const icon = POWERUP_ICONS[p.type];

      ctx.save();

      // move to center of power-up
      ctx.translate(p.x, p.y);

      // scale icon relative to circle size
      const scale = r / 14;
      ctx.scale(scale, scale);

      // center the 24x24 icon
      ctx.translate(-12, -12);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "white";
      ctx.stroke(icon);

      ctx.restore();
    }

    // enemies - 4 different colors for 4 attack types
    for (const e of g.enemies) {
      let base;
      if (e.attackType === "aggressive") {
        base = palette.neonA; // purple
      } else if (e.attackType === "wavy") {
        base = palette.neonC; // green
      } else if (e.attackType === "orbital") {
        base = "#ff8c00"; // orange
      } else {
        base = "#ffff00"; // yellow
      }

      // glow
      const r = e.r * (g.dpr || 1);
      const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 2.2);
      grd.addColorStop(0, base.replace(")", ",0.55)").replace("rgb", "rgba"));
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // core
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = base;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Reset greyscale filter before drawing player ball so it keeps its color
    if (hasSlow) {
      ctx.filter = "none";
    }

    // player glow + core - make it clearly different from enemies
    const pr = g.r * (g.dpr || 1);
    const glowCol =
      g.invuln > 0 ? "rgba(251,113,133,0.55)" : "rgba(34,211,238,0.55)";

    // Larger, more prominent glow
    const pg = ctx.createRadialGradient(g.px, g.py, 0, g.px, g.py, pr * 4.2);
    pg.addColorStop(0, glowCol);
    pg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(g.px, g.py, pr * 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Shield power-up: progress ring showing remaining time
    const hasShield = g.activePowerUps.find((p) => p.type === "shield");
    if (hasShield) {
      const shieldProgress = hasShield.duration / hasShield.maxDuration;
      const endAngle = shieldProgress * Math.PI * 2 - Math.PI / 2;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "rgba(168, 85, 247, 0.95)";
      ctx.lineWidth = 3.5 * (g.dpr || 1);
      ctx.beginPath();
      ctx.arc(g.px, g.py, pr * 2.8, -Math.PI / 2, endAngle);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Speed power-up: green progress ring showing remaining time
    const hasSpeed = g.activePowerUps.find((p) => p.type === "speed");
    if (hasSpeed) {
      const speedProgress = hasSpeed.duration / hasSpeed.maxDuration;
      const endAngle = speedProgress * Math.PI * 2 - Math.PI / 2;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "rgba(34, 197, 94, 0.95)";
      ctx.lineWidth = 3 * (g.dpr || 1);
      ctx.beginPath();
      ctx.arc(g.px, g.py, pr * 2.2, -Math.PI / 2, endAngle);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Slow power-up: blue progress ring showing remaining time
    const hasSlowRing = g.activePowerUps.find((p) => p.type === "slow");
    if (hasSlowRing) {
      const slowProgress = hasSlowRing.duration / hasSlowRing.maxDuration;
      const endAngle = slowProgress * Math.PI * 2 - Math.PI / 2;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.95)";
      ctx.lineWidth = 3 * (g.dpr || 1);
      ctx.beginPath();
      ctx.arc(g.px, g.py, pr * 1.5, -Math.PI / 2, endAngle);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Pulsing outer ring
    const ringAlpha = 0.5 + 0.3 * Math.sin(g.t * 6);
    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle =
      g.invuln > 0 ? "rgba(251,113,133,0.8)" : "rgba(34,211,238,0.8)";
    ctx.lineWidth = 2.5 * (g.dpr || 1);
    ctx.beginPath();
    ctx.arc(g.px, g.py, pr * 1.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // White core
    ctx.globalAlpha = g.invuln > 0 ? 0.65 + 0.35 * Math.sin(g.t * 18) : 1;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(g.px, g.py, pr * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Main color ring
    ctx.fillStyle =
      g.invuln > 0 ? "rgba(251,113,133,0.95)" : "rgba(34,211,238,0.95)";
    ctx.beginPath();
    ctx.arc(g.px, g.py, pr * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Dash cooldown indicator
    if (!g.dashReady) {
      const dashProgress = 1 - g.dashCooldown / g.dashCooldownMax;
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "rgba(100, 200, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        g.px,
        g.py,
        pr * 2.5,
        -Math.PI / 2,
        -Math.PI / 2 + dashProgress * Math.PI * 2,
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // vignette
    const vg = ctx.createRadialGradient(
      w * 0.5,
      h * 0.5,
      Math.min(w, h) * 0.15,
      w * 0.5,
      h * 0.5,
      Math.min(w, h) * 0.7,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    // Reset filter after drawing
    if (hasSlow) {
      ctx.filter = "none";
    }
  }

  // UI helpers
  const pill = (children) => (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );

  const Button = ({ children, onClick, variant = "primary" }) => {
    const styles =
      variant === "primary"
        ? {
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(34,211,238,0.9))",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.95)",
          }
        : {
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.92)",
          };

    return (
      <button
        onClick={onClick}
        style={{
          ...styles,
          cursor: "pointer",
          padding: "12px 14px",
          borderRadius: 14,
          fontWeight: 700,
          letterSpacing: 0.2,
          boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
          transform: "translateY(0px)",
          transition: "transform 120ms ease, filter 120ms ease",
        }}
        onMouseDown={(e) =>
          (e.currentTarget.style.transform = "translateY(1px)")
        }
        onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0px)")
        }
      >
        {children}
      </button>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(1200px 600px at 30% 20%, rgba(124,58,237,0.18), transparent 50%), radial-gradient(900px 600px at 80% 75%, rgba(34,211,238,0.16), transparent 55%), #060612",
        color: palette.text,
        padding: 0,
        display: "grid",
        placeItems: "center",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gap: 0,
          padding: 0,
          gridTemplateRows: "auto 1fr",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 20px",
            background: "rgba(0,0,0,0.4)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>
              Neon Dodge
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {pill(
              <>
                <span style={{ opacity: 0.8, fontSize: 13 }}>Score</span>
                <span style={{ fontWeight: 800 }}>{ui.score}</span>
              </>,
            )}
            {pill(
              <>
                <span style={{ opacity: 0.8, fontSize: 13 }}>Best</span>
                <span style={{ fontWeight: 800 }}>{ui.best}</span>
              </>,
            )}
            {pill(
              <>
                <span style={{ opacity: 0.8, fontSize: 13 }}>Lives</span>
                <span style={{ fontWeight: 800 }}>
                  {"●".repeat(Math.max(0, ui.lives))}
                </span>
              </>,
            )}
            {pill(
              <>
                <span style={{ opacity: 0.8, fontSize: 13 }}>Combo</span>
                <span style={{ fontWeight: 800 }}>x{ui.combo}</span>
              </>,
            )}
          </div>
        </div>

        <div
          ref={wrapRef}
          style={{
            position: "relative",
            width: "100%",
            height: "calc(100% - 70px)",
            borderRadius: 0,
            overflow: "hidden",
            border: "none",
            background: "transparent",
            boxShadow: "none",
          }}
        >
          <canvas ref={canvasRef} style={{ display: "block" }} />

          {/* Start overlay */}
          {!ui.started && (
            <OverlayCard
              title="Neon Dodge"
              subtitle="Dodge the incoming orbs. Build combo by staying in motion."
              actions={
                <>
                  <Button onClick={start}>Start</Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      alert("Tip: Keep moving to raise combo and score faster!")
                    }
                  >
                    Tips
                  </Button>
                </>
              }
            />
          )}

          {/* Pause overlay */}
          {ui.started && ui.paused && !ui.gameOver && (
            <OverlayCard
              title="Paused"
              subtitle="Take a breather. Press P / Esc to resume."
              actions={
                <>
                  <Button onClick={togglePause}>Resume</Button>
                  <Button variant="ghost" onClick={start}>
                    Restart
                  </Button>
                </>
              }
            />
          )}

          {/* Game over overlay */}
          {ui.gameOver && (
            <OverlayCard
              title="Game Over"
              subtitle={`Score: ${ui.score}  •  Best: ${ui.best}`}
              actions={
                <>
                  <Button onClick={start}>Play again</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      localStorage.removeItem("neon_dodge_best");
                      gameRef.current.best = 0;
                      setUi((u) => ({ ...u, best: 0 }));
                    }}
                  >
                    Reset best
                  </Button>
                </>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OverlayCard({ title, subtitle, actions }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "min(520px, calc(100% - 28px))",
          borderRadius: 22,
          padding: 18,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>
          {title}
        </div>
        <div
          style={{
            marginTop: 8,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}
        >
          {actions}
        </div>
      </div>
    </div>
  );
}
