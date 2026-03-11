export function OverlayCard({ title, subtitle, actions }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "min(520px, calc(100% - 24px))",
          borderRadius: 22,
          padding: window.innerWidth < 600 ? 14 : 18,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            fontSize: window.innerWidth < 600 ? 18 : 22,
            fontWeight: 900,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 8,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.5,
            fontSize: window.innerWidth < 600 ? 13 : 15,
            wordBreak: "break-word",
          }}
        >
          {subtitle}
        </div>

        <div
          style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}
        >
          {actions}
        </div>
      </div>
    </div>
  );
}
