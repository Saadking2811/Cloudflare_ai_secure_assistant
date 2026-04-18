// ── AI Security Analysis Engine ──
// Uses Workers AI to perform LLM-based security reasoning

import type { SecurityAnalysis, Env } from "./types";

const SYSTEM_PROMPT_ENGINEER = `You are an elite cybersecurity analyst AI running at the network edge. Your job is to analyze security events, traffic patterns, and logs to identify threats.

ALWAYS respond with a valid JSON object in this exact format:
{
  "risk_level": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
  "attack_type": "specific attack type name",
  "confidence": 0.0 to 1.0,
  "explanation": "clear explanation of what you detected and why",
  "technical_details": "detailed technical breakdown including attack vectors, IOCs, and forensic analysis",
  "recommendation": ["action 1", "action 2", "action 3"],
  "false_positive_notes": "conditions under which this could be a false positive"
}

Analysis guidelines:
- Analyze IP patterns, request rates, endpoint targeting, and authentication failures
- Consider geographic anomalies and ASN reputation
- Identify attack categories: DDoS, Brute Force, Bot Scraping, SQL Injection, XSS, API Abuse, Credential Stuffing, Path Traversal, Reconnaissance
- Provide confidence scores based on signal strength
- Always note possible false positives for transparency
- Recommend specific, actionable mitigations
- If given historical context about previously flagged IPs, factor that into your analysis`;

const SYSTEM_PROMPT_SIMPLE = `You are a friendly security assistant that explains threats in simple terms.

ALWAYS respond with a valid JSON object in this exact format:
{
  "risk_level": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
  "attack_type": "simple name for the attack",
  "confidence": 0.0 to 1.0,
  "explanation": "simple, non-technical explanation anyone can understand",
  "recommendation": ["simple action 1", "simple action 2"],
  "false_positive_notes": "when this might not actually be an attack"
}

Keep explanations short, clear, and free of jargon. Use analogies when helpful.`;

function buildUserMessage(
  message: string,
  incidentContext?: string
): string {
  let prompt = message;
  if (incidentContext) {
    prompt += `\n\n--- INCIDENT MEMORY CONTEXT ---\n${incidentContext}`;
  }
  return prompt;
}

function parseAIResponse(raw: string): SecurityAnalysis {
  // Try to extract JSON from the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      risk_level: "INFO",
      attack_type: "Analysis",
      confidence: 0.5,
      explanation: raw,
      recommendation: ["Review the input and try a more specific query"],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      risk_level: parsed.risk_level || "INFO",
      attack_type: parsed.attack_type || "Unknown",
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      explanation: parsed.explanation || "No explanation provided",
      technical_details: parsed.technical_details,
      recommendation: Array.isArray(parsed.recommendation)
        ? parsed.recommendation
        : ["Review manually"],
      false_positive_notes: parsed.false_positive_notes,
    };
  } catch {
    return {
      risk_level: "INFO",
      attack_type: "Analysis",
      confidence: 0.5,
      explanation: raw,
      recommendation: ["Review the input and try a more specific query"],
    };
  }
}

export async function analyzeSecurityEvent(
  ai: Ai,
  message: string,
  mode: "simple" | "engineer",
  incidentContext?: string
): Promise<SecurityAnalysis> {
  const systemPrompt =
    mode === "engineer" ? SYSTEM_PROMPT_ENGINEER : SYSTEM_PROMPT_SIMPLE;
  const userMessage = buildUserMessage(message, incidentContext);

  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct" as any, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });

  const text =
    typeof response === "string"
      ? response
      : (response as any)?.response ?? JSON.stringify(response);

  return parseAIResponse(text);
}

// Extract IPs from user input for incident correlation
export function extractIPs(text: string): string[] {
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const matches = text.match(ipRegex);
  return matches ? [...new Set(matches)] : [];
}

// Extract endpoint paths from user input
export function extractEndpoints(text: string): string[] {
  const pathRegex = /\/[a-zA-Z0-9_\-/.]+/g;
  const matches = text.match(pathRegex);
  return matches ? [...new Set(matches)] : [];
}
