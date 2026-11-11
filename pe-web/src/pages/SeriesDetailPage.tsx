// pe-web/src/pages/SeriesDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../config/apiClient";
import { MatchScoreboard } from "../components/MatchScoreboard";
import { getTeamLogo, handleImageError } from "../utils/image";
import type { TournamentSeries, Match } from "../types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Crown,
} from "lucide-react";
import "./SeriesDetailPage.css";

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [series, setSeries] = useState<TournamentSeries | null>(null);
  const [loading, setLoading] = useState(true);
  // Mapa de IDs de matches expandidos (permite abrir/cerrar varios o uno solo)
  const [expandedMatchIds, setExpandedMatchIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchSeries = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data } = await apiClient.get<TournamentSeries>(`/series/${id}`);
        setSeries(data);

        // Abre por defecto el último mapa terminado para que se vea el scoreboard
        const lastFinished = [...(data.matches || [])]
          .reverse()
          .find((m) => m.status === "FINISHED");

        if (lastFinished) {
          setExpandedMatchIds({ [lastFinished.id]: true });
        }
      } catch (err) {
        console.error("Error al cargar la serie:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSeries();
  }, [id]);

  const toggleExpandMatch = (matchId: string, isFinished: boolean) => {
    if (!isFinished) return; // Solo despliega si ya se jugó
    setExpandedMatchIds((prev) => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };

  if (loading) {
    return (
      <div className="series-page-container loading-state">
        <p>Cargando información detallada de la serie...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="series-page-container error-state">
        <p>Serie no encontrada.</p>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
    );
  }

  const teamAName = series.team_a?.name || "Por Definir";
  const teamBName = series.team_b?.name || "Por Definir";
  const formatLabel = `BO${series.wins_required ? series.wins_required * 2 - 1 : 1}`;

  const formattedDate = series.scheduled_date
    ? new Date(series.scheduled_date).toLocaleString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Fecha pendiente de coordinación";

  return (
    <div className="series-page-container fade-in">
      {/* Botón de Retorno */}
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Volver al fixture / bracket
      </button>

      {/* ─── BANNER GLOBAL DE LA SERIE ────────────────────────────────────── */}
      <div className="series-master-header">
        <div className="series-team-unit">
          <img
            src={getTeamLogo(series.team_a)}
            alt={teamAName}
            className="series-header-shield"
            onError={(e) => handleImageError(e, "/default-shield.svg")}
          />
          <span className="series-header-team-name">{teamAName}</span>
        </div>

        <div className="series-score-block">
          <span className="series-format-pill">{formatLabel}</span>
          <div className="series-digits-row">
            <span
              className={
                series.team_a_wins > series.team_b_wins ? "score-high" : ""
              }
            >
              {series.team_a_wins ?? 0}
            </span>
            <span className="score-divider">-</span>
            <span
              className={
                series.team_b_wins > series.team_a_wins ? "score-high" : ""
              }
            >
              {series.team_b_wins ?? 0}
            </span>
          </div>
          <span className="series-stage-title">{series.stage_name}</span>
          <div className="series-scheduled-badge">
            <Calendar size={13} /> {formattedDate}
          </div>
        </div>

        <div className="series-team-unit">
          <img
            src={getTeamLogo(series.team_b)}
            alt={teamBName}
            className="series-header-shield"
            onError={(e) => handleImageError(e, "/default-shield.svg")}
          />
          <span className="series-header-team-name">{teamBName}</span>
        </div>
      </div>

      {/* ─── LISTADO DE MATCHES (BLOQUES ACORDEÓN) ────────────────────────── */}
      <div className="series-matches-stack">
        <h3 className="section-title">Encuentros de la Serie</h3>

        {!series.matches || series.matches.length === 0 ? (
          <div className="empty-matches-box">
            <p>No hay partidas generadas para esta serie aún.</p>
          </div>
        ) : (
          series.matches.map((match, idx) => {
            const isFinished = match.status === "FINISHED";
            const isExpanded = !!expandedMatchIds[match.id];
            const hasStats = Boolean((match as any).stats?.participants);

            // Determinar ganador de este mapa específico
            const teamAWon =
              isFinished &&
              match.winner?.id &&
              match.winner.id === series.team_a?.id;
            const teamBWon =
              isFinished &&
              match.winner?.id &&
              match.winner.id === series.team_b?.id;

            return (
              <div
                key={match.id}
                className={`match-accordion-card ${isFinished ? "card-finished" : "card-pending"} ${
                  isExpanded ? "card-expanded" : ""
                }`}
              >
                {/* ── BARRA COMPACTA (HEADER DEL MATCH) ── */}
                <div
                  className={`match-accordion-header ${isFinished ? "cursor-pointer" : ""}`}
                  onClick={() => toggleExpandMatch(match.id, isFinished)}
                >
                  {/* Info Izquierda: Número de Mapa & Fecha */}
                  <div className="match-left-meta">
                    <span className="match-order-badge">
                      Mapa #{match.match_order || idx + 1}
                    </span>
                    <span className="match-date-sub">
                      <Clock size={12} />
                      {formattedDate}
                    </span>
                  </div>

                  {/* Centro: Rectángulo VS con Logos y Nombres */}
                  <div className="match-teams-versus-strip">
                    {/* Team A */}
                    <div
                      className={`versus-team-cell ${teamAWon ? "team-winner" : ""}`}
                    >
                      <span className="versus-team-name truncate">
                        {teamAName}
                      </span>
                      <img
                        src={getTeamLogo(series.team_a)}
                        alt={teamAName}
                        className="versus-team-logo"
                        onError={(e) =>
                          handleImageError(e, "/default-shield.svg")
                        }
                      />
                      {teamAWon && (
                        <Crown size={15} className="winner-crown-icon" />
                      )}
                    </div>

                    <span className="versus-divider">VS</span>

                    {/* Team B */}
                    <div
                      className={`versus-team-cell ${teamBWon ? "team-winner" : ""}`}
                    >
                      {teamBWon && (
                        <Crown size={15} className="winner-crown-icon" />
                      )}
                      <img
                        src={getTeamLogo(series.team_b)}
                        alt={teamBName}
                        className="versus-team-logo"
                        onError={(e) =>
                          handleImageError(e, "/default-shield.svg")
                        }
                      />
                      <span className="versus-team-name truncate">
                        {teamBName}
                      </span>
                    </div>
                  </div>

                  {/* Info Derecha: Estado y Botón de Despliegue */}
                  <div className="match-right-actions">
                    <span
                      className={`match-status-pill ${isFinished ? "pill-finished" : "pill-pending"}`}
                    >
                      {isFinished ? (
                        <>
                          <CheckCircle2 size={13} /> Terminado
                        </>
                      ) : (
                        <>
                          <Clock size={13} /> Pendiente
                        </>
                      )}
                    </span>

                    {isFinished && (
                      <button
                        type="button"
                        className="btn-toggle-stats"
                        title={
                          isExpanded
                            ? "Ocultar Estadísticas"
                            : "Ver Estadísticas"
                        }
                      >
                        <BarChart2 size={14} />
                        <span>{isExpanded ? "Ocultar" : "Ver Stats"}</span>
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── CONTENIDO DESPLEGABLE: SCOREBOARD ESTILO OP.GG ── */}
                {isExpanded && isFinished && (
                  <div className="match-accordion-body fade-in">
                    {hasStats ? (
                      <MatchScoreboard
                        stats={(match as any).stats}
                        teamAName={teamAName}
                        teamBName={teamBName}
                      />
                    ) : (
                      <div className="no-telemetry-notice">
                        <BarChart2 size={32} className="text-muted" />
                        <p>
                          La partida concluyó pero no cuenta con reporte de
                          telemetría cargado.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
