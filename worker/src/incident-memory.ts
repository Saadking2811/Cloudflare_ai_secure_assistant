// ── Incident Memory Durable Object ──
// Persists security incidents, flagged IPs, and attack patterns at the edge

import type { IncidentRecord, DashboardData, IncidentSummary } from "./types";

interface StoredState {
  incidents: IncidentRecord[];
  flaggedIPs: Map<string, { count: number; last_seen: number; types: string[] }>;
}

export class IncidentMemory implements DurableObject {
  private state: DurableObjectState;
  private incidents: IncidentRecord[] = [];
  private flaggedIPs: Map<
    string,
    { count: number; last_seen: number; types: string[] }
  > = new Map();
  private initialized = false;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async init() {
    if (this.initialized) return;
    const stored = await this.state.storage.get<IncidentRecord[]>("incidents");
    this.incidents = stored || [];
    const ips = await this.state.storage.get<
      [string, { count: number; last_seen: number; types: string[] }][]
    >("flaggedIPs");
    this.flaggedIPs = new Map(ips || []);
    this.initialized = true;
  }

  private async persist() {
    await this.state.storage.put("incidents", this.incidents);
    await this.state.storage.put(
      "flaggedIPs",
      Array.from(this.flaggedIPs.entries())
    );
  }

  async fetch(request: Request): Promise<Response> {
    await this.init();
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/record" && request.method === "POST") {
      return this.recordIncident(request);
    }
    if (path === "/context") {
      return this.getContext(request);
    }
    if (path === "/dashboard") {
      return this.getDashboard();
    }
    if (path === "/incidents") {
      return this.getIncidents(url);
    }
    if (path === "/resolve" && request.method === "POST") {
      return this.resolveIncident(request);
    }
    if (path === "/cleanup" && request.method === "POST") {
      return this.cleanup();
    }

    return new Response("Not found", { status: 404 });
  }

  private async recordIncident(request: Request): Promise<Response> {
    const incident: IncidentRecord = await request.json();

    // Assign ID and timestamp if missing
    incident.id = incident.id || crypto.randomUUID();
    incident.timestamp = incident.timestamp || Date.now();
    incident.resolved = false;

    this.incidents.push(incident);

    // Track flagged IPs
    if (incident.ip) {
      const existing = this.flaggedIPs.get(incident.ip) || {
        count: 0,
        last_seen: 0,
        types: [],
      };
      existing.count++;
      existing.last_seen = incident.timestamp;
      if (!existing.types.includes(incident.attack_type)) {
        existing.types.push(incident.attack_type);
      }
      this.flaggedIPs.set(incident.ip, existing);
    }

    // Keep max 500 incidents
    if (this.incidents.length > 500) {
      this.incidents = this.incidents.slice(-500);
    }

    await this.persist();
    return Response.json({ success: true, id: incident.id });
  }

  private async getContext(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ips = url.searchParams.get("ips")?.split(",") || [];
    const contextParts: string[] = [];

    for (const ip of ips) {
      const flagged = this.flaggedIPs.get(ip.trim());
      if (flagged) {
        const timeAgo = Math.round(
          (Date.now() - flagged.last_seen) / 60000
        );
        contextParts.push(
          `IP ${ip}: previously flagged ${flagged.count} time(s), ` +
            `last seen ${timeAgo} minutes ago, ` +
            `associated attacks: ${flagged.types.join(", ")}`
        );
      }
    }

    // Recent relevant incidents
    const recentIncidents = this.incidents
      .filter((i) => Date.now() - i.timestamp < 24 * 60 * 60 * 1000)
      .slice(-10)
      .map(
        (i) =>
          `[${new Date(i.timestamp).toISOString()}] ${i.attack_type} from ${i.ip} → ${i.endpoint || "unknown"} (${i.risk_level})`
      );

    if (recentIncidents.length > 0) {
      contextParts.push(
        `Recent 24h incidents:\n${recentIncidents.join("\n")}`
      );
    }

    return Response.json({
      context: contextParts.length > 0 ? contextParts.join("\n\n") : null,
      flaggedIPs: ips
        .filter((ip) => this.flaggedIPs.has(ip.trim()))
        .map((ip) => ip.trim()),
    });
  }

  private async getDashboard(): Promise<Response> {
    const now = Date.now();
    const last24h = this.incidents.filter(
      (i) => now - i.timestamp < 24 * 60 * 60 * 1000
    );
    const activeThreats = last24h.filter((i) => !i.resolved);

    // Risk score: weighted by severity
    const riskWeights: Record<string, number> = {
      CRITICAL: 10,
      HIGH: 7,
      MEDIUM: 4,
      LOW: 1,
      INFO: 0,
    };
    const riskScore = Math.min(
      100,
      activeThreats.reduce(
        (sum, i) => sum + (riskWeights[i.risk_level] || 0),
        0
      )
    );

    // Top attacking IPs
    const ipCounts = new Map<string, { count: number; last_seen: number }>();
    for (const inc of last24h) {
      if (!inc.ip) continue;
      const existing = ipCounts.get(inc.ip) || { count: 0, last_seen: 0 };
      existing.count++;
      existing.last_seen = Math.max(existing.last_seen, inc.timestamp);
      ipCounts.set(inc.ip, existing);
    }
    const topIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([ip, data]) => ({ ip, ...data }));

    // Timeline (hourly)
    const timeline: { hour: string; count: number; severity: string }[] = [];
    for (let h = 23; h >= 0; h--) {
      const hourStart = now - h * 60 * 60 * 1000;
      const hourEnd = hourStart + 60 * 60 * 1000;
      const hourIncidents = last24h.filter(
        (i) => i.timestamp >= hourStart && i.timestamp < hourEnd
      );
      const maxSeverity =
        hourIncidents.reduce((max, i) => {
          const w = riskWeights[i.risk_level] || 0;
          return w > (riskWeights[max] || 0) ? i.risk_level : max;
        }, "INFO") || "INFO";
      timeline.push({
        hour: new Date(hourStart).toISOString().slice(11, 16),
        count: hourIncidents.length,
        severity: maxSeverity,
      });
    }

    // Attack type distribution
    const typeCounts = new Map<string, number>();
    for (const inc of last24h) {
      typeCounts.set(
        inc.attack_type,
        (typeCounts.get(inc.attack_type) || 0) + 1
      );
    }
    const attackTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    const dashboard: DashboardData = {
      active_threats: activeThreats.length,
      total_incidents_24h: last24h.length,
      risk_score: riskScore,
      top_attacking_ips: topIPs,
      recent_incidents: last24h.slice(-20).reverse(),
      threat_timeline: timeline,
      attack_type_distribution: attackTypes,
    };

    return Response.json(dashboard);
  }

  private async getIncidents(url: URL): Promise<Response> {
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sorted = [...this.incidents].reverse();
    return Response.json({
      incidents: sorted.slice(offset, offset + limit),
      total: this.incidents.length,
    });
  }

  private async resolveIncident(request: Request): Promise<Response> {
    const { id } = (await request.json()) as { id: string };
    const incident = this.incidents.find((i) => i.id === id);
    if (incident) {
      incident.resolved = true;
      await this.persist();
      return Response.json({ success: true });
    }
    return Response.json({ success: false, error: "Not found" }, { status: 404 });
  }

  private async cleanup(): Promise<Response> {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    const before = this.incidents.length;
    this.incidents = this.incidents.filter((i) => i.timestamp > cutoff);

    // Clean old IP entries
    for (const [ip, data] of this.flaggedIPs) {
      if (data.last_seen < cutoff) {
        this.flaggedIPs.delete(ip);
      }
    }

    await this.persist();
    return Response.json({
      removed: before - this.incidents.length,
      remaining: this.incidents.length,
    });
  }
}
