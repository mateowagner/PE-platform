// pe-web/src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTournaments } from "../hooks/useTournaments";
import { useTeams } from "../hooks/useTeams";
import { getTeamLogo, handleImageError } from "../utils/image";
import type { Tournament, Team, Match } from "../types";
import {
  Trophy,
  Calendar,
  Shield,
  ArrowRight,
  PlusCircle,
  Clock,
  Swords,
} from "lucide-react";
import "./DashboardPage.css";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getTournaments, getTeamMatches } = useTournaments();
  const { getMyTeam } = useTeams();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);

        const [tourneys, teamData] = await Promise.all([
          getTournaments().catch(() => []),
          getMyTeam().catch(() => null),
        ]);

        if (!isMounted) return;
        setTournaments(tourneys || []);
        setMyTeam(teamData);

        if (teamData?.id) {
          const [pending, finished] = await Promise.all([
            getTeamMatches(teamData.id, "pending").catch(() => []),
            getTeamMatches(teamData.id, "finished").catch(() => []),
          ]);

          if (isMounted) {
            setPendingMatches(pending || []);
            setFinishedMatches(finished || []);
          }
        }
      } catch (err) {
        console.error("Error al cargar el dashboard:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrar torneos donde el equipo del usuario esté inscripto
  const enrolledTournaments = useMemo(() => {
    if (!myTeam) return [];

    return tournaments.filter((t) => {
      const isEnrolled = t.teams?.some((enrolled) => enrolled.id === myTeam.id);
      const statusUpper = t.status?.toUpperCase();
      const isActive =
        statusUpper !== "FINISHED" && statusUpper !== "COMPLETED";

      return isEnrolled && isActive;
    });
  }, [tournaments, myTeam]);

  return (
    <div className="page-container dashboard-page-root fade-in">
      {/* ─── BANNER DE SALUDO ─────────────────────────────────────────────── */}
      <div className="dash-welcome-card">
        <div>
          <h1 className="dash-welcome-title">
            HOLA,{" "}
            <span className="text-highlight">
              {user?.username || "INVOCADOR"}
            </span>
          </h1>
          <p className="dash-welcome-sub">
            {user?.riotGameName
              ? `${user.riotGameName}#${user.riotTagLine || ""} • ${user.soloTier ?? "UNRANKED"} ${user.soloRank ?? ""}`
              : "Vincula tu cuenta de Riot Games para competir en torneos oficiales"}
          </p>
        </div>
        {!user?.riotGameName && (
          <Link to="/account" className="btn btn-primary btn-sm">
            Vincular Riot ID
          </Link>
        )}
      </div>

      {/* ─── GRID DE 3 COLUMNAS (TORNEOS | CALENDARIO | MI EQUIPO) ────────── */}
      <div className="dash-three-columns-grid">
        {/* COLUMNA 1: TORNEOS ACTIVOS */}
        <section className="dash-column">
          <div className="dash-col-header">
            <Trophy size={18} className="text-cyan" />
            <h3>TORNEOS ACTIVOS</h3>
          </div>

          {isLoading ? (
            <div className="dash-empty-box">
              <p>Cargando competencias...</p>
            </div>
          ) : !myTeam ? (
            <div className="dash-empty-box">
              <Trophy size={28} className="text-muted" />
              <p>
                Únete a una escuadra oficial para ver tus torneos inscriptos.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => navigate("/tournaments")}
              >
                Explorar Torneos Disponibles
              </button>
            </div>
          ) : enrolledTournaments.length === 0 ? (
            <div className="dash-empty-box">
              <Trophy size={28} className="text-muted" />
              <p>Tu equipo no tiene torneos activos en disputa.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/tournaments")}
              >
                Explorar Torneos Abiertos
              </button>
            </div>
          ) : (
            <div className="dash-cards-list">
              {enrolledTournaments.map((t) => (
                <div key={t.id} className="dash-tourney-card">
                  <div className="dash-card-badges">
                    <span className="badge-pill pill-cyan">{t.status}</span>
                    <span className="dash-text-dim">
                      {t.type === "LEAGUE"
                        ? "LIGA OFICIAL"
                        : "COPA ELIMINATORIA"}
                    </span>
                  </div>
                  <h4 className="dash-card-name">{t.name}</h4>
                  <p className="dash-card-stage">
                    Etapa: <strong>{t.current_stage || "Fase Regular"}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-100"
                    onClick={() => navigate(`/tournaments/${t.id}`)}
                  >
                    Ver Torneo <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COLUMNA 2 (CENTRAL): CALENDARIO DE PARTIDOS */}
        <section className="dash-column dash-column-center">
          <div className="dash-col-header">
            <Calendar size={18} className="text-purple" />
            <h3>CALENDARIO DE PARTIDOS</h3>
          </div>

          {isLoading ? (
            <div className="dash-empty-box">
              <p>Sincronizando agenda...</p>
            </div>
          ) : !myTeam ? (
            <div className="dash-empty-box">
              <Calendar size={28} className="text-muted" />
              <p>Necesitas pertenecer a un equipo para disputar partidos.</p>
            </div>
          ) : pendingMatches.length === 0 ? (
            <div className="dash-empty-box">
              <Clock size={28} className="text-muted" />
              <p>No tenés partidos programados en tu agenda por el momento.</p>
            </div>
          ) : (
            <div className="dash-cards-list">
              {pendingMatches.map((m) => {
                const s = m.series;
                const rival =
                  s?.team_a?.id === myTeam.id ? s?.team_b : s?.team_a;
                const dateFormatted = s?.scheduled_date
                  ? new Date(s.scheduled_date).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Fecha a coordinar";

                return (
                  <div
                    key={m.id}
                    className="dash-match-card"
                    onClick={() => s?.id && navigate(`/series/${s.id}`)}
                  >
                    <div className="match-card-top-info">
                      <span className="match-time-tag">
                        <Clock size={12} /> {dateFormatted}
                      </span>
                      <span className="match-stage-pill">
                        {s?.stage_name || "Mapa"} #{m.match_order}
                      </span>
                    </div>

                    <div className="match-teams-versus-row">
                      <span className="team-cell-name truncate">
                        {myTeam.name}
                      </span>
                      <span className="vs-badge">VS</span>
                      <span className="team-cell-name truncate text-right">
                        {rival?.name || "Por Definir"}
                      </span>
                    </div>

                    <div className="match-card-footer">
                      <span className="tourney-tag truncate">
                        {s?.tournament?.name || "Torneo Oficial"}
                      </span>
                      <span className="go-match-link">Ir a la Sala →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUMNA 3: MI EQUIPO & RACHAS */}
        <section className="dash-column">
          <div className="dash-col-header">
            <Shield size={18} className="text-gold" />
            <h3>MI EQUIPO</h3>
          </div>

          {isLoading ? (
            <div className="dash-empty-box">
              <p>Cargando escuadra...</p>
            </div>
          ) : !myTeam ? (
            <div className="dash-empty-box">
              <Shield size={28} className="text-muted" />
              <p>No pertenecés a ningún equipo todavía.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/team")}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.65rem 1.1rem",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                <PlusCircle size={15} /> CREAR O UNIRSE A UN EQUIPO
              </button>
            </div>
          ) : (
            <div className="dash-myteam-card">
              <div className="myteam-card-identity">
                <img
                  src={getTeamLogo(myTeam)}
                  alt={myTeam.name}
                  className="myteam-card-shield"
                  onError={(e) => handleImageError(e, "/default-shield.svg")}
                />
                <div>
                  <h4 className="myteam-card-name truncate">{myTeam.name}</h4>
                  <span className="myteam-card-meta">
                    Capitán: <strong>{myTeam.owner.username}</strong>
                  </span>
                  <span className="myteam-card-members">
                    {myTeam.members?.length || 0} Integrantes
                  </span>
                </div>
              </div>

              {/* Racha de los Últimos 5 Mapas */}
              <div className="myteam-streak-box">
                <div className="streak-header-row">
                  <span className="streak-title">Últimos 5 Encuentros:</span>
                  <Swords size={14} className="text-muted" />
                </div>
                {finishedMatches.length === 0 ? (
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    Sin partidos oficiales disputados.
                  </span>
                ) : (
                  <div className="streak-dots-cluster">
                    {finishedMatches.slice(0, 5).map((m) => {
                      const isWin = m.winner?.id === myTeam.id;
                      return (
                        <span
                          key={m.id}
                          className={`streak-dot-pill ${isWin ? "dot-win" : "dot-loss"}`}
                          title={isWin ? "Victoria" : "Derrota"}
                        >
                          {isWin ? "W" : "L"}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm w-100"
                onClick={() => navigate("/team")}
              >
                Administrar Escuadra
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
