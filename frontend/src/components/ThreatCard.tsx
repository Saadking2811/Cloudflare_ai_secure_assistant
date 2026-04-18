import { useState } from "react";
import type { IncidentRecord } from "../types";
import { resolveIncident } from "../api";
import { CheckIcon, ClockIcon, GlobeIcon, TargetIcon } from "./Icons";

interface Props {
  incident: IncidentRecord;
  onResolve: () => void;
}

export default function ThreatCard({ incident, onResolve }: Props) {
  const [resolving, setResolving] = useState(false);

  async function handleResolve() {
    setResolving(true);
    try {
      await resolveIncident(incident.id);
      onResolve();
    } catch {
      // Silently fail
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className={`threat-card ${incident.resolved ? "resolved" : ""} severity-${incident.risk_level.toLowerCase()}`}>
      <div className="threat-card-header">
        <span className={`risk-badge risk-${incident.risk_level.toLowerCase()}`}>
          {incident.risk_level}
        </span>
        <span className="threat-type">{incident.attack_type}</span>
        <span className="threat-time">
          <ClockIcon size={12} />
          {new Date(incident.timestamp).toLocaleString()}
        </span>
      </div>
      <div className="threat-card-body">
        <div className="threat-detail">
          <GlobeIcon size={13} />
          <strong>IP:</strong> <code>{incident.ip}</code>
        </div>
        {incident.endpoint && (
          <div className="threat-detail">
            <TargetIcon size={13} />
            <strong>Endpoint:</strong> <code>{incident.endpoint}</code>
          </div>
        )}
        <div className="threat-explanation">
          {incident.analysis.explanation}
        </div>
      </div>
      <div className="threat-card-footer">
        {!incident.resolved ? (
          <button
            className="resolve-btn"
            onClick={handleResolve}
            disabled={resolving}
          >
            <CheckIcon size={13} />
            {resolving ? "Resolving..." : "Mark Resolved"}
          </button>
        ) : (
          <span className="resolved-badge">
            <CheckIcon size={13} /> Resolved
          </span>
        )}
      </div>
    </div>
  );
}
