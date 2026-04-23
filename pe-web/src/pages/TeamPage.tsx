import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useApi } from "../hooks/useApi";
import "./TeamPage.css";

const RANK_EMBLEMS: Record<string, string> = {
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
  IRON: "Fe",
  BRONZE: "Br",
  SILVER: "Pl",
  GOLD: "Or",
  PLATINUM: "Pt",
  EMERALD: "Esm",
  DIAMOND: "Di",
  MASTER: "M",
  GRANDMASTER: "GM",
  CHALLENGER: "CH",
};

interface Member {
  id: string;
  username: string;
  riotGameName: string;
  riotTagLine: string;
  soloTier: string;
  soloRank: string;
}

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  totalRankPoints: number;
  owner: { id: string; username: string };
  members: Member[];
}

const MAX_SLOTS = 5;

function PlayerSlot({
  member,
  index,
  isOwner,
}: {
  member?: Member;
  index: number;
  isOwner: boolean;
}) {
  if (!member) {
    return (
      <div className="player-slot empty">
        <span className="slot-number">{index + 1}</span>
        <div className="player-avatar empty-avatar" />
        <span className="empty-slot-text">Lugar disponible</span>
      </div>
    );
  }

  return (
    <div className="player-slot filled">
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
    </div>
  );
}

function CreateTeamModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (team: Team) => void;
}) {
  const { authFetch } = useApi();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const finalLogoUrl =
        uploadMode === "file" && logoPreview
          ? logoPreview
          : logoUrl || undefined;

      const res = await authFetch("/teams", {
        method: "POST",
        body: JSON.stringify({ name, logo_url: finalLogoUrl }),
      });

      const data = (await res.json()) as Team;
      if (!res.ok) {
        const err = data as unknown as { message: string };
        setError(err.message || "Error al crear el equipo");
        return;
      }
      onCreated(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Evitar warning de variable no usada
  void logoFile;

  return (
    <div className="create-team-modal-overlay" onClick={onClose}>
      <div className="create-team-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Crear equipo</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">Nombre del equipo</label>
            <input
              className="input"
              placeholder="Ej: Team Nexus"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={3}
              maxLength={25}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Logo del equipo</label>
            <div className="logo-mode-toggle">
              <button
                type="button"
                className={`btn btn-sm ${uploadMode === "url" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setUploadMode("url")}
              >
                URL
              </button>
              <button
                type="button"
                className={`btn btn-sm ${uploadMode === "file" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setUploadMode("file")}
              >
                Subir archivo
              </button>
            </div>

            {uploadMode === "url" ? (
              <input
                className="input"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            ) : (
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  id="logo-file"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <label htmlFor="logo-file" className="file-upload-label">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="preview"
                      className="logo-preview"
                    />
                  ) : (
                    <span className="file-upload-text">
                      Hacé clic para seleccionar imagen
                    </span>
                  )}
                </label>
              </div>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}
          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear equipo"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
          />
        ))}
      </div>
    </div>
  );
}
