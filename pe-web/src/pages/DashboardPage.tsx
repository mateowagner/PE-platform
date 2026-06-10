import { useAuthStore } from "../store/authStore";
import "./DashboardPage.css";

// Escudo default para equipos sin logo
const DEFAULT_SHIELD =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png";

const mockTournaments = [
  {
    id: 1,
    name: "Copa Pulpito #12",
    format: "Round Robin",
    status: "REGISTRATION",
    maxRank: "Platino",
    slots: "6/8",
    region: "LAS",
  },
  {
    id: 2,
    name: "Torneo Mensual Mayo",
    format: "Eliminación Directa",
    status: "ONGOING",
    maxRank: "Diamante",
    slots: "8/8",
    region: "LAS",
  },
  {
    id: 3,
    name: "Liga Abierta S1",
    format: "Grupos + Playoffs",
    status: "REGISTRATION",
    maxRank: "Esmeralda",
    slots: "3/16",
    region: "LAS",
  },
];

const mockNextMatch = {
  rival: "Team Nexus",
  rivalLogo: null,
  date: "Sábado 26 Abr",
  time: "21:00 ART",
  tournament: "Copa Pulpito #12",
  format: "BO3",
};

const mockMatches = [
  {
    id: 1,
    vs: "Los Dragones",
    date: "Dom 27 · 20:00",
    status: "SCHEDULED",
    tournament: "Liga Abierta S1",
  },
  {
    id: 2,
    vs: "Dark Side",
    date: "Lun 28 · 21:30",
    status: "PENDING",
    tournament: "Copa Pulpito #12",
  },
];

const statusLabel: Record<string, { label: string; cls: string }> = {
  REGISTRATION: { label: "Inscripción", cls: "badge-orange" },
  ONGOING: { label: "En curso", cls: "badge-blue" },
  FINISHED: { label: "Finalizado", cls: "badge-success" },
  PENDING: { label: "Pendiente", cls: "badge-orange" },
  SCHEDULED: { label: "Agendado", cls: "badge-blue" },
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="page-container dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome fade-in">
        <div>
          <h1 className="dashboard-greeting">
            Hola, <span className="gradient-text">{user?.username}</span>
          </h1>
          <p className="dashboard-subtext">
            {user?.riotGameName
              ? `${user.riotGameName} · ${user.soloTier ?? "Sin rango"}`
              : "Vinculá tu cuenta de Riot para participar en torneos"}
          </p>
        </div>
        {!user?.riotGameName && (
          <a href="/account" className="btn btn-primary">
            Vincular Riot ID
          </a>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Izquierda - Torneos */}
        <div>
          {/* Próximo partido */}
          {user?.teamId && (
            <section className="dashboard-section fade-in-delay-1">
              <h2 className="section-title">Próximo partido</h2>
              <div className="next-match-card">
                <div className="next-match-label">Partido programado</div>
                <div className="match-teams">
                  <div className="match-team-side">
                    <img
                      src="/logo.jpeg"
                      alt="Mi equipo"
                      className="match-team-logo"
                    />
                    <span className="match-team-name">Mi Equipo</span>
                  </div>
                  <span className="match-vs-badge">VS</span>
                  <div className="match-team-side">
                    <img
                      src={mockNextMatch.rivalLogo ?? DEFAULT_SHIELD}
                      alt={mockNextMatch.rival}
                      className="match-team-logo"
                    />
                    <span className="match-team-name">
                      {mockNextMatch.rival}
                    </span>
                  </div>
                </div>
                <div className="match-details">
                  <div className="match-detail-row">
                    <span className="match-detail-label">Torneo</span>
                    <span className="match-detail-value">
                      {mockNextMatch.tournament}
                    </span>
                  </div>
                  <div className="match-detail-row">
                    <span className="match-detail-label">Fecha</span>
                    <span className="match-detail-value">
                      {mockNextMatch.date} · {mockNextMatch.time}
                    </span>
                  </div>
                  <div className="match-detail-row">
                    <span className="match-detail-label">Formato</span>
                    <span className="match-detail-value">
                      {mockNextMatch.format}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Torneos disponibles */}
          <section className="dashboard-section fade-in-delay-2">
            <h2 className="section-title">Torneos activos</h2>
            <div className="tournament-list">
              {mockTournaments.map((t) => (
                <div key={t.id} className="tournament-card card">
                  <div className="tournament-card-top">
                    <span className={`badge ${statusLabel[t.status].cls}`}>
                      {statusLabel[t.status].label}
                    </span>
                    <span className="badge badge-blue">{t.region}</span>
                  </div>
                  <h3 className="tournament-name">{t.name}</h3>
                  <div className="tournament-meta">
                    <span>{t.format}</span>
                    <span>·</span>
                    <span>Hasta {t.maxRank}</span>
                    <span>·</span>
                    <span>{t.slots} equipos</span>
                  </div>
                  <button className="btn btn-outline btn-sm tournament-btn">
                    Ver torneo
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Derecha */}
        <aside>
          {/* Partidos programados */}
          <section className="dashboard-section fade-in-delay-2">
            <h2 className="section-title">Calendario</h2>
            {mockMatches.length === 0 ? (
              <div className="empty-state">No tenés partidos programados</div>
            ) : (
              <div className="match-list">
                {mockMatches.map((m) => (
                  <div key={m.id} className="match-card card">
                    <div className="match-vs-row">
                      <span className="match-team-label">Mi Equipo</span>
                      <span className="match-vs-text">VS</span>
                      <span className="match-team-label">{m.vs}</span>
                    </div>
                    <div className="match-info-row">
                      <span className={`badge ${statusLabel[m.status].cls}`}>
                        {statusLabel[m.status].label}
                      </span>
                      <span className="match-date-text">{m.date}</span>
                    </div>
                    <span className="match-tournament-text">
                      {m.tournament}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mi equipo */}
          <section className="dashboard-section fade-in-delay-3">
            <h2 className="section-title">Mi equipo</h2>
            {user?.teamId ? (
              <div className="card">
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Cargando datos del equipo...
                </p>
              </div>
            ) : (
              <div className="empty-state">
                <p>No pertenecés a ningún equipo todavía.</p>
                <a href="/team" className="btn btn-outline btn-sm">
                  Crear o unirse a un equipo
                </a>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
