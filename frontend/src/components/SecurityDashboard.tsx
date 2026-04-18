import { useState, useEffect, useCallback } from "react";
import type { DashboardData } from "../types";
import { fetchDashboard } from "../api";
import { AlertIcon, ActivityIcon, TargetIcon, GlobeIcon, BarChartIcon, RefreshIcon, ClockIcon } from "./Icons";
import ThreatCard from "./ThreatCard";

export default function SecurityDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const d = await fetchDashboard();
      setData(d);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <div className="dashboard-loading">
        <span className="spinner" />
        <p>Loading security dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-error">
        <AlertIcon size={24} />
        <p>{error}</p>
        <button onClick={loadDashboard} className="retry-btn">
          <RefreshIcon size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const maxTimeline = Math.max(...data.threat_timeline.map((t) => t.count), 1);

  return (
    <div className="dashboard">
      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-icon"><AlertIcon size={20} /></div>
          <div className="summary-data">
            <div className="summary-value val-critical">{data.active_threats}</div>
            <div className="summary-label">Active Threats</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><ActivityIcon size={20} /></div>
          <div className="summary-data">
            <div className="summary-value val-warning">{data.total_incidents_24h}</div>
            <div className="summary-label">Incidents (24h)</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><BarChartIcon size={20} /></div>
          <div className="summary-data">
            <div className={`summary-value ${data.risk_score >= 70 ? "val-critical" : data.risk_score >= 40 ? "val-warning" : "val-ok"}`}>
              {data.risk_score}
            </div>
            <div className="summary-label">Risk Score</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><GlobeIcon size={20} /></div>
          <div className="summary-data">
            <div className="summary-value val-info">{data.top_attacking_ips.length}</div>
            <div className="summary-label">Flagged IPs</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h3><ActivityIcon size={16} /> Threat Timeline (24h)</h3>
        </div>
        <div className="timeline-chart">
          {data.threat_timeline.map((t, i) => (
            <div key={i} className="timeline-bar-wrapper" title={`${t.hour}: ${t.count} events`}>
              <div
                className={`timeline-bar severity-bar-${t.severity.toLowerCase()}`}
                style={{ height: `${Math.max((t.count / maxTimeline) * 100, 2)}%` }}
              />
              {i % 4 === 0 && (
                <span className="timeline-label">{t.hour}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h3><TargetIcon size={16} /> Top Attacking IPs</h3>
          </div>
          {data.top_attacking_ips.length === 0 ? (
            <p className="empty-state">No flagged IPs</p>
          ) : (
            <table className="ip-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Incidents</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {data.top_attacking_ips.map((ip) => (
                  <tr key={ip.ip}>
                    <td className="ip-cell">{ip.ip}</td>
                    <td className="count-cell">{ip.count}</td>
                    <td className="time-cell">
                      <ClockIcon size={12} /> {new Date(ip.last_seen).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3><BarChartIcon size={16} /> Attack Distribution</h3>
          </div>
          {data.attack_type_distribution.length === 0 ? (
            <p className="empty-state">No attacks detected</p>
          ) : (
            <div className="distribution-list">
              {data.attack_type_distribution.map((a) => {
                const total = data.attack_type_distribution.reduce(
                  (s, x) => s + x.count, 0
                );
                const pct = Math.round((a.count / total) * 100);
                return (
                  <div key={a.type} className="distribution-item">
                    <div className="distribution-label">
                      <span>{a.type}</span>
                      <span className="distribution-stat">{a.count} ({pct}%)</span>
                    </div>
                    <div className="distribution-bar">
                      <div className="distribution-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h3><AlertIcon size={16} /> Recent Incidents</h3>
        </div>
        {data.recent_incidents.length === 0 ? (
          <p className="empty-state">
            No incidents recorded yet. Start analyzing traffic in the Analysis tab.
          </p>
        ) : (
          <div className="incidents-list">
            {data.recent_incidents.map((inc) => (
              <ThreatCard key={inc.id} incident={inc} onResolve={loadDashboard} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
