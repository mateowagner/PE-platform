// pe-web/src/components/LeagueWorkspace.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { TournamentSeries, Team } from "../types";
import { Swords, Trophy, Shield, ChevronRight, Settings } from "lucide-react";
import {
  getImageUrl,
  handleImageError,
  DEFAULT_SHIELD_ICON,
} from "../utils/image";
import "./LeagueWorkspace.css";

export interface LeagueStanding {
  pos: number;
  team: Team;
  pts: number;
  pj: number;
  pg: number;
  pp: number;
  diffMaps: number;
}

interface LeagueWorkspaceProps {
  series: TournamentSeries[];
  userTeamId?: string;
  standings: any[];
  isAdmin: boolean;
  onAdminOverride?: (seriesId: string) => void;
}

export function LeagueWorkspace({
  series,
  userTeamId,
  standings,
  isAdmin,
  onAdminOverride,
}: LeagueWorkspaceProps) {
  const navigate = useNavigate();

  // Agrupación de series por jornada / ronda
  const rounds = useMemo(() => {
    const map = new Map<number, TournamentSeries[]>();
    series.forEach((s) => {
      const r = s.round_order || 1;
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(s);
    });

    const sortedRoundNumbers = Array.from(map.keys()).sort((a, b) => a - b);
    return sortedRoundNumbers.map((num) => ({
      roundNumber: num,
      stageName: map.get(num)?.[0]?.stage_name || `Jornada ${num}`,
      matches: map.get(num) || [],
    }));
  }, [series]);

  const [selectedRound, setSelectedRound] = useState<number>(() => {
    return rounds.length > 0 ? rounds[0].roundNumber : 1;
  });

  const activeRoundData = useMemo(() => {
    return (
      rounds.find((r) => r.roundNumber === selectedRound) ||
      rounds[0] || { roundNumber: 1, stageName: "Jornada 1", matches: [] }
    );
  }, [rounds, selectedRound]);

  return (
    <div className="league-workspace-root">
      {/* ─── COLUMNA IZQUIERDA: TABLA DE POSICIONES ────────────────────────── */}
      <section className="league-standings-card">
        <div className="card-header-row">
          <div className="card-header-title">
            <Trophy size={18} className="text-gold" />
            <h3>Tabla de Posiciones</h3>
          </div>
          <span className="standings-meta-badge">Fase Regular</span>
        </div>

        <div className="table-responsive-wrapper">
          <table className="league-table">
            <thead>
              <tr>
                <th className="th-pos">#</th>
                <th className="th-team">Equipo</th>
                <th className="th-stat" title="Puntos Totales">
                  PTS
                </th>
                <th className="th-stat" title="Partidos Jugados">
                  PJ
                </th>
                <th className="th-stat" title="Partidos Ganados">
                  PG
                </th>
                <th className="th-stat" title="Partidos Perdidos">
                  PP
                </th>
                <th className="th-stat" title="Diferencia de Mapas">
                  DIF
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="td-empty">
                    Sin datos registrados todavía.
                  </td>
                </tr>
              ) : (
                standings.map((st) => {
                  const isUserTeam = userTeamId && st.team.id === userTeamId;
                  const isTopZone = st.pos <= 2; // Zona de playoffs / final

                  return (
                    <tr
                      key={st.team.id}
                      className={`standing-row ${isUserTeam ? "row-user-team" : ""} ${
                        isTopZone ? "row-playoff-zone" : ""
                      }`}
                    >
                      <td className="td-pos">
                        <span className={`pos-badge pos-${st.pos}`}>
                          {st.pos}
                        </span>
                      </td>
                      <td className="td-team">
                        <div className="standing-team-cell">
                          <img
                            src={getImageUrl(
                              st.team.logoUrl,
                              DEFAULT_SHIELD_ICON,
                            )}
                            alt={st.team.name}
                            className="standing-team-icon"
                            onError={(e) =>
                              handleImageError(e, DEFAULT_SHIELD_ICON)
                            }
                          />
                          <span className="standing-team-name truncate">
                            {st.team.name}
                          </span>
                          {isUserTeam && (
                            <span className="my-team-pill">Tú</span>
                          )}
                        </div>
                      </td>
                      <td className="td-stat stat-pts">{st.pts}</td>
                      <td className="td-stat">{st.pj}</td>
                      <td className="td-stat text-green">{st.pg}</td>
                      <td className="td-stat text-red">{st.pp}</td>
                      <td
                        className={`td-stat ${st.diffMaps > 0 ? "text-green" : st.diffMaps < 0 ? "text-red" : ""}`}
                      >
                        {st.diffMaps > 0 ? `+${st.diffMaps}` : st.diffMaps}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── COLUMNA DERECHA: FIXTURE POR JORNADAS ─────────────────────────── */}
      <section className="league-fixture-card">
        <div className="card-header-row">
          <div className="card-header-title">
            <Swords size={18} className="text-cyan" />
            <h3>Calendario de Partidos</h3>
          </div>

          {/* Selector de Jornada */}
          <div className="round-selector-strip">
            {rounds.map((r) => (
              <button
                key={r.roundNumber}
                type="button"
                className={`round-tab-btn ${
                  r.roundNumber === selectedRound ? "tab-active" : ""
                }`}
                onClick={() => setSelectedRound(r.roundNumber)}
              >
                J{r.roundNumber}
              </button>
            ))}
          </div>
        </div>

        <div className="league-matches-list">
          {activeRoundData.matches.length === 0 ? (
            <div className="empty-matches-placeholder">
              <Shield size={32} className="text-muted" />
              <p>No hay encuentros programados para esta jornada.</p>
            </div>
          ) : (
            activeRoundData.matches.map((s, idx) => {
              const isFinished = s.status === "COMPLETED";
              const isLive = s.status === "IN_PROGRESS";
              const isTeamAWinner = isFinished && s.winner?.id === s.team_a?.id;
              const isTeamBWinner = isFinished && s.winner?.id === s.team_b?.id;
              const involvesUser =
                userTeamId &&
                (s.team_a?.id === userTeamId || s.team_b?.id === userTeamId);

              return (
                <div
                  key={s.id}
                  className={`league-match-card card-clickable ${
                    involvesUser ? "match-user-highlight" : ""
                  } ${isLive ? "match-live" : ""}`}
                  onClick={() => navigate(`/series/${s.id}`)}
                  title="Clic para ver detalles y estadísticas de la serie"
                >
                  <div className="match-card-meta">
                    <span className="match-index-label">
                      {s.stage_name || `Encuentro #${idx + 1}`}
                    </span>
                    <span className="format-badge">
                      Bo{(s.wins_required || 2) * 2 - 1}
                    </span>
                    {isLive && (
                      <span className="live-pulse-badge">EN VIVO</span>
                    )}
                  </div>

                  <div className="match-teams-grid">
                    {/* Equipo A */}
                    <div
                      className={`match-team-row ${isTeamAWinner ? "is-winner" : ""} ${
                        isFinished && !isTeamAWinner ? "is-loser" : ""
                      }`}
                    >
                      <div className="team-meta-flex">
                        <img
                          src={getImageUrl(
                            s.team_a?.logoUrl,
                            DEFAULT_SHIELD_ICON,
                          )}
                          alt={s.team_a?.name || "TBD"}
                          className="match-team-icon"
                          onError={(e) =>
                            handleImageError(e, DEFAULT_SHIELD_ICON)
                          }
                        />
                        <span className="match-team-name truncate">
                          {s.team_a?.name || "Por Definir"}
                        </span>
                      </div>
                      <span className="match-score">{s.team_a_wins ?? 0}</span>
                    </div>

                    <div className="match-divider-line" />

                    {/* Equipo B */}
                    <div
                      className={`match-team-row ${isTeamBWinner ? "is-winner" : ""} ${
                        isFinished && !isTeamBWinner ? "is-loser" : ""
                      }`}
                    >
                      <div className="team-meta-flex">
                        <img
                          src={getImageUrl(
                            s.team_b?.logoUrl,
                            DEFAULT_SHIELD_ICON,
                          )}
                          alt={s.team_b?.name || "TBD"}
                          className="match-team-icon"
                          onError={(e) =>
                            handleImageError(e, DEFAULT_SHIELD_ICON)
                          }
                        />
                        <span className="match-team-name truncate">
                          {s.team_b?.name || "Por Definir"}
                        </span>
                      </div>
                      <span className="match-score">{s.team_b_wins ?? 0}</span>
                    </div>
                  </div>

                  <div className="match-card-footer">
                    {isAdmin && onAdminOverride && !isFinished && (
                      <button
                        type="button"
                        className="btn-admin-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdminOverride(s.id);
                        }}
                        title="Resolver serie manualmente"
                      >
                        <Settings size={14} /> Override
                      </button>
                    )}

                    <div className="view-series-indicator">
                      <span>Ver Serie & Stats</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
