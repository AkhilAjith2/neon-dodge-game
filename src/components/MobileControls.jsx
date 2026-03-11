export function MobileControls({
  joystickRef,
  onJoyStart,
  onJoyMove,
  onJoyEnd,
  onDash,
  gameRef,
}) {
  return (
    <>
      {/* Joystick */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)",
          touchAction: "none",
        }}
        onTouchStart={onJoyStart}
        onTouchMove={onJoyMove}
        onTouchEnd={onJoyEnd}
      >
        <div
          style={{
            position: "absolute",
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            transform: `translate(${joystickRef.current.x + 35}px, ${
              joystickRef.current.y + 35
            }px)`,
          }}
        />
      </div>

      {/* Dash Button */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 40,
        }}
      >
        <button
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.08)",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            cursor: "pointer",
          }}
          onTouchStart={() => onDash(gameRef.current)}
        >
          DASH
        </button>
      </div>
    </>
  );
}
