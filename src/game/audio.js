import { SOUND_TYPES } from "../constants/gameConstants.js";

export function initAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

export function playSound(audioContext, type) {
  try {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    if (type === SOUND_TYPES.DASH) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "triangle";

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === SOUND_TYPES.SPEED) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sawtooth";

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === SOUND_TYPES.SLOW) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "triangle";

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === SOUND_TYPES.SHIELD) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sine";

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === SOUND_TYPES.HIT) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sine";

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (e) {
    // Audio context not available
  }
}
