import type { AnalysisMode, ViewMode } from "../types";
import { ShieldIcon, ChatIcon, DashboardIcon, EyeIcon, SlidersIcon } from "./Icons";

interface HeaderProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  mode: AnalysisMode;
  setMode: (m: AnalysisMode) => void;
}

export default function Header({ view, setView, mode, setMode }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <ShieldIcon size={22} />
        </div>
        <div className="header-brand">
          <h1 className="header-title">Sentinel</h1>
          <span className="header-subtitle">AI Threat Intelligence</span>
        </div>
        <span className="header-badge">EDGE</span>
      </div>
      <nav className="header-center">
        <button
          className={`tab-btn ${view === "chat" ? "active" : ""}`}
          onClick={() => setView("chat")}
        >
          <ChatIcon size={15} />
          <span>Analysis</span>
        </button>
        <button
          className={`tab-btn ${view === "dashboard" ? "active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          <DashboardIcon size={15} />
          <span>Dashboard</span>
        </button>
      </nav>
      <div className="header-right">
        <div className="mode-toggle" role="group" aria-label="Analysis mode">
          <button
            className={`mode-btn ${mode === "simple" ? "active" : ""}`}
            onClick={() => setMode("simple")}
            title="Non-technical explanations"
          >
            <EyeIcon size={13} />
            Simple
          </button>
          <button
            className={`mode-btn ${mode === "engineer" ? "active" : ""}`}
            onClick={() => setMode("engineer")}
            title="Technical breakdown with attack vectors"
          >
            <SlidersIcon size={13} />
            Engineer
          </button>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span className="status-text">Online</span>
        </div>
      </div>
    </header>
  );
}
