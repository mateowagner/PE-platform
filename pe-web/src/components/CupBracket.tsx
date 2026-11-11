// pe-web/src/components/CupBracket.tsx
import { useMemo } from "react";
import type { TournamentSeries } from "../types";
import { getStageTitle } from "../utils/bracketHelper";
import { getTeamLogo, handleImageError } from "../utils/image";
import { Trophy } from "lucide-react";
import "./CupBracket.css";

interface CupBracketProps {
  series: TournamentSeries[];
  onMatchClick?: (seriesId: string) => void;
}

export const CupBracket = ({ series, onMatchClick }: CupBracketProps) => {
  // 1. Identificar la Gran Final
  const finalSeries = useMemo(() => {
    return (
      series.find(
        (s) =>
          !s.next_series &&
          !s.parent_series_id &&
          s.stage_name?.toLowerCase().includes("final"),
      ) ||
      series.find((s) => s.stage_name === "Gran Final") ||
      series.find(
        (s) =>
          s.round_order ===
          Math.max(...series.map((item) => item.round_order || 1)),
      ) ||
      series[series.length - 1]
    );
  }, [series]);

  // 2. Profundidad total de rondas
  const maxRounds = useMemo(() => {
    if (series.length === 0) return 1;
    return Math.max(...series.map((s) => s.round_order || 1));
  }, [series]);

  // 3. Separación por lados respetando las ramas hacia la Gran Final
  const { leftRounds, rightRounds } = useMemo(() => {
    const roundsMap: Record<number, TournamentSeries[]> = {};

    series.forEach((s) => {
      const r = s.round_order || 1;
      if (!roundsMap[r]) roundsMap[r] = [];
      roundsMap[r].push(s);
    });

    // Ordenamiento consistente para mantener el árbol de llaves sin saltos
    Object.keys(roundsMap).forEach((rKey) => {
      roundsMap[Number(rKey)].sort((a, b) => {
        const orderA =
          (a as unknown as { order?: number; match_order?: number }).order ??
          (a as unknown as { order?: number; match_order?: number })
            .match_order ??
          0;
        const orderB =
          (b as unknown as { order?: number; match_order?: number }).order ??
          (b as unknown as { order?: number; match_order?: number })
            .match_order ??
          0;

        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.id.localeCompare(b.id);
      });
    });

    const left: { round: number; series: TournamentSeries[]; title: string }[] =
      [];
    const right: {
      round: number;
      series: TournamentSeries[];
      title: string;
    }[] = [];

    // Semifinales (maxRounds - 1): la primera va a la izquierda, la segunda a la derecha
    const semiRound = maxRounds - 1;
    const semiSeries = roundsMap[semiRound] || [];
    const leftSemi = semiSeries[0];
    const rightSemi = semiSeries[1];

    for (let r = 1; r < maxRounds; r++) {
      const currentRoundSeries = roundsMap[r] || [];
      const distanceToFinal = maxRounds - r;
      const title = getStageTitle(distanceToFinal);

      if (r === semiRound) {
        left.push({ round: r, series: leftSemi ? [leftSemi] : [], title });
        right.push({ round: r, series: rightSemi ? [rightSemi] : [], title });
      } else {
        // Para rondas anteriores (Cuartos), asignamos según el next_series_id
        let leftGroup: TournamentSeries[] = [];
        let rightGroup: TournamentSeries[] = [];

        if (leftSemi && rightSemi) {
          leftGroup = currentRoundSeries.filter(
            (s) =>
              s.next_series?.id === leftSemi.id ||
              (s as any).next_series_id === leftSemi.id,
          );
          rightGroup = currentRoundSeries.filter(
            (s) =>
              s.next_series?.id === rightSemi.id ||
              (s as any).next_series_id === rightSemi.id,
          );
        }

        // Si no vienen enlazados explícitamente por ID, dividir por mitades simétricas
        if (leftGroup.length === 0 && rightGroup.length === 0) {
          const half = Math.ceil(currentRoundSeries.length / 2);
          leftGroup = currentRoundSeries.slice(0, half);
          rightGroup = currentRoundSeries.slice(half);
        }

        left.push({ round: r, series: leftGroup, title });
        right.push({ round: r, series: rightGroup, title });
      }
    }

    return { leftRounds: left, rightRounds: right };
  }, [series, maxRounds]);

  if (!series || series.length === 0) {
    return (
      <div className="empty-bracket-state">
        <p>No se han generado llaves para este torneo.</p>
      </div>
    );
  }

  const renderSeriesCard = (s: TournamentSeries, isFinal = false) => {
    const isCompleted = s.status === "COMPLETED";
    // Serie en disputa: status STARTED o ya se jugó un mapa pero aún no hay ganador
    const isLive =
      !isCompleted &&
      (s.status === "IN_PROGRESS" ||
        (s.team_a_wins ?? 0) > 0 ||
        (s.team_b_wins ?? 0) > 0);

    const formatLabel = `BO${s.wins_required ? s.wins_required * 2 - 1 : 1}`;

    const teamAWon =
      isCompleted && s.winner?.id && s.winner.id === s.team_a?.id;
    const teamBWon =
      isCompleted && s.winner?.id && s.winner.id === s.team_b?.id;

    return (
      <div
        key={s.id}
        className={`bracket-series-card ${
          isCompleted ? "series-completed" : ""
        } ${isLive ? "series-live" : ""} ${isFinal ? "is-grand-final" : ""}`}
        onClick={() => onMatchClick?.(s.id)}
      >
        <div className="series-card-header">
          <div className="series-status-indicator">
            {isLive ? (
              <span className="live-pill-badge">
                <span className="live-dot-pulse" />
                LIVE
              </span>
            ) : (
              <span
                className={`series-indicator-dot ${
                  isCompleted ? "dot-completed" : ""
                }`}
              />
            )}
          </div>
          <span className="series-format-badge">{formatLabel}</span>
        </div>

        {/* Team A */}
        <div className={`bracket-slot ${teamAWon ? "slot-winner" : ""}`}>
          <div className="slot-team-meta">
            <img
              src={getTeamLogo(s.team_a)}
              alt={s.team_a?.name || "Por Definir"}
              className={`bracket-team-icon ${!s.team_a ? "slot-icon-tbd" : ""}`}
              onError={(e) => handleImageError(e, "/default-shield.svg")}
            />
            <span
              className={`bracket-team-name truncate ${
                !s.team_a ? "text-muted" : ""
              }`}
            >
              {s.team_a?.name || "Por Definir"}
            </span>
          </div>
          <span className="bracket-score">{s.team_a_wins ?? 0}</span>
        </div>

        {/* Team B */}
        <div className={`bracket-slot ${teamBWon ? "slot-winner" : ""}`}>
          <div className="slot-team-meta">
            <img
              src={getTeamLogo(s.team_b)}
              alt={s.team_b?.name || "Por Definir"}
              className={`bracket-team-icon ${!s.team_b ? "slot-icon-tbd" : ""}`}
              onError={(e) => handleImageError(e, "/default-shield.svg")}
            />
            <span
              className={`bracket-team-name truncate ${
                !s.team_b ? "text-muted" : ""
              }`}
            >
              {s.team_b?.name || "Por Definir"}
            </span>
          </div>
          <span className="bracket-score">{s.team_b_wins ?? 0}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bracket-symmetric-wrapper">
      {/* ─── LADO IZQUIERDO ─── */}
      <div className="bracket-side bracket-left-side">
        {leftRounds.map((rData, roundIdx) => (
          <div
            key={`left-r-${rData.round}`}
            className={`bracket-round-column left-col-${roundIdx}`}
          >
            <div className="round-column-header">
              <span className="round-title-tag">{rData.title}</span>
            </div>
            <div className="round-series-column">
              {rData.series.map((s, sIdx) => {
                const isSemi = roundIdx === leftRounds.length - 1;
                const posClass = !isSemi
                  ? sIdx % 2 === 0
                    ? "pos-top"
                    : "pos-bottom"
                  : "pos-semi";

                return (
                  <div
                    key={s.id}
                    className={`bracket-node node-left ${posClass}`}
                  >
                    {renderSeriesCard(s)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── CENTRO: GRAN FINAL ─── */}
      <div className="bracket-center-final">
        <div className="final-trophy-block">
          <Trophy size={44} className="trophy-center-icon" />
          <h3 className="final-stage-title">GRAN FINAL</h3>
        </div>

        {finalSeries && (
          <div className="final-card-wrapper bracket-node node-center">
            {renderSeriesCard(finalSeries, true)}
          </div>
        )}
      </div>

      {/* ─── LADO DERECHO ─── */}
      <div className="bracket-side bracket-right-side">
        {[...rightRounds].reverse().map((rData, roundIdx) => (
          <div
            key={`right-r-${rData.round}`}
            className={`bracket-round-column right-col-${roundIdx}`}
          >
            <div className="round-column-header">
              <span className="round-title-tag">{rData.title}</span>
            </div>
            <div className="round-series-column">
              {rData.series.map((s, sIdx) => {
                const isSemi = roundIdx === 0;
                const posClass = !isSemi
                  ? sIdx % 2 === 0
                    ? "pos-top"
                    : "pos-bottom"
                  : "pos-semi";

                return (
                  <div
                    key={s.id}
                    className={`bracket-node node-right ${posClass}`}
                  >
                    {renderSeriesCard(s)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
