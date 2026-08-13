import { Trophy, Eye } from "lucide-react";
import type { TournamentSeries } from "../types";

interface CupBracketProps {
  series: TournamentSeries[];
  onMatchClick: (seriesId: string) => void;
}

export const CupBracket = ({ series, onMatchClick }: CupBracketProps) => {
  // 1. Agrupación matemática de las llaves
  const roundsMap = series.reduce(
    (acc: Record<number, TournamentSeries[]>, item) => {
      if (!acc[item.round_order]) acc[item.round_order] = [];
      acc[item.round_order].push(item);
      return acc;
    },
    {},
  );

  const totalRoundsCount = Object.keys(roundsMap).length;

  if (totalRoundsCount === 0) {
    return <div className="empty-list-text">No hay llaves generadas.</div>;
  }

  const finalRoundOrder = Math.max(...Object.keys(roundsMap).map(Number));
  const finalMatch = roundsMap[finalRoundOrder]?.[0];
  const previousRoundsOrders = Object.keys(roundsMap)
    .map(Number)
    .filter((r) => r !== finalRoundOrder)
    .sort((a, b) => a - b);

  // 2. Sub-componente presentacional aislado para cada serie
  const BracketMatchCard = ({ match }: { match: TournamentSeries }) => {
    const isLive = match.status === "IN_PROGRESS";

    return (
      <div
        className={`hltv-match-card-wrapper ${isLive ? "hltv-card-live-border" : ""}`}
        onClick={() => onMatchClick(match.id)}
        title="Click para ver estadísticas de la serie"
        // Atributos de datos (Dataset) preparados para la inyección del parent_series_id
        data-series-id={match.id}
        data-parent-id={match.parent_series_id || ""}
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
            <Eye size={12} /> Ver estadísticas
          </span>
        </div>
      </div>
    );
  };

  // 3. Orquestación del Grid elástico (Vista)
  return (
    <div className="bracket-viewport">
      <div
        className="cup-mirror-elastic-grid"
        style={{
          gridTemplateColumns: `repeat(${previousRoundsOrders.length}, 1fr) 1.2fr repeat(${previousRoundsOrders.length}, 1fr)`,
        }}
      >
        {/* RAMA IZQUIERDA */}
        {previousRoundsOrders.map((rOrder) => {
          const roundMatches = roundsMap[rOrder] || [];
          const leftBranchMatches = roundMatches.slice(
            0,
            Math.ceil(roundMatches.length / 2),
          );
          const stageTitle =
            leftBranchMatches[0]?.stage_name || `Ronda ${rOrder}`;

          return (
            <div key={`left-${rOrder}`} className="cup-elastic-column">
              <h3 className="cup-stage-title">{stageTitle}</h3>
              <div className="matches-column-flow">
                {leftBranchMatches.map((match) => (
                  <BracketMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          );
        })}

        {/* NODO CENTRAL (GRAN FINAL) */}
        <div className="cup-elastic-column branch-center-highlight">
          <div className="trophy-cup-icon-wrapper">
            <Trophy size={28} className="gold-glow-icon" />
          </div>
          <h3 className="cup-stage-title grand-final-title">Gran Final</h3>
          {finalMatch ? (
            <BracketMatchCard match={finalMatch} />
          ) : (
            <div className="hltv-match-card-wrapper empty-card">
              Por Definir
            </div>
          )}
        </div>

        {/* RAMA DERECHA */}
        {[...previousRoundsOrders].reverse().map((rOrder) => {
          const roundMatches = roundsMap[rOrder] || [];
          const rightBranchMatches = roundMatches.slice(
            Math.ceil(roundMatches.length / 2),
          );
          const stageTitle =
            rightBranchMatches[0]?.stage_name || `Ronda ${rOrder}`;

          return (
            <div key={`right-${rOrder}`} className="cup-elastic-column">
              <h3 className="cup-stage-title">{stageTitle}</h3>
              <div className="matches-column-flow">
                {rightBranchMatches.map((match) => (
                  <BracketMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
