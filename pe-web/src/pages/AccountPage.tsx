// pe-web/src/pages/AccountPage.tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../config/apiClient";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import axios from "axios";
import "./AccountPage.css";

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

const TIER_NAMES: Record<string, string> = {
  UNRANKED: "Sin clasificar",
  IRON: "Hierro",
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
  PLATINUM: "Platino",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Master",
  GRANDMASTER: "Gran Master",
  CHALLENGER: "Challenger",
};

function RankCard({
  label,
  tier,
  rank,
  lp,
}: {
  label: string;
  tier?: string | null;
  rank?: string | null;
  lp?: number | null;
}) {
  if (!tier || tier.toUpperCase() === "UNRANKED") {
    return (
      <div className="rank-card rank-unranked">
        <div className="rank-card-label">{label}</div>
        <div className="rank-unranked-content">
          <div className="rank-emblem-placeholder" />
          <span className="rank-unranked-text">Sin clasificar</span>
        </div>
      </div>
    );
  }

  const normalizedTier = tier.toUpperCase();

  return (
    <div className="rank-card">
      <div className="rank-card-label">{label}</div>
      <div className="rank-card-content">
        <img
          src={RANK_EMBLEMS[normalizedTier] || RANK_EMBLEMS.UNRANKED}
          alt={normalizedTier}
          className="rank-emblem"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="rank-info">
          <span className="rank-tier-name">
            {TIER_NAMES[normalizedTier] ?? normalizedTier} {rank}
          </span>
          <span className="rank-lp">{lp ?? 0} LP</span>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const [riotId, setRiotId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState("");

  const { linkRiotAccount } = useAuth();

  // Revalidar el perfil en la base de datos al montar la página
  useEffect(() => {
    let isMounted = true;
    async function loadFreshUser() {
      try {
        const { data } = await apiClient.get("/users/me");
        if (data && isMounted) {
          updateUser(data);
        }
      } catch {
        // Silencioso si falla background fetch
      }
    }
    void loadFreshUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLinkRiot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError("");
    setLinkSuccess("");
    setLinking(true);

    try {
      const data = await linkRiotAccount(riotId);
      if (data.user) updateUser(data.user);

      setLinkSuccess(`✓ Cuenta vinculada: ${data.gameName}#${data.tagLine}`);
      setRiotId("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setLinkError(
          err.response?.data?.message || "Error al vincular la cuenta",
        );
      } else {
        setLinkError("Error de conexión con el servidor");
      }
    } finally {
      setLinking(false);
    }
  };

  const handleSyncRank = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncSuccess(false);

    try {
      // POST al endpoint de sincronización con Riot API
      const { data } = await apiClient.post("/users/me/sync-rank");

      // Actualizamos inmediatamente el estado en Zustand y localStorage
      if (data) {
        updateUser(data);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSyncError(
          err.response?.data?.message ||
            "No se pudo sincronizar el rango con Riot.",
        );
      } else {
        setSyncError("Error de conexión con el servidor.");
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page-container account-page">
      <h1
        className="section-title"
        style={{ fontSize: "1.6rem", marginBottom: "2rem" }}
      >
        Mi Cuenta
      </h1>

      <div className="account-grid">
        {/* Info básica */}
        <section className="account-card card fade-in">
          <h2 className="account-section-title">Información</h2>
          <div className="account-fields">
            <div className="input-group">
              <label className="input-label">Usuario</label>
              <input className="input" value={user?.username ?? ""} readOnly />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" value={user?.email ?? ""} readOnly />
            </div>
          </div>
        </section>

        {/* Riot account */}
        <section className="account-card card fade-in-delay-1">
          <div className="account-card-header-row">
            <h2 className="account-section-title">Cuenta Riot Games</h2>
            {user?.riotGameName && (
              <button
                type="button"
                className="btn-sync-rank"
                onClick={handleSyncRank}
                disabled={syncing}
                title="Actualizar divisiones y LP desde Riot Games"
              >
                <RefreshCw
                  size={14}
                  className={syncing ? "animate-spin" : ""}
                />
                <span>{syncing ? "Sincronizando..." : "Actualizar Rango"}</span>
              </button>
            )}
          </div>

          {user?.riotGameName ? (
            <div className="riot-linked">
              <div className="riot-id-display">
                <span className="riot-id-label">RIOT ID</span>
                <span className="riot-id-value">
                  {user.riotGameName}
                  <span className="riot-id-tag">#{user.riotTagLine}</span>
                </span>
                <span className="riot-region-text">
                  Región: {user.riotRegion?.toUpperCase() ?? "LAS"}
                </span>
              </div>

              <div className="riot-meta-row">
                <span className="rank-points-badge">
                  {user.rankPoints ?? 0} puntos de clasificación
                </span>
              </div>

              {syncSuccess && (
                <div className="link-success flex items-center gap-1">
                  <CheckCircle2 size={15} /> Rangos actualizados correctamente
                  desde Riot Games.
                </div>
              )}
              {syncError && <div className="auth-error">{syncError}</div>}

              <div className="ranks-grid">
                <RankCard
                  label="Solo / Duo"
                  tier={user.soloTier}
                  rank={user.soloRank}
                  lp={user.soloLp}
                />
                <RankCard
                  label="Flex 5v5"
                  tier={user.flexTier}
                  rank={user.flexRank}
                  lp={user.flexLp}
                />
              </div>
            </div>
          ) : (
            <div className="riot-unlinked">
              <p className="riot-unlinked-text">
                Necesitás vincular tu cuenta de Riot Games para participar en
                torneos y equipos.
              </p>
              <form onSubmit={handleLinkRiot} className="riot-link-form">
                <div className="input-group">
                  <label className="input-label">Riot ID</label>
                  <input
                    className="input"
                    placeholder="NombreInvocador#TAG"
                    value={riotId}
                    onChange={(e) => setRiotId(e.target.value)}
                    required
                  />
                  <span className="input-hint">Ejemplo: LordKing#ARIO</span>
                </div>
                {linkError && <div className="auth-error">{linkError}</div>}
                {linkSuccess && (
                  <div className="link-success">{linkSuccess}</div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={linking}
                >
                  {linking ? "Vinculando..." : "Vincular cuenta"}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
