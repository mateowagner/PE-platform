import type { TournamentParticipant } from "../types";

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
      <h3 className="sidebar-title">
        Equipos Inscriptos ({currentTeamsCount})
      </h3>
      <div className="participants-list">
        {teams.map((team: TournamentParticipant) => (
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
            <span
              className={`rank-badge rank-${team.avgTier?.toLowerCase() || "unranked"}`}
            >
              Tier: {team.avgTier || "S/D"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
