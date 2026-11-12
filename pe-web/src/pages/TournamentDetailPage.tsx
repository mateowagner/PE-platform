// pe-web/src/pages/TournamentDetailPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { AdminTournamentPanel } from "../components/AdminTournamentPanel";
import { TournamentHeader } from "../components/TournamentHeader";
import { TournamentSidebar } from "../components/TournamentSidebar";
import { CupBracket } from "../components/CupBracket";
import { LeagueWorkspace } from "../components/LeagueWorkspace";
import { CancelInscriptionModal } from "../components/CancelInscriptionModal";
import { EditTournamentModal } from "../components/EditTournamentModal";
import { RosterSelectorModal } from "../components/RosterSelectorModal";
import { ChampionTrophyModal } from "../components/ChampionTrophyModal";
import { ArrowLeft, Trophy, Users, ShieldAlert } from "lucide-react";
import { useTournaments } from "../hooks/useTournaments";
import { useTeams } from "../hooks/useTeams";
import { apiClient } from "../config/apiClient";
import type {
  TournamentDetails,
  TournamentSeries,
  Team,
  Member,
} from "../types";
import axios from "axios";
import "./TournamentDetailPage.css";

interface LeagueStanding {
  pos: number;
  team: Team;
  pts: number;
  pj: number;
  pg: number;
  pp: number;
  diffMaps: number;
}

interface RosterApiResponse {
  user: Member;
  is_substitute: boolean;
}

export default function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [series, setSeries] = useState<TournamentSeries[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [checkingTeam, setCheckingTeam] = useState(true);

  // Roster Oficial Inscripto
  const [registeredStarters, setRegisteredStarters] = useState<Member[]>([]);
  const [registeredSubs, setRegisteredSubs] = useState<Member[]>([]);

  // Modales
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [overrideSeriesId, setOverrideSeriesId] = useState<string | null>(null);

  const {
    getTournamentDetails,
    getTournamentSeries,
    inscribeTeam,
    cancelInscription,
    deleteTournament,
  } = useTournaments();

  const { getMyTeam } = useTeams();

  const fetchRosterData = async (tourneyId: string, teamId: string) => {
    try {
      const res = await apiClient.get<RosterApiResponse[]>(
        `/rosters/tournament/${tourneyId}?teamId=${teamId}`,
      );
      if (Array.isArray(res.data)) {
        const starters = res.data
          .filter((r) => !r.is_substitute)
          .map((r) => r.user);
        const subs = res.data.filter((r) => r.is_substitute).map((r) => r.user);

        setRegisteredStarters(starters);
        setRegisteredSubs(subs);
      }
    } catch {
      setRegisteredStarters([]);
      setRegisteredSubs([]);
    }
  };

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

        if (dataDetails.type === "LEAGUE") {
          try {
            const { data: standingsData } = await apiClient.get<unknown[]>(
              `/standings/tournament/${id}`,
            );
            const formattedStandings: LeagueStanding[] = (
              standingsData as Record<string, unknown>[]
            ).map((s, idx) => ({
              pos: idx + 1,
              team: s.team as Team,
              pts: s.points as number,
              pj: s.series_played as number,
              pg: s.series_won as number,
              pp: s.series_lost as number,
              diffMaps:
                ((s.matches_won as number) || 0) -
                ((s.matches_lost as number) || 0),
            }));
            setStandings(formattedStandings);
          } catch {
            setStandings([]);
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
        await fetchDetails();

        try {
          const teamData = await getMyTeam();
          setMyTeam(teamData);
          if (teamData?.id && id) {
            await fetchRosterData(id, teamData.id);
          }
        } catch {
          setMyTeam(null);
        }
      } catch {
        setErrorMessage("No se pudo cargar la información inicial.");
      } finally {
        setCheckingTeam(false);
      }
    };

    if (id) void loadData();
  }, [id]);

  const handleConfirmRoster = async (starters: string[], subs: string[]) => {
    if (!id || !myTeam) return;
    setActionLoading(true);

    try {
      const isAlreadyInscribed = tournament?.teams.some(
        (t) => t.id === myTeam.id,
      );
      if (!isAlreadyInscribed) {
        await inscribeTeam(id, myTeam.id);
      }

      const membersPayload = [
        ...starters.map((userId) => ({ userId, isSubstitute: false })),
        ...subs.map((userId) => ({ userId, isSubstitute: true })),
      ];

      await apiClient.post(`/rosters/tournament/${id}`, {
        teamId: myTeam.id,
        members: membersPayload,
      });

      await fetchDetails();
      await fetchRosterData(id, myTeam.id);
      setShowRosterModal(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          Array.isArray(err.response?.data?.message)
            ? err.response?.data?.message.join(", ")
            : err.response?.data?.message ||
                "Fallo en la confirmación de la plantilla.",
        );
      }
      throw new Error("Error de conexión al guardar el roster.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInscription = async () => {
    if (!tournament || !myTeam?.id || !id) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      await cancelInscription(id, myTeam.id);
      setRegisteredStarters([]);
      setRegisteredSubs([]);
      await fetchDetails();
      setShowCancelModal(false);
    } catch (err: unknown) {
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
    if (!id) return;
    const confirmed = window.confirm(
      `🚨 ¡ALERTA! ¿Estás seguro de que deseas eliminar el torneo "${tournament?.name}"?`,
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await deleteTournament(id);
      navigate("/tournaments");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMessage(error.message || "Error al intentar eliminar el torneo.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminOverrideWinner = async (winnerTeamId: string) => {
    if (!overrideSeriesId) return;
    try {
      setActionLoading(true);
      await apiClient.post(`/series/${overrideSeriesId}/override-winner`, {
        winnerTeamId,
      });
      setOverrideSeriesId(null);
      await fetchDetails();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "Error al resolver la serie.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const winningTeamData = useMemo(() => {
    if (tournament?.status !== "FINISHED") return null;

    if (tournament.type === "CUP") {
      const finalSeries = series.find((s) => s.stage_name === "Gran Final");
      return finalSeries?.winner ? (finalSeries.winner as Team) : null;
    }

    if (tournament.type === "LEAGUE" && standings.length > 0) {
      return standings[0].team;
    }

    return null;
  }, [tournament, series, standings]);

  if (loading || checkingTeam) {
    return (
      <div className="tournament-fullscreen-root loading-wrapper">
        <div className="empty-state">Cargando torneo y escuadras...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tournament-fullscreen-root error-wrapper">
        <div className="auth-error">
          {errorMessage || "Torneo no encontrado."}
        </div>
      </div>
    );
  }

  const isAlreadyInscribed =
    myTeam && tournament.teams.some((t) => t.id === myTeam.id);
  const isAdminOrStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  return (
    <div className="tournament-fullscreen-root fade-in">
      {/* Barra Superior */}
      <div className="tournament-top-strip">
        <button type="button" className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>

        {tournament.status === "FINISHED" && winningTeamData && (
          <button
            type="button"
            className="btn btn-neon-gold"
            onClick={() => setShowChampionModal(true)}
          >
            <Trophy size={16} /> Ver Celebración de Campeón
          </button>
        )}
      </div>

      {/* Panel Admin */}
      {isAdminOrStaff && (
        <div className="admin-zone-bar">
          <div className="admin-title">
            <ShieldAlert size={18} color="#ef4444" />
            <span>PANEL DE CONTROL ADMINISTRATIVO</span>
          </div>

          <div className="admin-actions">
            <AdminTournamentPanel
              tournament={tournament}
              onTournamentStarted={async (updatedTournament) => {
                setTournament(updatedTournament as TournamentDetails);
                await fetchDetails();
              }}
            />

            {tournament.status === "PREPARING" && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="btn btn-outline btn-sm"
              >
                Editar Datos
              </button>
            )}

            <button
              type="button"
              onClick={handleDeleteTournament}
              disabled={actionLoading || tournament.status !== "PREPARING"}
              className="btn btn-danger btn-sm"
            >
              {actionLoading ? "Eliminando..." : "Eliminar Torneo"}
            </button>
          </div>
        </div>
      )}

      {/* Banner Principal de Torneo */}
      <div className="competition-banner-full">
        <div className="banner-side-empty" />
        <div className="banner-center-info">
          <h1 className="comp-title">{tournament.name}</h1>
          <p className="comp-subtitle">
            {tournament.type === "LEAGUE"
              ? "LIGA OFICIAL"
              : "COPA ELIMINATORIA"}{" "}
            • TIER {tournament.skill_tier}
          </p>
        </div>
        <div className="comp-mini-stats">
          <div className="mini-stat-pill">
            <Trophy size={14} />{" "}
            <span>{tournament.prize_pool || "Gloria & Puntos"}</span>
          </div>
          <div className="mini-stat-pill">
            <Users size={14} />{" "}
            <span>{tournament.currentTeamsCount} Escuadras</span>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      {tournament.status === "PREPARING" ? (
        <div className="tournament-grid-layout">
          <TournamentHeader
            tournament={tournament}
            user={user}
            myTeam={myTeam}
            isAlreadyInscribed={!!isAlreadyInscribed}
            registeredStarters={registeredStarters}
            registeredSubs={registeredSubs}
            actionLoading={actionLoading}
            onInscribe={() => setShowRosterModal(true)}
            onEditRoster={() => setShowRosterModal(true)}
            onCancel={() => setShowCancelModal(true)}
          />
          <TournamentSidebar
            teams={tournament.teams}
            currentTeamsCount={tournament.currentTeamsCount}
          />
        </div>
      ) : (
        <div className="competition-workspace-full">
          {tournament.type === "LEAGUE" && (
            <LeagueWorkspace
              series={series}
              userTeamId={myTeam?.id}
              standings={standings}
              isAdmin={isAdminOrStaff}
              onAdminOverride={(seriesId) => setOverrideSeriesId(seriesId)}
            />
          )}

          {tournament.type === "CUP" && (
            <CupBracket
              series={series}
              onMatchClick={(seriesId) => navigate(`/series/${seriesId}`)}
            />
          )}
        </div>
      )}

      {/* Modal de Selección y Edición de Roster */}
      {showRosterModal && myTeam && (
        <RosterSelectorModal
          tournament={tournament}
          availableMembers={myTeam.members || []}
          initialStarters={registeredStarters.map((m) => m.id)}
          initialSubs={registeredSubs.map((m) => m.id)}
          isOpen={showRosterModal}
          onClose={() => setShowRosterModal(false)}
          onConfirm={handleConfirmRoster}
        />
      )}

      {showCancelModal && (
        <CancelInscriptionModal
          teamName={myTeam?.name}
          isLoading={actionLoading}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={handleCancelInscription}
        />
      )}

      {showEditModal && (
        <EditTournamentModal
          tournament={tournament}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            await fetchDetails();
          }}
        />
      )}

      {showChampionModal && winningTeamData && (
        <ChampionTrophyModal
          tournamentName={tournament.name}
          winnerTeam={winningTeamData}
          starters={winningTeamData.members || []}
          isOpen={showChampionModal}
          onClose={() => setShowChampionModal(false)}
        />
      )}

      {overrideSeriesId && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: "420px" }}>
            <h3 style={{ color: "#f3f4f6", marginBottom: "0.5rem" }}>
              Resolución de Serie
            </h3>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              Selecciona el equipo vencedor para avanzar la llave o computar
              puntos en la tabla.
            </p>
            {(() => {
              const targetSeries = series.find(
                (s) => s.id === overrideSeriesId,
              );
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!targetSeries?.team_a}
                    onClick={() =>
                      handleAdminOverrideWinner(targetSeries?.team_a?.id || "")
                    }
                  >
                    Vencedor: {targetSeries?.team_a?.name || "Equipo A"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!targetSeries?.team_b}
                    onClick={() =>
                      handleAdminOverrideWinner(targetSeries?.team_b?.id || "")
                    }
                  >
                    Vencedor: {targetSeries?.team_b?.name || "Equipo B"}
                  </button>
                </div>
              );
            })()}
            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setOverrideSeriesId(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
