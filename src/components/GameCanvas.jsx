import { useRef, useEffect } from "react";

export function GameCanvas({
  wrapRef,
  canvasRef,
  onRender,
  isTouchDevice,
  children,
}) {
  // Resize canvas to container
  useEffect(() => {
    const el = wrapRef.current;
    const c = canvasRef.current;
    if (!el || !c) return;

    const resize = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      const targetW = rect.width;
      const targetH = rect.height;

      c.width = Math.floor(targetW * dpr);
      c.height = Math.floor(targetH * dpr);
      c.style.width = `${targetW}px`;
      c.style.height = `${targetH}px`;

      // Notify parent of new dimensions
      onRender?.({ width: c.width, height: c.height, dpr });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener("resize", resize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [wrapRef, canvasRef, onRender]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        touchAction: "none",
        borderRadius: 0,
        overflow: "hidden",
        border: "none",
        background: "transparent",
        boxShadow: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {children}
    </div>
  );
}
