// ── Cloudflare Worker Entry Point ──
// API Gateway for AI Security Assistant

import { analyzeSecurityEvent, extractIPs, extractEndpoints } from "./ai-engine";
import type { AnalyzeRequest, Env, IncidentRecord } from "./types";

export { IncidentMemory } from "./incident-memory";

function corsHeaders(origin: string, allowedOrigins?: string): Record<string, string> {
  const allowed = allowedOrigins?.split(",").map((o) => o.trim()) || ["*"];
  const isAllowed = allowed.includes("*") || allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data: unknown, status = 200, origin = "*", env?: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin, env?.ALLOWED_ORIGINS),
    },
  });
}

function getMemoryStub(env: Env): DurableObjectStub {
  const id = env.INCIDENT_MEMORY.idFromName("global");
  return env.INCIDENT_MEMORY.get(id);
}

async function handleAnalyze(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const body: AnalyzeRequest = await request.json();

  if (!body.message || typeof body.message !== "string") {
    return jsonResponse({ error: "Message is required" }, 400, origin, env);
  }

  // Limit message size to prevent abuse
  if (body.message.length > 10000) {
    return jsonResponse({ error: "Message too long (max 10000 chars)" }, 400, origin, env);
  }

  const mode = body.mode === "simple" ? "simple" : "engineer";

  // Extract IPs for context lookup
  const ips = extractIPs(body.message);
  const endpoints = extractEndpoints(body.message);

  // Get incident context from Durable Object
  let incidentContext: string | undefined;
  if (ips.length > 0) {
    try {
      const stub = getMemoryStub(env);
      const contextResp = await stub.fetch(
        new Request(`https://memory/context?ips=${ips.join(",")}`)
      );
      const ctxData = (await contextResp.json()) as {
        context: string | null;
        flaggedIPs: string[];
      };
      incidentContext = ctxData.context || undefined;
    } catch {
      // Continue without context
    }
  }

  // Run AI analysis
  const analysis = await analyzeSecurityEvent(
    env.AI,
    body.message,
    mode,
    incidentContext
  );

  // Record incident if risk is MEDIUM or higher
  const riskThreshold = ["CRITICAL", "HIGH", "MEDIUM"];
  if (riskThreshold.includes(analysis.risk_level)) {
    try {
      const stub = getMemoryStub(env);
      const incident: Partial<IncidentRecord> = {
        ip: ips[0] || "unknown",
        attack_type: analysis.attack_type,
        risk_level: analysis.risk_level,
        endpoint: endpoints[0],
        analysis,
      };
      await stub.fetch(
        new Request("https://memory/record", {
          method: "POST",
          body: JSON.stringify(incident),
        })
      );
    } catch {
      // Non-critical: continue even if recording fails
    }
  }

  return jsonResponse(
    {
      analysis,
      mode,
      context_used: !!incidentContext,
      ips_detected: ips,
    },
    200,
    origin,
    env
  );
}

async function handleDashboard(env: Env, origin: string): Promise<Response> {
  const stub = getMemoryStub(env);
  const resp = await stub.fetch(new Request("https://memory/dashboard"));
  const data = await resp.json();
  return jsonResponse(data, 200, origin, env);
}

async function handleIncidents(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") || "50";
  const offset = url.searchParams.get("offset") || "0";
  const stub = getMemoryStub(env);
  const resp = await stub.fetch(
    new Request(`https://memory/incidents?limit=${limit}&offset=${offset}`)
  );
  const data = await resp.json();
  return jsonResponse(data, 200, origin, env);
}

async function handleResolve(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const body = (await request.json()) as { id: string };
  if (!body.id) {
    return jsonResponse({ error: "Incident ID is required" }, 400, origin, env);
  }
  const stub = getMemoryStub(env);
  const resp = await stub.fetch(
    new Request("https://memory/resolve", {
      method: "POST",
      body: JSON.stringify({ id: body.id }),
    })
  );
  const data = await resp.json();
  return jsonResponse(data, resp.status, origin, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, env.ALLOWED_ORIGINS),
      });
    }

    try {
      // API routing
      if (url.pathname === "/api/analyze" && request.method === "POST") {
        return handleAnalyze(request, env, origin);
      }
      if (url.pathname === "/api/dashboard" && request.method === "GET") {
        return handleDashboard(env, origin);
      }
      if (url.pathname === "/api/incidents" && request.method === "GET") {
        return handleIncidents(request, env, origin);
      }
      if (url.pathname === "/api/incidents/resolve" && request.method === "POST") {
        return handleResolve(request, env, origin);
      }
      if (url.pathname === "/api/health") {
        return jsonResponse({ status: "ok", timestamp: Date.now() }, 200, origin, env);
      }

      return jsonResponse({ error: "Not found" }, 404, origin, env);
    } catch (err: any) {
      console.error("Worker error:", err);
      return jsonResponse(
        { error: "Internal server error" },
        500,
        origin,
        env
      );
    }
  },
};
