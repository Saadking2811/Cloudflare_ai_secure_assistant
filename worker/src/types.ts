// ── Shared Types for AI Security Assistant ──

export interface SecurityAnalysis {
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  attack_type: string;
  confidence: number;
  explanation: string;
  technical_details?: string;
  recommendation: string[];
  false_positive_notes?: string;
  related_incidents?: IncidentSummary[];
}

export interface IncidentSummary {
  id: string;
  timestamp: number;
  ip: string;
  attack_type: string;
  risk_level: string;
}

export interface IncidentRecord {
  id: string;
  timestamp: number;
  ip: string;
  attack_type: string;
  risk_level: string;
  endpoint?: string;
  request_count?: number;
  analysis: SecurityAnalysis;
  resolved: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  analysis?: SecurityAnalysis;
}

export interface AnalyzeRequest {
  message: string;
  mode: "simple" | "engineer";
  context?: {
    logs?: string;
    ip?: string;
    endpoint?: string;
  };
}

export interface DashboardData {
  active_threats: number;
  total_incidents_24h: number;
  risk_score: number;
  top_attacking_ips: { ip: string; count: number; last_seen: number }[];
  recent_incidents: IncidentRecord[];
  threat_timeline: { hour: string; count: number; severity: string }[];
  attack_type_distribution: { type: string; count: number }[];
}

export interface Env {
  AI: Ai;
  INCIDENT_MEMORY: DurableObjectNamespace;
  ALLOWED_ORIGINS?: string;
}
