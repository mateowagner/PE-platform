// pe-web/src/components/PlayerSlot.tsx
import { useState } from "react";
import { useTeams } from "../hooks/useTeams";
import axios from "axios";
import type { Member } from "../types";
import { UserX } from "lucide-react";
import "./PlayerSlot.css";

const RANK_EMBLEMS: Record<string, string> = {
  UNRANKED:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/unranked.png",
  IRON: "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/iron.png",
  BRONZE:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/bronze.png",
  SILVER:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/silver.png",
  GOLD: "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/gold.png",
  PLATINUM:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/platinum.png",
  EMERALD:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/emerald.png",
  DIAMOND:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/diamond.png",
  MASTER:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/master.png",
  GRANDMASTER:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/grandmaster.png",
  CHALLENGER:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/challenger.png",
};

const TIER_ABBREV: Record<string, string> = {
  UNRANKED: "UR",
  IRON: "IR",
  BRONZE: "BR",
  SILVER: "SL",
  GOLD: "GD",
  PLATINUM: "PT",
  EMERALD: "EM",
  DIAMOND: "DM",
  MASTER: "M",
  GRANDMASTER: "GM",
  CHALLENGER: "CH",
};

export default function PlayerSlot({
  member,
  index,
  isOwner,
  teamId,
  isCurrentUserCaptain,
  onMemberRemoved,
}: {
  member: Member;
  index: number;
  isOwner: boolean;
  teamId: string;
  isCurrentUserCaptain: boolean;
  onMemberRemoved: (updatedTeam: any) => void;
}) {
  const { kickMember } = useTeams();
  const [kicking, setKicking] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleKick = async () => {
    if (!member) return;
    setKicking(true);

    try {
      const updatedTeam = await kickMember(teamId, member.id);
      onMemberRemoved(updatedTeam);
      setShowModal(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "No se pudo expulsar al miembro");
      } else {
        alert("Error de conexión");
      }
    } finally {
      setKicking(false);
    }
  };

  const tierKey = member.soloTier?.toUpperCase() || "UNRANKED";

  return (
    <div className="player-slot-row">
      <div className="slot-left-meta">
        <span className="slot-order-number">{index + 1}</span>
        <div className="player-avatar-circle">
          {member.username.charAt(0).toUpperCase()}
        </div>
        <div className="player-name-wrapper">
          <div className="player-header-line">
            <span className="player-username-text">{member.username}</span>
            {isOwner && <span className="captain-tag">Capitán</span>}
          </div>
          <span className="player-riot-tagline">
            {member.riotGameName
              ? `${member.riotGameName}#${member.riotTagLine}`
              : "Sin cuenta Riot vinculada"}
          </span>
        </div>
      </div>

      <div className="slot-right-actions">
        <div className="player-tier-capsule">
          {member.soloTier ? (
            <>
              <img
                src={RANK_EMBLEMS[tierKey] || RANK_EMBLEMS.UNRANKED}
                alt={tierKey}
                className="slot-rank-emblem"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="slot-rank-name">
                {TIER_ABBREV[tierKey] || "UR"} {member.soloRank || ""}
              </span>
            </>
          ) : (
            <span className="slot-rank-name">—</span>
          )}
        </div>

        {isCurrentUserCaptain && !isOwner && (
          <button
            type="button"
            className="btn-kick-member"
            onClick={() => setShowModal(true)}
            title="Expulsar jugador"
          >
            <UserX size={17} />
          </button>
        )}
      </div>

      {/* Modal de Confirmación de Expulsión */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-container modal-compact"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title" style={{ color: "#ef4444" }}>
              ¿Expulsar Jugador?
            </h3>
            <p className="modal-subtitle" style={{ marginTop: "0.5rem" }}>
              ¿Estás seguro de que deseas retirar a{" "}
              <strong style={{ color: "#ffffff" }}>{member.username}</strong> de
              la escuadra oficial?
            </p>
            <div className="modal-footer" style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
                disabled={kicking}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleKick}
                disabled={kicking}
              >
                {kicking ? "Expulsando..." : "Expulsar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
