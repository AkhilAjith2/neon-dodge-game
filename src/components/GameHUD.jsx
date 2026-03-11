import { Pill } from "./Pill.jsx";

export function GameHUD({ ui, isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: isMobile ? "6px 10px" : "12px 20px",
        background: "rgba(0,0,0,0.4)",
        zIndex: 10,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            fontSize: window.innerWidth < 600 ? 16 : 22,
            fontWeight: 800,
            letterSpacing: -0.3,
          }}
        >
          Nova Pulse
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
        <Pill isMobile={isMobile}>
          <>
            <span style={{ opacity: 0.8, fontSize: 13 }}>Score</span>
            <span
              style={{
                fontWeight: 800,
                minWidth: 70,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {ui.score}
            </span>
          </>
        </Pill>
        <Pill isMobile={isMobile}>
          <>
            <span style={{ opacity: 0.8, fontSize: 13 }}>Best</span>
            <span
              style={{
                fontWeight: 800,
                minWidth: 70,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {ui.best}
            </span>
          </>
        </Pill>
        <Pill isMobile={isMobile}>
          <>
            <span style={{ opacity: 0.8, fontSize: 13 }}>Lives</span>
            <span style={{ fontWeight: 800 }}>
              {"●".repeat(Math.max(0, ui.lives))}
            </span>
          </>
        </Pill>
        <Pill isMobile={isMobile}>
          <>
            <span style={{ opacity: 0.8, fontSize: 13 }}>Combo</span>
            <span style={{ fontWeight: 800 }}>x{ui.combo}</span>
          </>
        </Pill>
      </div>
    </div>
  );
}
