// pe-web/src/components/ChampionTrophyModal.tsx
import type { Team, Member } from "../types";
import { Trophy, Sparkles, X } from "lucide-react";
import "./ChampionTrophyModal.css";

interface ChampionTrophyModalProps {
  tournamentName: string;
  winnerTeam: Team;
  starters: Member[];
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_ICONS = ["TOP", "JGL", "MID", "ADC", "SUP"];

export const ChampionTrophyModal = ({
  tournamentName,
  winnerTeam,
  starters,
  isOpen,
  onClose,
}: ChampionTrophyModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="champion-modal-backdrop">
      <div className="confetti-wrapper">
        <div className="confetti-particle p1" />
        <div className="confetti-particle p2" />
        <div className="confetti-particle p3" />
        <div className="confetti-particle p4" />
      </div>

      <div className="champion-card-container">
        <button className="btn-close-champion" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="trophy-glow-icon">
          <Trophy size={64} className="trophy-svg" />
          <Sparkles size={24} className="sparkle-svg" />
        </div>

        <span className="champion-badge">CAMPEÓN OFICIAL</span>
        <h1 className="champion-team-name">{winnerTeam.name}</h1>
        <p className="champion-tournament-sub">{tournamentName}</p>

        <div className="champion-roster-display">
          <h4 className="roster-lineup-title">Alineación Consagrada</h4>
          <div className="starters-cards-row">
            {starters.slice(0, 5).map((player, idx) => (
              <div key={player.id} className="player-trophy-card">
                <span className="role-tag">{ROLE_ICONS[idx] || "TIT"}</span>
                <span className="player-ign">{player.username}</span>
                <span className="player-riot-tag">
                  {player.riotGameName
                    ? `${player.riotGameName}#${player.riotTagLine}`
                    : "Jugador"}
                </span>
                <div className="player-tier-badge">
                  {player.soloTier || "DIAMANTE"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
