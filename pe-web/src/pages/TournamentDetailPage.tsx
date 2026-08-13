import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { AdminTournamentPanel } from "../components/AdminTournamentPanel";
import { TournamentHeader } from "../components/TournamentHeader";
import { TournamentSidebar } from "../components/TournamentSidebar";
import { ArrowLeft, Trophy, Users } from "lucide-react";
import "./TournamentDetailPage.css";
import type { TournamentDetails, TournamentSeries } from "../types";
import { useTournaments } from "../hooks/useTournaments";
import { useTeams } from "../hooks/useTeams";
import axios from "axios";
import { CupBracket } from "../components/CupBracket";
import { LeagueMatchList } from "../components/LeagueMatchList";
import { CancelInscriptionModal } from "../components/CancelInscriptionModal";
import { EditTournamentModal } from "../components/EditTournamentModal";

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
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    getTournamentDetails,
    getTournamentSeries,
    inscribeTeam,
    cancelInscription,
    deleteTournament,
  } = useTournaments();

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
        } catch {
          setMyTeam(null);
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
      await fetchDetails();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || "No se pudo completar la inscripción.",
        );
      } else {
        setErrorMessage("Error de conexión con el servidor.");
      }
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
    if (!id) return;

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
      setActionLoading(false);
    }
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
            <AdminTournamentPanel
              tournament={tournament}
              onTournamentStarted={async (updatedTournament) => {
                setTournament(updatedTournament as TournamentDetails);
                await fetchDetails();
              }}
            />

            {tournament.status === "PREPARING" && (
              <button
                onClick={() => setShowEditModal(true)}
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
          <TournamentHeader
            tournament={tournament}
            user={user}
            myTeam={myTeam}
            isAlreadyInscribed={!!isAlreadyInscribed}
            actionLoading={actionLoading}
            onInscribe={handleInscribe}
            onCancel={() => setShowCancelModal(true)}
          />
          <TournamentSidebar
            teams={tournament.teams}
            currentTeamsCount={tournament.currentTeamsCount}
          />
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

          {tournament.type === "LEAGUE" && (
            <LeagueMatchList
              series={series}
              onMatchClick={(id) => navigate(`/series/${id}`)}
            />
          )}

          {tournament.type === "CUP" && (
            <CupBracket
              series={series}
              onMatchClick={(id) => navigate(`/series/${id}`)}
            />
          )}
        </div>
      )}

      {showCancelModal && (
        <CancelInscriptionModal
          teamName={myTeam?.name}
          isLoading={actionLoading}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={handleCancelInscription}
        />
      )}
      {/* NUEVO MODAL DE EDICIÓN */}
      {showEditModal && (
        <EditTournamentModal
          tournament={tournament}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            await fetchDetails(); // Recarga la vista con los nuevos datos
          }}
        />
      )}
    </div>
  );
}
