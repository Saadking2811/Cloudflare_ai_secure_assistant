import { useState } from "react";
import type { ChatMessage, AnalysisMode, ViewMode } from "./types";
import ChatInterface from "./components/ChatInterface";
import SecurityDashboard from "./components/SecurityDashboard";
import Header from "./components/Header";

export default function App() {
  const [view, setView] = useState<ViewMode>("chat");
  const [mode, setMode] = useState<AnalysisMode>("engineer");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Sentinel is online. Submit traffic logs, describe incidents, or ask security questions for real-time AI-powered threat analysis.",
      timestamp: Date.now(),
    },
  ]);

  return (
    <div className="app">
      <Header
        view={view}
        setView={setView}
        mode={mode}
        setMode={setMode}
      />
      <main className="app-main">
        {view === "chat" ? (
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            mode={mode}
          />
        ) : (
          <SecurityDashboard />
        )}
      </main>
    </div>
  );
}
