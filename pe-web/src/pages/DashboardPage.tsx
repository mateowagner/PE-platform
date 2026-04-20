import { useAuthStore } from "../store/authStore";
import "./DashboardPage.css";

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
    name: "Liga Abierta",
    format: "Grupos + Playoffs",
    status: "REGISTRATION",
    maxRank: "Esmeralda",
    slots: "3/16",
    region: "LAS",
  },
];

const mockMatches = [
  {
    id: 1,
    vs: "Team Nexus",
    date: "Hoy 21:00",
    status: "PENDING",
    tournament: "Copa Pulpito #12",
  },
  {
    id: 2,
    vs: "Los Dragones",
    date: "Mañana 20:00",
    status: "SCHEDULED",
    tournament: "Liga Abierta",
  },
];

const statusLabel: Record<string, { label: string; cls: string }> = {
  REGISTRATION: { label: "Inscripción", cls: "badge-violet" },
  ONGOING: { label: "En curso", cls: "badge-cyan" },
  FINISHED: { label: "Finalizado", cls: "badge-success" },
  PENDING: { label: "Pendiente", cls: "badge-violet" },
  SCHEDULED: { label: "Agendado", cls: "badge-cyan" },
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
              ? `Conectado como ${user.riotGameName} · ${user.riotTier ?? "Sin rango"}`
              : "Vinculá tu cuenta de Riot para ver torneos disponibles"}
          </p>
        </div>
        {!user?.riotGameName && (
          <a href="/account" className="btn btn-primary">
            Vincular Riot ID
          </a>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Torneos disponibles */}
        <section className="dashboard-section fade-in-delay-1">
          <h2 className="section-title">Torneos disponibles</h2>
          <div className="tournament-list">
            {mockTournaments.map((t) => (
              <div key={t.id} className="tournament-card card">
                <div className="tournament-card-top">
                  <span className={`badge ${statusLabel[t.status].cls}`}>
                    {statusLabel[t.status].label}
                  </span>
                  <span className="badge badge-cyan">{t.region}</span>
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

        {/* Panel derecho */}
        <aside className="dashboard-aside">
          {/* Próximas partidas */}
          <section className="dashboard-section fade-in-delay-2">
            <h2 className="section-title">Próximas partidas</h2>
            {mockMatches.length === 0 ? (
              <p className="empty-text">No tenés partidas programadas</p>
            ) : (
              <div className="match-list">
                {mockMatches.map((m) => (
                  <div key={m.id} className="match-card card">
                    <div className="match-vs">
                      <span className="match-team">Tu equipo</span>
                      <span className="match-vs-label">VS</span>
                      <span className="match-team">{m.vs}</span>
                    </div>
                    <div className="match-info">
                      <span className={`badge ${statusLabel[m.status].cls}`}>
                        {statusLabel[m.status].label}
                      </span>
                      <span className="match-date">{m.date}</span>
                    </div>
                    <span className="match-tournament">{m.tournament}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mi equipo quick view */}
          <section className="dashboard-section fade-in-delay-3">
            <h2 className="section-title">Mi equipo</h2>
            {user?.teamId ? (
              <div className="card">
                <p className="text-secondary">Cargando datos del equipo...</p>
              </div>
            ) : (
              <div className="card no-team-card">
                <p className="no-team-text">
                  No pertenecés a ningún equipo todavía.
                </p>
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
