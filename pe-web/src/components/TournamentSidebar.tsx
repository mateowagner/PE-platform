// pe-web/src/components/TournamentSidebar.tsx
import type { TournamentParticipant } from "../types";
import { getTeamLogo, handleImageError } from "../utils/image";
import { Users, Shield } from "lucide-react";
import "./TournamentSidebar.css";

interface TournamentSidebarProps {
  teams: TournamentParticipant[];
  currentTeamsCount: number;
}

export const TournamentSidebar = ({
  teams,
  currentTeamsCount,
}: TournamentSidebarProps) => {
  return (
    <div className="tournament-sidebar">
      <div className="sidebar-header-row">
        <div className="sidebar-title-flex">
          <Users size={16} className="text-cyan" />
          <h3 className="sidebar-title">Equipos Inscriptos</h3>
        </div>
        <span className="teams-count-pill">{currentTeamsCount}</span>
      </div>

      <div className="participants-list">
        {teams.length === 0 ? (
          <div className="empty-teams-sidebar">
            <Shield size={28} className="text-muted" />
            <p>Aún no hay escuadras inscriptas.</p>
          </div>
        ) : (
          teams.map((team: TournamentParticipant) => {
            const rawTier = (team.avgTier || "UNRANKED").toUpperCase();

            return (
              <div
                key={team.id}
                className="participant-item-row"
                title={`Ver escuadra: ${team.name}`}
              >
                <div className="item-row-info">
                  <img
                    src={getTeamLogo(team)}
                    alt={team.name}
                    className="participant-avatar-shield"
                    onError={(e) => handleImageError(e, "/logo.jpeg")}
                  />
                  <div className="participant-text-block">
                    <span className="participant-name truncate">
                      {team.name}
                    </span>
                    <span className="participant-subtext">
                      {team.members?.length || team.memberCount || 0} Miembros
                    </span>
                  </div>
                </div>

                <span className={`rank-badge rank-${rawTier.toLowerCase()}`}>
                  {rawTier}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
