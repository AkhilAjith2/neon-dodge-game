// Math utilities
export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// Vector utilities
export function getRandomAngle() {
  return Math.random() * Math.PI * 2;
}

export function normalizeVector(x, y) {
  const mag = Math.hypot(x, y);
  return mag > 0 ? { x: x / mag, y: y / mag } : { x: 0, y: 0 };
}

export function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Point utilities
export function getCanvasPoint(event, canvasRect) {
  const touch = event.touches?.[0];
  const clientX = touch ? touch.clientX : event.clientX;
  const clientY = touch ? touch.clientY : event.clientY;
  return {
    x: clientX - canvasRect.left,
    y: clientY - canvasRect.top,
  };
}
