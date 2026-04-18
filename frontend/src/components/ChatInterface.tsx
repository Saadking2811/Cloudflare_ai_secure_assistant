import { useState, useRef, useEffect } from "react";
import type { ChatMessage, AnalysisMode, AnalyzeResponse } from "../types";
import { analyzeMessage } from "../api";
import { SendIcon, ShieldIcon } from "./Icons";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  mode: AnalysisMode;
}

const EXAMPLE_QUERIES = [
  {
    label: "Brute Force Detection",
    query: "Analyze: IP 103.45.67.89 sent 12,000 requests/min to /login with repeated POST failures",
  },
  {
    label: "DDoS Pattern Analysis",
    query: "Is this traffic pattern a DDoS attack? 50k requests from 103.x.x.x/16 subnet in 2 minutes",
  },
  {
    label: "IP Range Assessment",
    query: "Should I block this IP range? 45.33.32.0/24 — scanning /admin, /wp-login, /.env endpoints",
  },
  {
    label: "Auth Failure Investigation",
    query: "Why am I seeing 500 failed SSH auth attempts from 3 different ASNs in the last hour?",
  },
];

export default function ChatInterface({ messages, setMessages, mode }: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Analyzing security event...",
      timestamp: Date.now(),
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const data: AnalyzeResponse = await analyzeMessage(trimmed, mode);
      const assistantMsg: ChatMessage = {
        id: loadingMsg.id,
        role: "assistant",
        content: data.analysis.explanation,
        timestamp: Date.now(),
        analysis: data.analysis,
        mode: data.mode,
      };
      setMessages((prev) =>
        prev.map((m) => (m.id === loadingMsg.id ? assistantMsg : m))
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: `Error: ${err.message || "Analysis failed. Please try again."}`,
                loading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function useExample(query: string) {
    setInput(query);
    textareaRef.current?.focus();
  }

  const showWelcome = messages.length === 1;

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {showWelcome && (
          <div className="welcome-section">
            <div className="welcome-icon">
              <ShieldIcon size={40} />
            </div>
            <h2 className="welcome-title">Security Intelligence Console</h2>
            <p className="welcome-desc">
              Paste logs, describe incidents, or ask security questions.
              Get AI-powered threat analysis with explainable reasoning.
            </p>
            <div className="examples-grid">
              {EXAMPLE_QUERIES.map((ex, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => useExample(ex.query)}
                >
                  <span className="example-label">{ex.label}</span>
                  <span className="example-text">{ex.query}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a security event, paste logs, or ask a question..."
            rows={1}
            disabled={isLoading}
            aria-label="Security analysis input"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || isLoading}
            title="Send for analysis"
          >
            {isLoading ? (
              <span className="spinner" />
            ) : (
              <SendIcon size={18} />
            )}
          </button>
        </div>
        <div className="chat-input-hint">
          Enter to send &middot; Shift+Enter for new line &middot; Mode: <strong>{mode}</strong>
        </div>
      </form>
    </div>
  );
}
