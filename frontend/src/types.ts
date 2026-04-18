// ── Frontend Shared Types ──

export interface SecurityAnalysis {
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  attack_type: string;
  confidence: number;
  explanation: string;
  technical_details?: string;
  recommendation: string[];
  false_positive_notes?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  analysis?: SecurityAnalysis;
  mode?: "simple" | "engineer";
  loading?: boolean;
}

export interface AnalyzeResponse {
  analysis: SecurityAnalysis;
  mode: "simple" | "engineer";
  context_used: boolean;
  ips_detected: string[];
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

export interface DashboardData {
  active_threats: number;
  total_incidents_24h: number;
  risk_score: number;
  top_attacking_ips: { ip: string; count: number; last_seen: number }[];
  recent_incidents: IncidentRecord[];
  threat_timeline: { hour: string; count: number; severity: string }[];
  attack_type_distribution: { type: string; count: number }[];
}

export type AnalysisMode = "simple" | "engineer";
export type ViewMode = "chat" | "dashboard";
