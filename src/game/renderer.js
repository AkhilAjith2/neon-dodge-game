import {
  PALETTE,
  ENEMY_COLORS,
  POWERUP_COLORS,
  POWERUP_ICONS,
} from "../constants/gameConstants.js";

export function drawGame(ctx, g) {
  const w = g.w;
  const h = g.h;

  const slowAmount = 1 - g.timeScale;

  // Camera shake
  const sx = (Math.random() - 0.5) * g.shake * (g.dpr || 1);
  const sy = (Math.random() - 0.5) * g.shake * (g.dpr || 1);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.translate(sx, sy);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, PALETTE.bg0);
  bg.addColorStop(1, PALETTE.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Living parallax grid
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  const step = 56 * (g.dpr || 1);
  ctx.beginPath();
  const gridX = (g.t * 10 * (g.dpr || 1)) % step;
  const gridY = (g.t * 6 * (g.dpr || 1)) % step;
  for (let x = gridX - step; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = gridY - step; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Ambient blobs
  drawAmbientBlobs(ctx, w, h, g);
  drawSpeedField(ctx, g, w, h);

  // Slow effect
  if (slowAmount > 0.01) {
    drawSlowEffect(ctx, w, h, slowAmount);
  }

  // Dash trails
  drawDashTrails(ctx, g);
  drawRings(ctx, g);

  // Power-ups
  drawPowerUps(ctx, g);

  // Enemies
  drawEnemies(ctx, g, slowAmount);
  drawParticles(ctx, g);

  // Player trail
  drawPlayerTrail(ctx, g);

  // Player
  drawPlayer(ctx, g);
  drawCallouts(ctx, g, w, h);

  // Vignette
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

  drawHitFeedback(ctx, g, w, h);
}

function drawAmbientBlobs(ctx, w, h, g) {
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

  blob(w * (0.2 + Math.sin(g.t * 0.13) * 0.05), h * 0.25, 220 * (g.dpr || 1), 0.35, "rgba(124,58,237,0.45)");
  blob(w * 0.78, h * (0.72 + Math.cos(g.t * 0.1) * 0.06), 260 * (g.dpr || 1), 0.28, "rgba(34,211,238,0.42)");
}

function drawSpeedField(ctx, g, w, h) {
  const speed = Math.hypot(g.vx, g.vy);
  if (speed < 80) return;
  const strength = Math.min(1, speed / 900) * 0.22;
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.strokeStyle = "#8be9ff";
  ctx.lineWidth = Math.max(1, g.dpr || 1);
  const angle = Math.atan2(g.vy, g.vx);
  for (let i = 0; i < 18; i++) {
    const seed = i * 73.37;
    const x = (seed * 17 + g.t * -g.vx * 0.16) % (w + 100) - 50;
    const y = (seed * 31 + g.t * -g.vy * 0.16) % (h + 100) - 50;
    const len = 8 + (i % 5) * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(angle) * len, y - Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRings(ctx, g) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const ring of g.rings || []) {
    const p = 1 - ring.life / ring.max;
    ctx.globalAlpha = (1 - p) * 0.75;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = (2.5 - p * 1.5) * (g.dpr || 1);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, (ring.size + p * 100) * (g.dpr || 1), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlowEffect(ctx, w, h, slowAmount) {
  ctx.save();

  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = "#808080";
  ctx.globalAlpha = slowAmount * 1.6;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.globalAlpha = slowAmount * 0.6;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();

  ctx.fillStyle = `rgba(120,150,255,${slowAmount * 0.08})`;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 1.1;
}

function drawDashTrails(ctx, g) {
  for (const d of g.dashTrail) {
    const alpha = d.life / 0.25;

    ctx.globalAlpha = alpha * (1 + (1 - g.timeScale) * 0.4);

    const gradient = ctx.createLinearGradient(d.x1, d.y1, d.x2, d.y2);
    gradient.addColorStop(0, "rgba(34,211,238,0.2)");
    gradient.addColorStop(0.5, "rgba(34, 211, 238, 0.6)");
    gradient.addColorStop(1, "rgb(34, 211, 238)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12 * (g.dpr || 1);
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(d.x1, d.y1);
    ctx.lineTo(d.x2, d.y2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawPowerUps(ctx, g) {
  for (const p of g.powerUps) {
    const base = POWERUP_COLORS[p.type];
    const r = p.r * (g.dpr || 1);

    const pulse = 0.6 + 0.4 * Math.sin(g.t * 4);
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

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Icon
    const icon = POWERUP_ICONS[p.type];

    ctx.save();
    ctx.translate(p.x, p.y);
    const scale = r / 14;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";
    ctx.stroke(icon);

    ctx.restore();
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function desaturateColor(hexColor, amount) {
  const rgb = hexToRgb(hexColor);
  const gray = (rgb.r + rgb.g + rgb.b) / 3;
  const r = Math.round(rgb.r + (gray - rgb.r) * amount);
  const g = Math.round(rgb.g + (gray - rgb.g) * amount);
  const b = Math.round(rgb.b + (gray - rgb.b) * amount);
  return `rgb(${r},${g},${b})`;
}

function drawEnemies(ctx, g, slowAmount = 0) {
  for (const e of g.enemies) {
    let base;
    if (e.attackType === "aggressive") {
      base = ENEMY_COLORS.aggressive;
    } else if (e.attackType === "wavy") {
      base = ENEMY_COLORS.wavy;
    } else if (e.attackType === "orbital") {
      base = ENEMY_COLORS.orbital;
    } else {
      base = ENEMY_COLORS.bouncy;
    }

    // Desaturate colors during slow motion
    if (slowAmount > 0.01) {
      base = desaturateColor(base, slowAmount * 1.5);
    }

    const r = e.r * (g.dpr || 1);
    const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 2.2);
    grd.addColorStop(0, base.replace(")", ",0.55)").replace("rgb", "rgba"));
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(g.t * e.w + e.orbitAngle);
    ctx.fillStyle = base;
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 1.2 * (g.dpr || 1);
    ctx.beginPath();
    const sides = e.attackType === "aggressive" ? 3 : e.attackType === "wavy" ? 6 : e.attackType === "orbital" ? 4 : 5;
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2 - Math.PI / 2;
      const rr = r * (j % 2 ? 0.72 : 1);
      const xx = Math.cos(a) * rr;
      const yy = Math.sin(a) * rr;
      if (!j) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function drawParticles(ctx, g) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of g.particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = p.pick === 1 ? "#fb7185" : p.pick === 2 ? "#fbbf24" : "#67e8f9";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * a * (g.dpr || 1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCallouts(ctx, g, w, h) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `800 ${14 * (g.dpr || 1)}px ui-monospace, monospace`;
  ctx.letterSpacing = "3px";
  if (g.nearMissFlash > 0) {
    ctx.globalAlpha = Math.min(1, g.nearMissFlash * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("CLOSE CALL  +35", g.px, g.py - 38 * (g.dpr || 1));
  }
  if (g.patternFlash > 0 && g.running) {
    const a = Math.min(1, g.patternFlash) * Math.min(1, (2.2 - g.patternFlash) * 3);
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.font = `900 ${18 * (g.dpr || 1)}px ui-monospace, monospace`;
    ctx.fillText("// " + (g.patternIndex + 1).toString().padStart(2, "0") + "  " + (g.patternIndex === 0 ? "WARMUP GRID" : ["", "WAVE BREAK", "ORBIT LOCK", "RICOCHET PULSE", "NEON STORM"][g.patternIndex]), w / 2, h * 0.18);
  }
  ctx.restore();
}

function drawPlayerTrail(ctx, g) {
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < g.playerTrail.length; i++) {
    const t = g.playerTrail[i];

    const lifeRatio = t.life / 0.35;
    const hue = 190 + (1 - lifeRatio) * 60;

    ctx.globalAlpha = lifeRatio * 0.5;
    ctx.fillStyle = `hsl(${hue},100%,60%)`;

    ctx.beginPath();
    ctx.arc(
      t.x,
      t.y,
      g.r * (g.dpr || 1) * (0.5 + lifeRatio * 0.5),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawPlayer(ctx, g) {
  const pr = g.r * (g.dpr || 1);
  const glowCol =
    g.invuln > 0 ? "rgba(251,113,133,0.55)" : "rgba(34,211,238,0.55)";

  const pg = ctx.createRadialGradient(g.px, g.py, 0, g.px, g.py, pr * 4.2);
  pg.addColorStop(0, glowCol);
  pg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(g.px, g.py, pr * 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Shield power-up ring
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

  // Speed power-up ring
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

  // Slow power-up ring
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
}

function drawHitFeedback(ctx, g, w, h) {
  if (!g.hitFlash) return;

  const dpr = g.dpr || 1;
  const progress = Math.min(1, g.hitFlash / 0.85);
  const alpha = Math.sin(progress * Math.PI) * 0.95;

  ctx.save();

  ctx.globalAlpha = alpha * 0.22;
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(251,113,133,0.95)";
  ctx.lineWidth = 8 * dpr;
  ctx.strokeRect(8 * dpr, 8 * dpr, w - 16 * dpr, h - 16 * dpr);

  ctx.restore();
}
