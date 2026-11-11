// pe-web/src/pages/TeamPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { useTeams } from "../hooks/useTeams";
import { useTournaments } from "../hooks/useTournaments";
import { apiClient } from "../config/apiClient";
import type { Team, Member, Match } from "../types";
import CreateTeamModal from "../components/CreateTeamModal";
import PlayerSlot from "../components/PlayerSlot";
import ImageCropperModal from "../components/ImageCropperModal";
import { getTeamLogo, handleImageError } from "../utils/image";
import {
  Shield,
  UserPlus,
  Edit3,
  LogOut,
  Trophy,
  Swords,
  TrendingUp,
  Calendar,
  X,
  Search,
  CheckCircle2,
  UploadCloud,
  PlusCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import "./TeamPage.css";
import { useNavigate } from "react-router-dom";
export default function TeamPage() {
  const { user, updateUser } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Estados de Partidos Desacoplados
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);

  // Formularios
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const [editName, setEditName] = useState("");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const { getMyTeam, leaveTeam, updateTeam } = useTeams();
  const { getTeamMatches } = useTournaments();
  const navigate = useNavigate();

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const data = await getMyTeam();
      setTeam(data);
      setEditName(data.name);
      setEditLogoPreview(getTeamLogo(data));
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeam();
  }, []);

  // Carga de Partidos Filtrados
  useEffect(() => {
    if (!team?.id) return;

    const loadTeamMatches = async () => {
      try {
        const [pending, finished] = await Promise.all([
          getTeamMatches(team.id, "pending"),
          getTeamMatches(team.id, "finished"),
        ]);
        setPendingMatches(pending || []);
        setFinishedMatches(finished || []);
      } catch (err) {
        console.error("Error al cargar partidos del equipo:", err);
      }
    };

    void loadTeamMatches();
  }, [team?.id]);

  // Cómputo de Estadísticas Reales
  const stats = useMemo(() => {
    const totalFinished = finishedMatches.length;
    if (totalFinished === 0 || !team) {
      return { totalPlayed: 0, winRate: 0, wins: 0, losses: 0 };
    }

    const wins = finishedMatches.filter((m) => m.winner?.id === team.id).length;
    const losses = totalFinished - wins;
    const winRate = Math.round((wins / totalFinished) * 100);

    return { totalPlayed: totalFinished, winRate, wins, losses };
  }, [finishedMatches, team]);

  const computedRankPoints = useMemo(() => {
    if (!team || !team.members || team.members.length === 0) return 0;
    if (team.totalRankPoints && team.totalRankPoints > 0)
      return team.totalRankPoints;

    const tierPointsMap: Record<string, number> = {
      IRON: 1,
      BRONZE: 2,
      SILVER: 3,
      GOLD: 4,
      PLATINUM: 5,
      EMERALD: 6,
      DIAMOND: 7,
      MASTER: 8,
      GRANDMASTER: 9,
      CHALLENGER: 10,
    };

    const total = team.members.reduce((acc, m) => {
      const tier = m.soloTier?.toUpperCase() || "UNRANKED";
      return acc + (tierPointsMap[tier] || 0);
    }, 0);

    return Math.round(total / team.members.length);
  }, [team]);

  const isCaptain = user?.id === team?.owner?.id;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setInviteError("");
    setInviteSuccess("");
    setInviting(true);

    try {
      await apiClient.post(`/invitations/team/${team.id}/send`, {
        identifier: inviteQuery.trim(),
      });
      setInviteSuccess(`¡Invitación enviada a "${inviteQuery}"!`);
      setInviteQuery("");
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess("");
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setInviteError(
          err.response?.data?.message || "No se pudo enviar la invitación.",
        );
      } else {
        setInviteError("Error de conexión con el servidor.");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setEditError("Solo se admiten formatos PNG o JPEG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError("La imagen original supera los 5 MB.");
      return;
    }

    setEditError("");
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result?.toString() || null);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    setEditLogoFile(croppedFile);
    setEditLogoPreview(previewUrl);
    setShowCropper(false);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setEditError("");
    setUpdating(true);

    const formData = new FormData();
    formData.append("name", editName.trim());
    if (editLogoFile) {
      formData.append("logo", editLogoFile);
    }

    try {
      await updateTeam(team.id, formData);
      await fetchTeam();
      setShowEditModal(false);
      setEditLogoFile(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setEditError(
          Array.isArray(err.response?.data?.message)
            ? err.response?.data?.message.join(", ")
            : err.response?.data?.message || "Error al actualizar la escuadra.",
        );
      } else {
        setEditError("Error de conexión con el servidor.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !team) return;
    if (!window.confirm("¿Seguro que deseas salir del equipo?")) return;

    try {
      await leaveTeam(); // POST /teams/leave[cite: 10]
      setTeam(null);
      updateUser({ teamId: undefined });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "No se pudo abandonar el equipo.");
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container team-page-wrapper">
        <div className="empty-state-card">
          <p style={{ color: "var(--text-muted)" }}>Cargando escuadra...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    const hasRiotLinked = Boolean(user?.riotGameName);

    return (
      <div className="page-container team-page-wrapper">
        <div className="team-empty-state-container fade-in">
          {!hasRiotLinked ? (
            /* ESTADO 1: Requiere vincular cuenta */
            <div className="team-flow-card alert-flow">
              <div className="flow-icon-box text-purple">
                <AlertCircle size={24} />
              </div>

              <div className="flow-text-content">
                <h3 className="flow-title">Vinculación de cuenta requerida</h3>
                <p className="flow-description">
                  Debes vincular tu <strong>Riot ID</strong> oficial para
                  validar tu rango antes de poder fundar un equipo o recibir
                  invitaciones a una escuadra.
                </p>
              </div>

              <button
                type="button"
                className="btn-flow-action btn-purple-outline"
                onClick={() => navigate("/account")}
              >
                <span>Vincular cuenta</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* ESTADO 2: Cuenta vinculada, listo para fundar o recibir invites */
            <div className="team-flow-card ready-flow">
              <div className="flow-icon-box text-cyan">
                <Shield size={24} />
              </div>

              <div className="flow-text-content">
                <h3 className="flow-title">Sin Escuadra Asignada</h3>
                <p className="flow-description">
                  Tu cuenta{" "}
                  <strong>
                    {user?.riotGameName}#{user?.riotTagLine}
                  </strong>{" "}
                  está verificada. Puedes fundar tu propio club oficial o
                  esperar la invitación de otro capitán.
                </p>
              </div>

              <button
                type="button"
                className="btn-flow-action btn-cyan-solid"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusCircle size={15} />
                <span>Fundar Escuadra</span>
              </button>
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateTeamModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(newTeam) => {
              setTeam(newTeam);
              updateUser({ teamId: newTeam.id });
              setShowCreateModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-container team-page-wrapper fade-in">
      {/* BANNER PRINCIPAL */}
      <div className="team-master-card">
        <div className="team-profile-side">
          <img
            src={getTeamLogo(team)}
            alt={team.name}
            className="team-shield-large"
            onError={(e) => handleImageError(e, "/default-shield.svg")}
          />
          <div className="team-header-text">
            <div className="team-badge-tag">CLUB OFICIAL</div>
            <h1 className="team-title-name">{team.name}</h1>
            <p className="team-captain-info">
              Capitán:{" "}
              <span className="captain-username">{team.owner.username}</span>
            </p>
          </div>
        </div>

        <div className="team-meta-and-actions">
          <div className="team-stats-pill">
            <div className="stat-unit">
              <span className="stat-value">{team.members.length}</span>
              <span className="stat-label">Miembros</span>
            </div>
            <div className="stat-separator" />
            <div className="stat-unit">
              <span className="stat-value text-cyan">{computedRankPoints}</span>
              <span className="stat-label">Pts MMR</span>
            </div>
          </div>

          <div className="team-action-controls">
            {isCaptain && (
              <>
                <button
                  type="button"
                  className="btn-action-circle btn-invite"
                  title="Reclutar Jugador (+)"
                  onClick={() => setShowInviteModal(true)}
                >
                  <UserPlus size={18} />
                </button>
                <button
                  type="button"
                  className="btn-action-circle btn-edit"
                  title="Editar Nombre / Escudo"
                  onClick={() => {
                    setEditName(team.name);
                    setEditLogoPreview(getTeamLogo(team));
                    setEditLogoFile(null);
                    setEditError("");
                    setShowEditModal(true);
                  }}
                >
                  <Edit3 size={18} />
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-action-circle btn-leave"
              title={
                isCaptain ? "Disolver / Salir del Club" : "Abandonar Escuadra"
              }
              onClick={handleLeaveTeam}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="team-grid-layout">
        {/* COLUMNA ROSTER */}
        <section className="team-roster-column">
          <div className="section-title-row">
            <h3 className="section-title">Plantilla del Club</h3>
            <span className="sub-count-tag">
              {team.members.length} Integrantes
            </span>
          </div>

          <div className="roster-dynamic-list">
            {team.members.map((member: Member, idx: number) => (
              <PlayerSlot
                key={member.id}
                member={member}
                index={idx}
                isOwner={member.id === team.owner.id}
                teamId={team.id}
                isCurrentUserCaptain={isCaptain}
                onMemberRemoved={setTeam}
              />
            ))}
          </div>
        </section>

        {/* COLUMNA ANALÍTICA, AGENDA E HISTORIAL */}
        <section className="team-analytics-column">
          <div className="analytics-card">
            <h3 className="card-section-title">Rendimiento en Competencia</h3>

            <div className="team-performance-grid">
              <div className="perf-item">
                <Trophy size={18} className="perf-icon text-gold" />
                <div className="perf-data">
                  <span className="perf-val">0</span>
                  <span className="perf-lbl">Títulos Ganados</span>
                </div>
              </div>

              <div className="perf-item">
                <Swords size={18} className="perf-icon text-purple" />
                <div className="perf-data">
                  <span className="perf-val">{stats.totalPlayed}</span>
                  <span className="perf-lbl">Mapas Jugados</span>
                </div>
              </div>

              <div className="perf-item">
                <TrendingUp size={18} className="perf-icon text-cyan" />
                <div className="perf-data">
                  <span className="perf-val">
                    {stats.totalPlayed > 0 ? `${stats.winRate}%` : "-%"}
                  </span>
                  <span className="perf-lbl">Tasa de Victoria</span>
                </div>
              </div>
            </div>

            {/* AGENDA: PRÓXIMOS ENCUENTROS */}
            <div className="matches-section-block mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={15} className="text-cyan" />
                <h4 className="sub-section-title">Próximos Encuentros</h4>
              </div>

              {pendingMatches.length === 0 ? (
                <div className="empty-matches-msg">
                  No hay partidas pendientes programadas en agenda.
                </div>
              ) : (
                <div className="team-match-records-list">
                  {pendingMatches.slice(0, 3).map((m) => {
                    const series = m.series;
                    const rival =
                      series?.team_a?.id === team.id
                        ? series?.team_b
                        : series?.team_a;
                    const dateFormatted = series?.scheduled_date
                      ? new Date(series.scheduled_date).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Fecha a confirmar";

                    return (
                      <div key={m.id} className="team-match-row pending-row">
                        <div className="match-meta-side">
                          <span className="match-tourney-name truncate">
                            {series?.tournament?.name || "Torneo Oficial"}
                          </span>
                          <span className="match-stage-tag">
                            {series?.stage_name} (Mapa {m.match_order})
                          </span>
                        </div>

                        <div className="match-opponent-side">
                          <span className="vs-tag">VS</span>
                          <span className="opponent-name truncate">
                            {rival?.name || "Por Definir"}
                          </span>
                          <span className="scheduled-time-badge">
                            {dateFormatted}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* HISTORIAL: ÚLTIMOS PARTIDOS (RACHA) */}
            <div className="matches-section-block mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="sub-section-title">Últimos Resultados</h4>
                {finishedMatches.length > 0 && (
                  <div className="streak-badges-row">
                    {finishedMatches.slice(0, 5).map((m) => {
                      const isWin = m.winner?.id === team.id;
                      return (
                        <span
                          key={m.id}
                          className={`streak-dot ${isWin ? "dot-win" : "dot-loss"}`}
                          title={isWin ? "Victoria" : "Derrota"}
                        >
                          {isWin ? "W" : "L"}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {finishedMatches.length === 0 ? (
                <div className="empty-matches-msg">
                  No hay registros de partidas disputadas recientemente.
                </div>
              ) : (
                <div className="team-match-records-list">
                  {finishedMatches.slice(0, 5).map((m) => {
                    const isWin = m.winner?.id === team.id;
                    const series = m.series;
                    const rival =
                      series?.team_a?.id === team.id
                        ? series?.team_b
                        : series?.team_a;

                    return (
                      <div
                        key={m.id}
                        className={`team-match-row ${isWin ? "row-won" : "row-lost"}`}
                      >
                        <div className="match-meta-side">
                          <span className="match-tourney-name truncate">
                            {series?.tournament?.name || "Torneo Oficial"}
                          </span>
                          <span className="match-stage-tag">
                            {series?.stage_name} (Mapa {m.match_order})
                          </span>
                        </div>

                        <div className="match-opponent-side">
                          <span className="vs-tag">VS</span>
                          <span className="opponent-name truncate">
                            {rival?.name || "Rival"}
                          </span>
                          <span
                            className={`result-pill ${isWin ? "pill-win" : "pill-loss"}`}
                          >
                            {isWin ? "VICTORIA" : "DERROTA"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* MODAL INVITACIÓN */}
      {showInviteModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="modal-container modal-compact"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Reclutar Jugador</h3>
                <p className="modal-subtitle">
                  Ingresa el Nombre de Usuario o Riot ID (Ej: LordKing#ARIO).
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowInviteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="modal-body-form">
              <div className="input-group">
                <label className="input-label">Identificador del Jugador</label>
                <div className="input-with-icon">
                  <Search size={16} className="input-icon" />
                  <input
                    className="input pl-input-icon"
                    placeholder="Usuario o Invocador#TAG..."
                    value={inviteQuery}
                    onChange={(e) => setInviteQuery(e.target.value)}
                    required
                  />
                </div>
              </div>

              {inviteError && (
                <div className="auth-error mt-2">{inviteError}</div>
              )}
              {inviteSuccess && (
                <div className="link-success mt-2 flex items-center gap-1">
                  <CheckCircle2 size={16} /> {inviteSuccess}
                </div>
              )}

              <div className="modal-footer mt-4">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={inviting || !inviteQuery.trim()}
                >
                  {inviting ? "Enviando..." : "Enviar Invitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-container modal-compact"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Editar Escuadra</h3>
                <p className="modal-subtitle">
                  Actualiza el nombre o sube un nuevo escudo.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="modal-body-form">
              <div className="input-group">
                <label className="input-label">Nombre del Equipo</label>
                <input
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  minLength={3}
                  maxLength={25}
                  required
                />
              </div>

              <div className="input-group" style={{ marginTop: "1.25rem" }}>
                <label className="input-label">
                  Escudo del Club (PNG o JPEG)
                </label>
                <input
                  type="file"
                  id="edit-team-logo-upload"
                  accept="image/png, image/jpeg"
                  style={{ display: "none" }}
                  onChange={handleLogoFileSelect}
                />
                <label
                  htmlFor="edit-team-logo-upload"
                  style={{
                    border: "2px dashed #2a2d40",
                    borderRadius: "8px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    background: "rgba(22, 24, 36, 0.4)",
                    transition: "border-color 0.2s",
                  }}
                >
                  {editLogoPreview ? (
                    <img
                      src={editLogoPreview}
                      alt="Vista previa escudo"
                      style={{
                        width: "68px",
                        height: "68px",
                        borderRadius: "8px",
                        objectFit: "contain",
                      }}
                      onError={(e) => handleImageError(e, "/logo.jpeg")}
                    />
                  ) : (
                    <>
                      <UploadCloud size={32} color="#06b6d4" />
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        Haz clic para seleccionar y recortar
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>
                        Formato 1:1 Cuadrado
                      </span>
                    </>
                  )}
                </label>
              </div>

              {editError && <div className="auth-error mt-2">{editError}</div>}

              <div className="modal-footer mt-4">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating || editName.trim().length < 3}
                >
                  {updating ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CROPPER */}
      {showCropper && rawImageSrc && (
        <ImageCropperModal
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}
