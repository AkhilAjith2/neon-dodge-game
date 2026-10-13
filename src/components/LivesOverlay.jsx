import { GAME_CONFIG } from "../constants/gameConstants.js";

export function LivesOverlay({ lives, isMobile }) {
  const lifeSlots = Array.from({ length: GAME_CONFIG.INITIAL_LIVES });

  return (
    <div
      aria-label={`${lives} of ${GAME_CONFIG.INITIAL_LIVES} lives remaining`}
      style={{
        position: "absolute",
        top: isMobile ? 10 : 14,
        left: isMobile ? 10 : 20,
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 5 : 7,
        zIndex: 18,
        pointerEvents: "none",
        opacity: 0.72,
        padding: isMobile ? 2 : 3,
      }}
    >
      {lifeSlots.map((_, index) => {
        const filled = index < lives;

        return (
          <span
            key={index}
            style={{
              width: isMobile ? 21 : 28,
              height: isMobile ? 5 : 6,
              borderRadius: 999,
              transform: "skewX(-18deg)",
              background: filled
                ? "linear-gradient(90deg, rgba(255,255,255,0.72), rgba(251,113,133,0.74) 38%, rgba(225,29,72,0.66))"
                : "rgba(255,255,255,0.075)",
              border: filled
                ? "1px solid rgba(255,255,255,0.42)"
                : "1px solid rgba(255,255,255,0.13)",
              boxShadow: filled
                ? "0 0 10px rgba(251,113,133,0.52), 0 0 18px rgba(225,29,72,0.18)"
                : "inset 0 0 7px rgba(0,0,0,0.28)",
            }}
          />
        );
      })}
    </div>
  );
}
