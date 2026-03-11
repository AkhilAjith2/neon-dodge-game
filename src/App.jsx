import React, { useEffect, useRef } from "react";
import { GameHUD } from "./components/GameHUD.jsx";
import { GameCanvas } from "./components/GameCanvas.jsx";
import { MobileControls } from "./components/MobileControls.jsx";
import { OverlayCard } from "./components/OverlayCard.jsx";
import { Button } from "./components/Button.jsx";
import { useGameState } from "./hooks/useGameState.js";
import { useInput } from "./hooks/useInput.js";
import { initAudioContext, playSound } from "./game/audio.js";
import { drawGame } from "./game/renderer.js";
import {
  performDash,
  activatePowerUp,
  updateGame,
  spawnEnemy,
} from "./game/gameEngine.js";
import { clamp } from "./game/gameUtils.js";
import { GAME_CONFIG } from "./constants/gameConstants.js";

export default function NeonDodgeGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const audioRef = useRef(null);

  const isMobile = window.innerWidth < 600;
  const mobileScale = isMobile ? 0.7 : 1;

  const { gameRef, ui, setUi } = useGameState();

  const [isTouchDevice, setIsTouchDevice] = React.useState(
    typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouchDevice(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Initialize audio
  useEffect(() => {
    audioRef.current = initAudioContext();
  }, []);

  // Load best score from localStorage
  useEffect(() => {
    const best = Math.floor(
      Number(localStorage.getItem("neon_dodge_best") || 0),
    );
    gameRef.current.best = best;
    setUi((u) => ({ ...u, best }));
  }, []);

  const start = () => {
    cancelAnimationFrame(rafRef.current);
    resetGame();
    rafRef.current = requestAnimationFrame(loop);
  };

  const togglePause = () => {
    const g = gameRef.current;
    if (!g.running) return;

    g.paused = !g.paused;
    setUi((u) => ({ ...u, paused: g.paused }));

    if (!g.paused) {
      g.last = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  const onDash = (g) => {
    performDash(g, audioRef.current, mobileScale);
  };

  const handleInputCallbacks = {
    onStart: start,
    onDash,
    togglePause,
    ui,
  };

  const { joystickRef, handleJoyStart, handleJoyMove, handleJoyEnd } = useInput(
    wrapRef,
    gameRef,
    handleInputCallbacks,
  );

  const loop = (now) => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    if (!g.running) {
      drawGame(ctx, g);
      return;
    }
    if (g.paused) {
      drawGame(ctx, g);
      return;
    }

    const last = g.last || now;
    let dt = (now - last) / 1000;
    g.last = now;

    dt = clamp(dt, 0, 0.033);
    g.dt = dt;
    g.t += dt;

    updateGame(dt, g, setUi, ui, audioRef.current);
    drawGame(ctx, g);

    // Sync UI throttled
    if (Math.floor(g.score) !== Math.floor(ui.score)) {
      setUi((u) => ({ ...u, score: Math.floor(g.score) }));
    }

    // Check for game over from collision
    if (g.lives <= 0 && g.running) {
      handleGameOver();
      return;
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  const resetGame = () => {
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
    g.r = GAME_CONFIG.PLAYER_RADIUS * mobileScale;
    g.lives = GAME_CONFIG.INITIAL_LIVES;
    g.invuln = GAME_CONFIG.INVULN_DURATION;

    g.dashCooldown = 0;
    g.dashReady = true;
    g.lastMoveDir = { x: 1, y: 0 };
    g.dashTrail = [];
    g.playerTrail = [];
    g.timeScale = 1;

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

    g.prevTrailX = g.px;
    g.prevTrailY = g.py;

    setUi((u) => ({
      ...u,
      started: true,
      paused: false,
      gameOver: false,
      score: 0,
      lives: GAME_CONFIG.INITIAL_LIVES,
      combo: 1,
    }));
  };

  const handleGameOver = () => {
    const g = gameRef.current;
    g.running = false;

    if (g.score > g.best) {
      g.best = Math.floor(g.score);
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
  };

  const handleCanvasResize = ({ width, height, dpr }) => {
    const g = gameRef.current;
    g.w = width;
    g.h = height;
    g.dpr = dpr;

    if (!g.running && !ui.started) {
      g.px = width * 0.5;
      g.py = height * 0.5;
    }

    // Draw initial state
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      if (ctx) {
        drawGame(ctx, g);
      }
    }
  };

  return (
    <div
      style={{
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        background:
          "radial-gradient(1200px 600px at 30% 20%, rgba(124,58,237,0.18), transparent 50%), radial-gradient(900px 600px at 80% 75%, rgba(34,211,238,0.16), transparent 55%), #060612",
        color: "rgba(255,255,255,0.92)",
        padding: 0,
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingTop: "env(safe-area-inset-top)",
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
        <GameHUD ui={ui} isMobile={isMobile} />

        <GameCanvas
          wrapRef={wrapRef}
          canvasRef={canvasRef}
          onRender={handleCanvasResize}
          isTouchDevice={isTouchDevice}
        >
          {/* Mobile Joystick */}
          {isTouchDevice && (
            <MobileControls
              joystickRef={joystickRef}
              onJoyStart={handleJoyStart}
              onJoyMove={handleJoyMove}
              onJoyEnd={handleJoyEnd}
              onDash={onDash}
              gameRef={gameRef}
            />
          )}

          {/* Start overlay */}
          {!ui.started && (
            <OverlayCard
              title="Nova Pulse"
              subtitle={
                <div style={{ lineHeight: 1.6 }}>
                  <div>
                    <strong>Move:</strong> WASD or Arrow Keys
                  </div>
                  <div>
                    <strong>Dash:</strong> Press SPACE
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Power-Ups</strong>
                  </div>
                  <div>🛡 Shield - Temporary invulnerability</div>
                  <div>⚡ Speed - Move faster</div>
                  <div>❄ Slow - Enemies move slower</div>
                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    Dodge incoming orbs and keep moving to build your combo.
                  </div>
                </div>
              }
              actions={
                <>
                  <Button onClick={start}>Start</Button>
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
                </>
              }
            />
          )}
        </GameCanvas>
      </div>
    </div>
  );
}
