import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useApi } from "../hooks/useApi";
import "./TeamPage.css";
import type { Team } from "../types";
import CreateTeamModal from "../components/CreateTeamModal";
import PlayerSlot from "../components/PlayerSlot";
import SendInvitationForm from "../components/SendInvitationForm";
const MAX_SLOTS = 5;

export default function TeamPage() {
  const { user, updateUser } = useAuthStore();
  const { authFetch } = useApi();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const res = await authFetch("/teams/my-team");
        if (res.ok) {
          const data = (await res.json()) as Team | null;
          setTeam(data);
        }
      } catch {
        /* sin equipo */
      } finally {
        setLoading(false);
      }
    };
    void fetchTeam();
  }, []);

  const handleTeamCreated = (newTeam: Team) => {
    setTeam(newTeam);
    setShowModal(false);
    updateUser({ teamId: newTeam.id });
  };
  const handleLeaveTeam = async () => {
    if (!user) return;

    try {
      const res = await authFetch("/teams/leave", {
        method: "POST",
      });
      if (res.ok) {
        setTeam(null);
        updateUser({ teamId: undefined });
      }
    } catch (error) {
      console.error("Error leaving team:", error);
    }
  };

  if (loading) {
    return (
      <div className="page-container team-page">
        <div className="no-team-container">
          <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page-container team-page">
        <div className="no-team-container fade-in">
          <img src="/logo.jpeg" alt="Sin equipo" className="no-team-logo" />
          <div>
            <h2 className="no-team-title">No tenés equipo</h2>
            <p className="no-team-subtitle">
              Creá tu equipo para poder inscribirte en torneos y ligas oficiales
              de Pulpito Esports.
            </p>
          </div>
          {user?.riotGameName ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowModal(true)}
            >
              Crear equipo
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Necesitás vincular tu cuenta de Riot antes de crear un equipo.
              </p>
              <a href="/account" className="btn btn-outline">
                Vincular Riot ID
              </a>
            </div>
          )}
        </div>

        {showModal && (
          <CreateTeamModal
            onClose={() => setShowModal(false)}
            onCreated={handleTeamCreated}
          />
        )}
      </div>
    );
  }

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => team.members[i]);

  return (
    <div className="page-container team-page">
      <div className="team-header fade-in">
        <div className="team-header-info">
          <img
            src={team.logoUrl ?? "/logo.jpeg"}
            alt={team.name}
            className="team-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.jpeg";
            }}
          />
          <div>
            <h1 className="team-name">{team.name}</h1>
            <p className="team-owner">
              Capitán: <span>{team.owner.username}</span>
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="team-rank-points">
            {team.members.length}/{MAX_SLOTS} jugadores
          </p>
          <p className="team-rank-points" style={{ marginTop: "0.25rem" }}>
            {team.totalRankPoints} pts clasificación
          </p>
        </div>
      </div>

      <h2 className="section-title roster-title">Roster</h2>
      <div className="roster-grid fade-in-delay-1">
        {slots.map((member, i) => (
          <PlayerSlot
            key={member?.id ?? `empty-${i}`}
            member={member}
            index={i}
            isOwner={member?.id === team.owner.id}
            teamId={team?.id || ""}
            isCurrentUserCaptain={user?.id === team.owner.id}
            onMemberRemoved={setTeam}
          />
        ))}
      </div>
      {/* Si es el capitán, ve esto */}
      {user?.id === team.owner.id && (
        <div className="fade-in-delay-2" style={{ marginTop: "2rem" }}>
          <SendInvitationForm teamId={team.id} />
        </div>
      )}

      {/* Si NO es el capitán, ve esto */}
      {user?.id !== team.owner.id && (
        <div
          className="fade-in-delay-2"
          style={{
            marginTop: "3rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button className="btn btn-danger" onClick={handleLeaveTeam}>
            ABANDONAR EQUIPO
          </button>
        </div>
      )}
    </div>
  );
}
