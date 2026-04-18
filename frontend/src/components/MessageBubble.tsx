import type { ChatMessage } from "../types";
import { UserIcon, ShieldIcon } from "./Icons";
import AnalysisCard from "./AnalysisCard";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      <div className={`message-avatar ${isUser ? "avatar-user" : "avatar-ai"}`}>
        {isUser ? <UserIcon size={16} /> : <ShieldIcon size={16} />}
      </div>
      <div className="message-body">
        <div className="message-meta">
          <span className="message-role">{isUser ? "You" : "Sentinel AI"}</span>
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.mode && (
            <span className="message-mode-badge">{message.mode}</span>
          )}
        </div>
        {message.loading ? (
          <div className="message-content loading-pulse">
            <span className="loading-dots">
              <span /><span /><span />
            </span>
            Analyzing security event...
          </div>
        ) : (
          <>
            <div className="message-content">{message.content}</div>
            {message.analysis && <AnalysisCard analysis={message.analysis} />}
          </>
        )}
      </div>
    </div>
  );
}
