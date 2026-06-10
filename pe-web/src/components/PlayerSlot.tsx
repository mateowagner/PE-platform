import { useState } from "react";
import { UserX } from "lucide-react";
import { useApi } from "../hooks/useApi";
import type { Member } from "../types";

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
  member?: Member;
  index: number;
  isOwner: boolean;
  teamId: string;
  isCurrentUserCaptain: boolean;
  onMemberRemoved: (updatedTeam: any) => void;
}) {
  const { authFetch } = useApi();
  const [kicking, setKicking] = useState(false);
  const [showModal, setShowModal] = useState(false); // Estado para el modal personalizado

  if (!member) {
    return (
      <div className="player-slot empty">
        <span className="slot-number">{index + 1}</span>
        <div className="player-avatar empty-avatar" />
        <span className="empty-slot-text">Lugar disponible</span>
      </div>
    );
  }

  const handleKick = async () => {
    setKicking(true);
    try {
      const res = await authFetch(`/teams/${teamId}/members/${member.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo expulsar al miembro");
      }

      onMemberRemoved(data);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setKicking(false);
    }
  };

  return (
    <div className="player-slot filled" style={{ position: "relative" }}>
      <span className="slot-number">{index + 1}</span>
      <div className="player-avatar">
        {member.username.charAt(0).toUpperCase()}
      </div>
      <div className="player-info">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="player-username">{member.username}</span>
          {isOwner && <span className="player-owner-badge">Capitán</span>}
        </div>
        {member.riotGameName ? (
          <span className="player-riot-id">
            {member.riotGameName}#{member.riotTagLine}
          </span>
        ) : (
          <span className="player-riot-id">Sin cuenta Riot vinculada</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div className="player-rank">
          {member.soloTier ? (
            <>
              <img
                src={RANK_EMBLEMS[member.soloTier]}
                alt={member.soloTier}
                className="slot-rank-emblem"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="slot-rank-text">
                {TIER_ABBREV[member.soloTier]} {member.soloRank}
              </span>
            </>
          ) : (
            <span className="slot-rank-text">—</span>
          )}
        </div>

        {isCurrentUserCaptain && !isOwner && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted, #6c757d)",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--danger, #ff4d4d)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted, #6c757d)")
            }
            title="Expulsar jugador"
          >
            <UserX size={18} />
          </button>
        )}
      </div>

      {/* --- MODAL PERSONALIZADO DE CONFIRMACIÓN --- */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
                marginBottom: "1rem",
                fontSize: "1.25rem",
              }}
            >
              ¿EXPULSAR JUGADOR?
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                marginBottom: "2rem",
                lineHeight: "1.5",
              }}
            >
              Estás seguro de que querés expulsar a{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {member.username}
              </strong>{" "}
              del equipo?
            </p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
                disabled={kicking}
                style={{ minWidth: "100px" }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleKick}
                disabled={kicking}
                style={{ minWidth: "100px" }}
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
