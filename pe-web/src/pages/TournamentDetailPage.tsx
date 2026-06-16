import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { AdminTournamentPanel } from "../components/AdminTournamentPanel";
import {
  Calendar,
  Users,
  Trophy,
  ShieldAlert,
  ArrowLeft,
  LayoutGrid,
  Eye,
} from "lucide-react";
import "./TournamentDetailPage.css";
import type { TournamentDetails, TournamentSeries } from "../types";
import { useTournament } from "../hooks/useTournaments";
import { useTeams } from "../hooks/useTeams";
import axios from "axios";

export default function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [series, setSeries] = useState<TournamentSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [checkingTeam, setCheckingTeam] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeStageTab, setActiveStageTab] = useState<string>("");
  const {
    getTournamentDetails,
    getTournamentSeries,
    inscribeTeam,
    cancelInscription,
    deleteTournament,
  } = useTournament();

  const { getMyTeam } = useTeams();
  const fetchDetails = async () => {
    if (!id) return;
    try {
      const dataDetails = await getTournamentDetails(id);
      setTournament(dataDetails);

      if (
        dataDetails.status === "STARTED" ||
        dataDetails.status === "FINISHED"
      ) {
        const dataSeries = await getTournamentSeries(id);
        setSeries(dataSeries);

        if (dataSeries.length > 0 && !activeStageTab) {
          setActiveStageTab(dataSeries[0].stage_name);
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
        await fetchDetails();

        // Buscamos el equipo del usuario usando el dominio de equipos
        try {
          const teamData = await getMyTeam();
          setMyTeam(teamData);
        } catch {
          setMyTeam(null); // Si tira 404, no tiene equipo
        }
      } catch (err) {
        setErrorMessage("No se pudo cargar la información necesaria.");
      } finally {
        setCheckingTeam(false);
      }
    };

    if (id) void loadData();
  }, [id]);

  const handleInscribe = async () => {
    if (!tournament || !myTeam?.id || !id) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      await inscribeTeam(id, myTeam.id);
      await fetchDetails(); // Recargamos para que la UI muestre al equipo en la lista
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || "No se pudo completar la inscripción.",
        );
      } else {
        setErrorMessage("Error de conexión con el servidor.");
      }
    } finally {
      setActionLoading(false); // Apagamos el loader del botón, no el de la página
    }
  };

  const handleCancelInscription = async () => {
    if (!tournament || !myTeam?.id || !id) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      await cancelInscription(id, myTeam.id);
      await fetchDetails();
      setShowCancelModal(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || "No se pudo cancelar la inscripción.",
        );
      } else {
        setErrorMessage("Error de conexión con el servidor.");
      }
      setShowCancelModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTournament = async () => {
    // 1. Cláusula de salvaguarda para el enrutador
    if (!id) return;

    // 2. Protección doble: Confirmación nativa antes de golpear la base de datos
    const confirmed = window.confirm(
      `🚨 ¡ALERTA! ¿Estás seguro de que querés eliminar el torneo "${tournament?.name}"?\nEsta acción borrará todas las llaves, series y registros asociados de forma permanente.`,
    );

    if (!confirmed) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      await deleteTournament(id);

      navigate("/tournaments");
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Error al intentar eliminar el torneo. Comprobá tus permisos.",
      );
    } finally {
      setActionLoading(false); // Liberamos la UI en caso de fallo
    }
  };

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

  // ➔ CORRECCIÓN: Forzamos el casteo a string seguro para el método de parseo matemático
  const formatPrice = (fee: string | number) => {
    const numericFee = typeof fee === "string" ? parseFloat(fee) : fee;
    return numericFee === 0 ? "Gratuito" : `$${numericFee.toLocaleString()}`;
  };

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
      </div>

      {user?.role === "ADMIN" && (
        <div
          className="admin-zone-bar"
          style={{
            background: "rgba(124, 58, 237, 0.05)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              fontWeight: "bold",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.5px",
            }}
          >
            ⚙️ PANEL DE CONTROL DE ADMINISTRADOR
          </div>

          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            {/* Se envía y recibe el tipo extendido de manera compatible */}
            <AdminTournamentPanel
              tournament={tournament as any}
              onTournamentStarted={async (updatedTournament) => {
                // 1. Actualizamos el estado local para que el título y el badge cambien instantáneamente
                setTournament(updatedTournament as TournamentDetails);

                // 2. Forzamos la recarga de datos para que la vista vaya a buscar las llaves recién generadas
                await fetchDetails();
              }}
            />

            {tournament.status === "PREPARING" && (
              <button
                onClick={() => console.log("Abrir modal")}
                className="btn btn-outline"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  height: "38px",
                }}
              >
                Editar Datos
              </button>
            )}

            <button
              onClick={handleDeleteTournament}
              disabled={actionLoading || tournament.status !== "PREPARING"}
              className="btn btn-danger"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                height: "38px",
                cursor:
                  tournament.status === "PREPARING" ? "pointer" : "not-allowed",
                opacity: tournament.status === "PREPARING" ? 1 : 0.4,
              }}
            >
              {actionLoading ? "Eliminando..." : "Eliminar Torneo"}
            </button>
          </div>
        </div>
      )}

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
              {tournament.teams.map((team: any) => (
                <div key={team.id} className="participant-item-row">
                  <div className="item-row-info">
                    <div className="participant-avatar-placeholder">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="participant-name">{team.name}</span>
                      <span className="participant-subtext">
                        {team.memberCount || 0} Miembros
                      </span>
                    </div>
                  </div>
                  {/* ➔ CORRECCIÓN: El operador '?.' frena cortocircuitos si avgTier no viene calculado */}
                  <span
                    className={`rank-badge rank-${team.avgTier?.toLowerCase() || "unranked"}`}
                  >
                    Tier: {team.avgTier || "S/D"}
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
                {String(tournament.type)} • TIER {tournament.skill_tier} • ETAPA
                ACTUAL:{" "}
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

          {tournament.type === ("LEAGUE" as any) && (
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

          {tournament.type === ("CUP" as any) &&
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
