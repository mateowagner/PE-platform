import { useState, useEffect } from "react";
import { LayoutGrid, Eye } from "lucide-react";
import type { TournamentSeries } from "../types";

interface LeagueMatchListProps {
  series: TournamentSeries[];
  onMatchClick: (seriesId: string) => void;
}

export const LeagueMatchList = ({
  series,
  onMatchClick,
}: LeagueMatchListProps) => {
  // 1. Cálculos derivados movidos al componente local
  const uniqueStages = Array.from(new Set(series.map((s) => s.stage_name)));

  // 2. El estado de la pestaña activa ahora vive solo aquí
  const [activeStageTab, setActiveStageTab] = useState<string>("");

  useEffect(() => {
    if (uniqueStages.length > 0 && !activeStageTab) {
      setActiveStageTab(uniqueStages[0]);
    }
  }, [series, activeStageTab, uniqueStages]);

  const filteredSeries = series.filter((s) => s.stage_name === activeStageTab);

  // 3. El renderizado de la tarjeta se encapsula
  const renderMatchCard = (match: TournamentSeries) => {
    const isLive = match.status === "IN_PROGRESS";
    return (
      <div
        key={match.id}
        className={`hltv-match-card-wrapper ${isLive ? "hltv-card-live-border" : ""}`}
        onClick={() => onMatchClick(match.id)}
        title="Click para ver estadísticas de la serie"
      >
        <div className="hltv-card-top-meta">
          <span className="hltv-series-format-tag">
            MEJOR DE {match.wins_required * 2 - 1}
          </span>
          {isLive ? (
            <span className="hltv-live-indicator">
              <span className="live-dot" /> LIVE
            </span>
          ) : (
            <span
              className={`hltv-status-badge status-${match.status.toLowerCase()}`}
            >
              {match.status}
            </span>
          )}
        </div>

        <div className="hltv-card-teams-block">
          <div
            className={`hltv-team-row ${match.winner?.id === match.team_a?.id ? "hltv-row-winner" : ""}`}
          >
            <div className="hltv-team-identity">
              <div className="hltv-team-logo-placeholder">
                {match.team_a?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="hltv-team-name-text">
                {match.team_a?.name || "Por Clasificar"}
              </span>
            </div>
            <span className="hltv-team-score-num">
              {match.status === "PENDING" && !match.team_a
                ? "-"
                : match.team_a_wins}
            </span>
          </div>

          <div className="hltv-row-divider" />

          <div
            className={`hltv-team-row ${match.winner?.id === match.team_b?.id ? "hltv-row-winner" : ""}`}
          >
            <div className="hltv-team-identity">
              <div className="hltv-team-logo-placeholder">
                {match.team_b?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="hltv-team-name-text">
                {match.team_b?.name || "Por Clasificar"}
              </span>
            </div>
            <span className="hltv-team-score-num">
              {match.status === "PENDING" && !match.team_b
                ? "-"
                : match.team_b_wins}
            </span>
          </div>
        </div>

        <div className="hltv-card-footer-action">
          <span className="hltv-action-text">
            <Eye size={12} /> Ver estadísticas de la serie
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="hltv-stage-container">
        <div className="hltv-stage-selector-bar">
          {uniqueStages.map((stage) => (
            <button
              key={stage}
              className={`hltv-stage-btn ${activeStageTab === stage ? "hltv-stage-active" : ""}`}
              onClick={() => setActiveStageTab(stage)}
            >
              <LayoutGrid size={14} /> {stage}
            </button>
          ))}
        </div>
      </div>
      <div className="hltv-series-grid-layout">
        {filteredSeries.length === 0 ? (
          <p className="empty-list-text">
            No hay enfrentamientos disponibles para esta etapa.
          </p>
        ) : (
          filteredSeries.map((match) => renderMatchCard(match))
        )}
      </div>
    </>
  );
};
