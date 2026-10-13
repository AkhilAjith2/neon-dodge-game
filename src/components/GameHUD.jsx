import { AudioToggleButton } from "./AudioToggleButton.jsx";

export function GameHUD({ ui, isMobile, onToggleMute }) {
  return (
    <header className="game-hud">
      <div className="brand-lockup">
        <span className="brand-mark"><i /><i /><i /></span>
        <div>
          <div className="brand-name">NOVA <b>PULSE</b></div>
          {!isMobile && <div className="brand-sub">KINETIC SURVIVAL SYSTEM</div>}
        </div>
      </div>
      <div className="run-data">
        {!isMobile && <div className="phase"><span>PHASE {String((ui.patternIndex || 0) + 1).padStart(2, "0")}</span><b>{ui.patternName}</b></div>}
        <div className="stat"><span>SCORE</span><b>{String(ui.score).padStart(6, "0")}</b></div>
        {!isMobile && <div className="stat dim"><span>PERSONAL BEST</span><b>{String(ui.best).padStart(6, "0")}</b></div>}
        <div className={`combo ${ui.combo > 4 ? "hot" : ""}`}><span>FLOW</span><b>×{ui.combo}</b></div>
        <AudioToggleButton onClick={onToggleMute} isMuted={ui.isMuted} />
      </div>
      <div className="hud-progress" style={{ transform: `scaleX(${ui.dashProgress ?? 1})` }} />
    </header>
  );
}
