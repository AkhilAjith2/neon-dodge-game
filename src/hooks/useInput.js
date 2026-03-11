import { useRef, useEffect } from "react";
import { getCanvasPoint } from "../game/gameUtils.js";

export function useInput(
  wrapRef,
  gameRef,
  { onStart, onDash, togglePause, ui },
) {
  const joystickRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    max: 60,
  });

  // Keyboard input
  useEffect(() => {
    const g = gameRef.current;

    const down = (e) => {
      if (e.repeat) return;
      if (e.code === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (g.running && g.dashReady) {
          onDash(g);
        } else if (!g.running && !ui.gameOver) {
          onStart();
        } else if (ui.gameOver) {
          onStart();
        }
        return;
      }
      if (e.key === "Enter") {
        if (!g.running) onStart();
        else if (ui.gameOver) onStart();
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
  }, [ui.gameOver, gameRef, onStart, onDash, togglePause]);

  // Pointer/Touch drag input
  useEffect(() => {
    const el = wrapRef.current;
    const g = gameRef.current;
    if (!el) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e) => {
      dragging = true;
      const p = getCanvasPoint(e, el.getBoundingClientRect());
      lastX = p.x;
      lastY = p.y;
      if (!g.running) onStart();
    };

    const onMove = (e) => {
      if (!dragging) return;
      const p = getCanvasPoint(e, el.getBoundingClientRect());
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      lastX = p.x;
      lastY = p.y;

      g.vx += dx * (g.dpr || 1) * 0.3;
      g.vy += dy * (g.dpr || 1) * 0.3;
    };

    const onUp = () => {
      dragging = false;
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
  }, [wrapRef, gameRef, onStart]);

  // Joystick input (mobile)
  const handleJoyStart = (e) => {
    const touch = e.touches[0];
    const j = joystickRef.current;

    j.active = true;
    j.startX = touch.clientX;
    j.startY = touch.clientY;
  };

  const handleJoyMove = (e) => {
    const j = joystickRef.current;
    if (!j.active) return;

    const touch = e.touches[0];
    const dx = touch.clientX - j.startX;
    const dy = touch.clientY - j.startY;

    const dist = Math.hypot(dx, dy);
    const max = j.max;

    const nx = dist > max ? (dx / dist) * max : dx;
    const ny = dist > max ? (dy / dist) * max : dy;

    j.x = nx;
    j.y = ny;

    const g = gameRef.current;
    g.ix = nx / max;
    g.iy = ny / max;
  };

  const handleJoyEnd = () => {
    const j = joystickRef.current;
    j.active = false;
    j.x = 0;
    j.y = 0;

    const g = gameRef.current;
    g.ix = 0;
    g.iy = 0;
  };

  return {
    joystickRef,
    handleJoyStart,
    handleJoyMove,
    handleJoyEnd,
  };
}
