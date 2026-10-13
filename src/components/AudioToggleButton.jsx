import { AUDIO_ICONS } from "../constants/gameConstants.js";

export function AudioToggleButton({ onClick, isMuted }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: "4px 4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        transition: "all 120ms ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      title={isMuted ? "Unmute" : "Mute"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isMuted ? (
          <>
            {/* Speaker body */}
            <path d="M3 9v6h4l5 5V4L7 9H3z" />
            {/* Mute slash */}
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <>
            {/* Speaker body */}
            <path d="M3 9v6h4l5 5V4L7 9H3z" />
            {/* Sound waves */}
            <path d="M16 7a5 5.5 0 010 10" />
            <path d="M20 5a9 9 0 010 14" />
          </>
        )}
      </svg>
    </button>
  );
}
