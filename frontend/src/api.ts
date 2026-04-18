// ── API Client ──

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function analyzeMessage(
  message: string,
  mode: "simple" | "engineer"
) {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Analysis failed");
  }
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/api/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function fetchIncidents(limit = 50, offset = 0) {
  const res = await fetch(
    `${API_BASE}/api/incidents?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function resolveIncident(id: string) {
  const res = await fetch(`${API_BASE}/api/incidents/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to resolve incident");
  return res.json();
}
