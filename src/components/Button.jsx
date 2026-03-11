export function Button({ children, onClick, variant = "primary" }) {
  const styles =
    variant === "primary"
      ? {
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(34,211,238,0.9))",
          border: "1px solid rgba(255,255,255,0.16)",
          color: "rgba(255,255,255,0.95)",
        }
      : {
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.92)",
        };

  return (
    <button
      onClick={onClick}
      style={{
        ...styles,
        cursor: "pointer",
        padding: "12px 14px",
        borderRadius: 14,
        fontWeight: 700,
        letterSpacing: 0.2,
        boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
        transform: "translateY(0px)",
        transition: "transform 120ms ease, filter 120ms ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.transform = "translateY(0px)")
      }
    >
      {children}
    </button>
  );
}
