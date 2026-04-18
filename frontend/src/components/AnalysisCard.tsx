import type { SecurityAnalysis } from "../types";
import { SearchIcon, ZapIcon, AlertIcon } from "./Icons";

interface Props {
  analysis: SecurityAnalysis;
}

export default function AnalysisCard({ analysis }: Props) {
  const confidencePct = Math.round(analysis.confidence * 100);

  return (
    <div className={`analysis-card severity-${analysis.risk_level.toLowerCase()}`}>
      <div className="analysis-header">
        <div className="analysis-badges">
          <span className={`risk-badge risk-${analysis.risk_level.toLowerCase()}`}>
            {analysis.risk_level}
          </span>
          <span className="attack-badge">{analysis.attack_type}</span>
        </div>
        <div className="confidence-meter">
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="confidence-label">{confidencePct}%</span>
        </div>
      </div>

      {analysis.technical_details && (
        <div className="analysis-section">
          <h4><SearchIcon size={14} /> Technical Analysis</h4>
          <p>{analysis.technical_details}</p>
        </div>
      )}

      <div className="analysis-section">
        <h4><ZapIcon size={14} /> Recommendations</h4>
        <ul className="recommendation-list">
          {analysis.recommendation.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      {analysis.false_positive_notes && (
        <div className="analysis-section fp-section">
          <h4><AlertIcon size={14} /> False Positive Notes</h4>
          <p>{analysis.false_positive_notes}</p>
        </div>
      )}
    </div>
  );
}
