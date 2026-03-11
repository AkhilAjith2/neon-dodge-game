export function Pill({ children, isMobile }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isMobile ? 6 : 10,
        padding: isMobile ? "6px 8px" : "10px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        fontSize: isMobile ? 12 : 14,
      }}
    >
      {children}
    </div>
  );
}
