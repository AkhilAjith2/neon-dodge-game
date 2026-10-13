import React, { useEffect, useRef } from "react";
import { GameHUD } from "./components/GameHUD.jsx";
import { GameCanvas } from "./components/GameCanvas.jsx";
import { MobileControls } from "./components/MobileControls.jsx";
import { OverlayCard } from "./components/OverlayCard.jsx";
import { Button } from "./components/Button.jsx";
import { LivesOverlay } from "./components/LivesOverlay.jsx";
import { useGameState } from "./hooks/useGameState.js";
import { useInput } from "./hooks/useInput.js";
import { initAudioContext, setAudioMuted } from "./game/audio.js";
import { drawGame } from "./game/renderer.js";
import { performDash, updateGame } from "./game/gameEngine.js";
import { clamp } from "./game/gameUtils.js";
import { GAME_CONFIG } from "./constants/gameConstants.js";

export default function NeonDodgeGame() {
  const AUDIO_MUTED_STORAGE_KEY = "neon_dodge_audio_muted";
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

  // Load persisted preferences and best score from localStorage
  useEffect(() => {
    const best = Math.floor(
      Number(localStorage.getItem("neon_dodge_best") || 0),
    );
    const isMuted = localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === "true";
    gameRef.current.best = best;
    setUi((u) => ({ ...u, best, isMuted }));
  }, [gameRef, setUi]);

  useEffect(() => {
    localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, String(ui.isMuted));
    setAudioMuted(audioRef.current, ui.isMuted);
  }, [ui.isMuted]);

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
      g.last = 0;
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  const toggleMute = () => {
    setUi((u) => ({ ...u, isMuted: !u.isMuted }));
  };

  const onDash = (g) => {
    performDash(g, audioRef.current);
  };

  const handleInputCallbacks = {
    onStart: start,
    onDash,
    togglePause,
    ui,
  };

  const {
    joystickOffset,
    handleJoyStart,
    handleJoyMove,
    handleJoyEnd,
  } = useInput(wrapRef, gameRef, handleInputCallbacks);

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
    if (
      Math.floor(g.score) !== Math.floor(ui.score) ||
      g.lives !== ui.lives ||
      g.combo !== ui.combo ||
      g.dashReady !== ui.dashReady ||
      g.patternIndex !== ui.patternIndex ||
      g.activePowerUps.length !== ui.activePowerUps.length
    ) {
      setUi((u) => ({
        ...u,
        score: Math.floor(g.score),
        lives: g.lives,
        combo: g.combo,
        dashReady: g.dashReady,
        dashProgress: g.dashReady
          ? 1
          : 1 - g.dashCooldown / g.dashCooldownMax,
        patternIndex: g.patternIndex,
        patternName: GAME_CONFIG.PATTERN_NAMES[g.patternIndex] || "NOVA FLOW",
        activePowerUps: g.activePowerUps.map((p) => ({
          type: p.type,
          progress: p.duration / p.maxDuration,
        })),
      }));
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
    const nextScore = 0;
    const nextLives = GAME_CONFIG.INITIAL_LIVES;

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
    g.lives = nextLives;
    g.invuln = GAME_CONFIG.INVULN_DURATION;

    g.dashCooldown = 0;
    g.dashReady = true;
    g.lastMoveDir = { x: 1, y: 0 };
    g.dashTrail = [];
    g.playerTrail = [];
    g.timeScale = 1;
    g.mode = "freeplay";
    g.patternIndex = 0;
    g.patternElapsed = 0;

    g.enemies = [];
    g.particles = [];
    g.rings = [];
    g.nearMisses = [];
    g.powerUps = [];
    g.activePowerUps = [];
    g.spawnTimer = 0;
    g.powerUpSpawnTimer = 0;
    g.difficulty = 1;

    g.score = nextScore;
    g.combo = 1;
    g.comboTimer = 0;
    g.lastScoreMilestone = 0;

    g.shake = 0;
    g.hitFlash = 0;
    g.chroma = 0;
    g.dashFlash = 0;
    g.nearMissFlash = 0;
    g.patternFlash = 2.4;
    g.lastPatternIndex = 0;

    g.prevTrailX = g.px;
    g.prevTrailY = g.py;

    setUi((u) => ({
      ...u,
      started: true,
      paused: false,
      gameOver: false,
      score: nextScore,
      lives: nextLives,
      combo: 1,
      dashReady: true,
      dashProgress: 1,
      patternIndex: 0,
      patternName: "WARMUP GRID",
      activePowerUps: [],
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
        <GameHUD ui={ui} isMobile={isMobile} onToggleMute={toggleMute} />

        <GameCanvas
          wrapRef={wrapRef}
          canvasRef={canvasRef}
          onRender={handleCanvasResize}
          isModalOpen={
            !ui.started ||
            (ui.started && ui.paused && !ui.gameOver) ||
            ui.gameOver
          }
        >
          {ui.started && !ui.gameOver && (
            <LivesOverlay lives={ui.lives} isMobile={isMobile} />
          )}

          {isTouchDevice && (
            <MobileControls
              joystickOffset={joystickOffset}
              onJoyStart={handleJoyStart}
              onJoyMove={handleJoyMove}
              onJoyEnd={handleJoyEnd}
              onDash={onDash}
              gameRef={gameRef}
            />
          )}

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
                  <div>Shield - Temporary invulnerability</div>
                  <div>Speed - Move faster</div>
                  <div>Slow - Enemies move slower</div>
                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    Dodge incoming orbs, keep moving to build your combo, and
                    adapt as enemy patterns shift over time.
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

          {ui.gameOver && (
            <OverlayCard
              title="Game Over"
              subtitle={`Score: ${ui.score}  -  Best: ${ui.best}`}
              actions={
                <>
                  <Button onClick={start}>Play again</Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setUi((u) => ({
                        ...u,
                        started: false,
                        gameOver: false,
                      }))
                    }
                  >
                    Back to Start
                  </Button>
                </>
              }
            />
          )}
        </GameCanvas>
      </div>
    </div>
  );
}
