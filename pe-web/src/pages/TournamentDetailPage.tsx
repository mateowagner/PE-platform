import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useApi } from "../hooks/useApi";
import {
  Calendar,
  Users,
  Trophy,
  ShieldAlert,
  ArrowLeft,
  Play,
  LayoutGrid,
  Eye,
} from "lucide-react";
import "./TournamentDetailPage.css";

interface ParticipantTeam {
  id: string;
  name: string;
  logoUrl: string | null;
  memberCount: number;
  avgTier: string;
}

interface TournamentSeries {
  id: string;
  stage_name: string;
  round_order: number;
  status: string;
  team_a_wins: number;
  team_b_wins: number;
  wins_required: number;
  team_a?: { id: string; name: string } | null;
  team_b?: { id: string; name: string } | null;
  winner?: { id: string; name: string } | null;
}

interface TournamentDetails {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  skill_tier: string;
  registration_start_date: string;
  registration_end_date: string;
  start_date: string;
  max_teams: number;
  entry_fee: string;
  prize_pool?: string;
  current_stage: string;
  teams: ParticipantTeam[];
  currentTeamsCount: number;
}

export default function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { authFetch } = useApi();

  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [series, setSeries] = useState<TournamentSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [checkingTeam, setCheckingTeam] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [activeStageTab, setActiveStageTab] = useState<string>("");

  const fetchDetails = async () => {
    try {
      const res = await authFetch(`/tournaments/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTournament(data);

      if (data.status === "STARTED" || data.status === "FINISHED") {
        const resSeries = await authFetch(`/tournaments/${id}/series`);
        if (resSeries.ok) {
          const dataSeries = await resSeries.json();
          setSeries(dataSeries);

          if (dataSeries.length > 0 && !activeStageTab) {
            setActiveStageTab(dataSeries[0].stage_name);
          }
        }
      }
    } catch {
      setErrorMessage("No se pudo cargar la información del torneo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setCheckingTeam(true);
      try {
        const resDetails = await authFetch(`/tournaments/${id}`);
        if (resDetails.ok) {
          const dataDetails = await resDetails.json();
          setTournament(dataDetails);

          if (
            dataDetails.status === "STARTED" ||
            dataDetails.status === "FINISHED"
          ) {
            const resSeries = await authFetch(`/tournaments/${id}/series`);
            if (resSeries.ok) {
              const dataSeries = await resSeries.json();
              setSeries(dataSeries);
              if (dataSeries.length > 0) {
                setActiveStageTab(dataSeries[0].stage_name);
              }
            }
          }
        }

        const resTeam = await authFetch("/teams/my-team");
        if (resTeam.ok) {
          const dataTeam = await resTeam.json();
          setMyTeam(dataTeam);
        } else {
          setMyTeam(null);
        }
      } catch (err) {
        setErrorMessage("No se pudo cargar la información necesaria.");
      } finally {
        setLoading(false);
        setCheckingTeam(false);
      }
    };

    void loadData();
  }, [id]);

  const handleInscribe = async () => {
    if (!tournament || !myTeam?.id) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await authFetch(`/tournaments/${id}/inscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: myTeam.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "No se pudo completar la inscripción.");
      }

      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInscription = async () => {
    if (!tournament || !myTeam?.id) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await authFetch(`/tournaments/${id}/inscribe/${myTeam.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "No se pudo cancelar la inscripción.");
      }

      await fetchDetails();
      setShowCancelModal(false);
    } catch (err: any) {
      setErrorMessage(err.message);
      setShowCancelModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateFixture = async () => {
    if (!tournament) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await authFetch(`/tournaments/${id}/generate-fixture`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al generar fixture.");
      }
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // RENDERIZADOR COMPACTO UNIFICADO (HLTV STYLE)
  const renderMatchCard = (match: TournamentSeries) => {
    const isLive = match.status === "IN_PROGRESS";
    return (
      <div
        key={match.id}
        className={`hltv-match-card-wrapper ${isLive ? "hltv-card-live-border" : ""}`}
        onClick={() => navigate(`/series/${match.id}`)}
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

  if (loading || checkingTeam)
    return <div className="loading-container">Cargando torneo...</div>;
  if (!tournament)
    return (
      <div className="error-container">
        ⚠️ {errorMessage || "Torneo no encontrado."}
      </div>
    );

  const isAlreadyInscribed =
    myTeam && tournament.teams.some((t) => t.id === myTeam.id);
  const formatPrice = (fee: string) =>
    parseFloat(fee) === 0 ? "Gratuito" : `$${parseFloat(fee).toLocaleString()}`;

  const uniqueStages = Array.from(new Set(series.map((s) => s.stage_name)));
  const filteredSeries = series.filter((s) => s.stage_name === activeStageTab);

  return (
    <div
      className={`page-container tournament-details-page fade-in ${tournament.status !== "PREPARING" ? "layout-competition-view" : ""}`}
    >
      <div className="tournament-top-bar">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>

        {tournament.status === "PREPARING" &&
          tournament.currentTeamsCount >= 2 && (
            <button
              className="btn btn-primary btn-test-fixture"
              onClick={handleGenerateFixture}
              disabled={actionLoading}
            >
              <Play
                size={14}
                style={{ marginRight: "0.4rem", display: "inline" }}
              />{" "}
              GENERAR FIXTURE
            </button>
          )}
      </div>

      {tournament.status === "PREPARING" ? (
        <div className="tournament-grid-layout">
          <div className="tournament-main-card">
            <span className="badge-status status-preparing">
              Inscripciones Abiertas
            </span>
            <h1 className="tournament-title">{tournament.name}</h1>
            <p className="tournament-desc">
              {tournament.description || "Sin descripción disponible."}
            </p>

            <div className="info-meta-grid">
              <div className="meta-item">
                <Calendar size={20} className="icon-purple" />
                <div>
                  <label>Inicio del Torneo</label>
                  <span>
                    {new Date(tournament.start_date).toLocaleDateString(
                      "es-AR",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  </span>
                </div>
              </div>
              <div className="meta-item">
                <Users size={20} className="icon-purple" />
                <div>
                  <label>Cupos Disponibles</label>
                  <span>
                    {tournament.currentTeamsCount} / {tournament.max_teams}{" "}
                    Equipos
                  </span>
                </div>
              </div>
              <div className="meta-item">
                <Trophy size={20} className="icon-purple" />
                <div>
                  <label>Premios / Prize Pool</label>
                  <span>{tournament.prize_pool || "Inscripción de Honor"}</span>
                </div>
              </div>
              <div className="meta-item">
                <label className="text-label">Costo de inscripción:</label>
                <span className="fee-text">
                  {formatPrice(tournament.entry_fee)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="alert-message error-alert">⚠️ {errorMessage}</div>
            )}

            <div className="tournament-actions-panel">
              {myTeam ? (
                myTeam.owner.id === user?.id ? (
                  myTeam.members.length >= 0 ? (
                    isAlreadyInscribed ? (
                      <button
                        className="btn btn-danger btn-lg w-100"
                        onClick={() => setShowCancelModal(true)}
                        disabled={actionLoading}
                      >
                        DAR DE BAJA EQUIPO
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-lg w-100"
                        onClick={handleInscribe}
                        disabled={
                          actionLoading ||
                          tournament.currentTeamsCount >= tournament.max_teams
                        }
                      >
                        INSCRIBIR MI EQUIPO
                      </button>
                    )
                  ) : (
                    <div className="warning-box">
                      <ShieldAlert size={18} />
                      <p>
                        El roster debe tener miembros activos para competir.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="warning-box">
                    <ShieldAlert size={18} />
                    <p>
                      Solo el capitán ({myTeam.owner.username}) puede inscribir
                      al equipo.
                    </p>
                  </div>
                )
              ) : (
                <div className="warning-box">
                  <ShieldAlert size={18} />
                  <p>
                    Necesitás pertenecer o ser capitán de un equipo para poder
                    inscribirte.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="tournament-sidebar">
            <h3 className="sidebar-title">
              Equipos Inscriptos ({tournament.currentTeamsCount})
            </h3>
            <div className="participants-list">
              {tournament.teams.map((team) => (
                <div key={team.id} className="participant-item-row">
                  <div className="item-row-info">
                    <div className="participant-avatar-placeholder">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="participant-name">{team.name}</span>
                      <span className="participant-subtext">
                        {team.memberCount} Miembros
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rank-badge rank-${team.avgTier.toLowerCase()}`}
                  >
                    Tier: {team.avgTier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="competition-workspace">
          <div className="competition-minimal-header">
            <div>
              <h1 className="comp-title">{tournament.name}</h1>
              <p className="comp-subtitle">
                {tournament.type} • TIER {tournament.skill_tier} • ETAPA ACTUAL:{" "}
                <span className="highlight-purple">
                  {tournament.current_stage}
                </span>
              </p>
            </div>
            <div className="comp-mini-stats">
              <div className="mini-stat-pill">
                <Trophy size={14} />{" "}
                <span>{tournament.prize_pool || "Honor"}</span>
              </div>
              <div className="mini-stat-pill">
                <Users size={14} />{" "}
                <span>{tournament.currentTeamsCount} Escuadras</span>
              </div>
            </div>
          </div>

          {/* === INTERFAZ MODO LIGA (HLTV TABS) === */}
          {tournament.type === "LEAGUE" && (
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
          )}

          {/* === INTERFAZ MODO COPA (ÁRBOL ELÁSTICO SIMÉTRICO) === */}
          {tournament.type === "CUP" &&
            (() => {
              const roundsMap = series.reduce(
                (acc: Record<number, TournamentSeries[]>, item) => {
                  if (!acc[item.round_order]) acc[item.round_order] = [];
                  acc[item.round_order].push(item);
                  return acc;
                },
                {},
              );

              const totalRoundsCount = Object.keys(roundsMap).length;
              if (totalRoundsCount === 0)
                return (
                  <div className="empty-list-text">
                    No hay llaves generadas.
                  </div>
                );

              const finalRoundOrder = Math.max(
                ...Object.keys(roundsMap).map(Number),
              );
              const finalMatch = roundsMap[finalRoundOrder]?.[0];
              const previousRoundsOrders = Object.keys(roundsMap)
                .map(Number)
                .filter((r) => r !== finalRoundOrder)
                .sort((a, b) => a - b);

              return (
                <div className="bracket-viewport">
                  <div
                    className="cup-mirror-elastic-grid"
                    style={{
                      gridTemplateColumns: `repeat(${previousRoundsOrders.length}, 1fr) 1.2fr repeat(${previousRoundsOrders.length}, 1fr)`,
                    }}
                  >
                    {/* ALA IZQUIERDA: Primera mitad de cada ronda */}
                    {previousRoundsOrders.map((rOrder) => {
                      const roundMatches = roundsMap[rOrder] || [];
                      const leftBranchMatches = roundMatches.slice(
                        0,
                        Math.ceil(roundMatches.length / 2),
                      );
                      const stageTitle =
                        leftBranchMatches[0]?.stage_name || `Ronda ${rOrder}`;
                      return (
                        <div
                          key={`left-${rOrder}`}
                          className="cup-elastic-column"
                        >
                          <h3 className="cup-stage-title">{stageTitle}</h3>
                          <div className="matches-column-flow">
                            {leftBranchMatches.map((match) =>
                              renderMatchCard(match),
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* CENTRO: LA GRAN FINAL */}
                    <div className="cup-elastic-column branch-center-highlight">
                      <div className="trophy-cup-icon-wrapper">
                        <Trophy size={28} className="gold-glow-icon" />
                      </div>
                      <h3 className="cup-stage-title grand-final-title">
                        Gran Final
                      </h3>
                      {finalMatch ? (
                        renderMatchCard(finalMatch)
                      ) : (
                        <div className="hltv-match-card-wrapper empty-card">
                          Por Definir
                        </div>
                      )}
                    </div>

                    {/* ALA DERECHA: Segunda mitad en espejo inversamente cronológico */}
                    {[...previousRoundsOrders].reverse().map((rOrder) => {
                      const roundMatches = roundsMap[rOrder] || [];
                      const rightBranchMatches = roundMatches.slice(
                        Math.ceil(roundMatches.length / 2),
                      );
                      const stageTitle =
                        rightBranchMatches[0]?.stage_name || `Ronda ${rOrder}`;
                      return (
                        <div
                          key={`right-${rOrder}`}
                          className="cup-elastic-column"
                        >
                          <h3 className="cup-stage-title">{stageTitle}</h3>
                          <div className="matches-column-flow">
                            {rightBranchMatches.map((match) =>
                              renderMatchCard(match),
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {showCancelModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              padding: "2.5rem",
              borderRadius: "8px",
              maxWidth: "420px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--danger, #ef4444)",
                marginBottom: "1rem",
                fontSize: "1.35rem",
                fontWeight: "800",
              }}
            >
              ¿RETIRAR EQUIPO?
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                marginBottom: "2.5rem",
              }}
            >
              ¿Estás seguro de que querés dar de baja a{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {myTeam?.name}
              </strong>
              ?
            </p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setShowCancelModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancelInscription}
                disabled={actionLoading}
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
