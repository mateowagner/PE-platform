import type { Tournament } from "../types";
import { formatDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";
export default function TournamentCard({
  tournament,
}: {
  tournament: Tournament;
}) {
  const navigate = useNavigate();
  // Una pequeña ayuda visual para los estados
  const statusColors: Record<string, string> = {
    REGISTRATION: "var(--orange-bright)",
    ONGOING: "#4ade80", // un verde
    FINISHED: "var(--text-muted)",
    PENDING: "#facc15", // un amarillo
  };

  return (
    <div
      className="card tournament-card"
      style={{
        border: "1px solid var(--border-subtle)",
        padding: "1.5rem",
        borderRadius: "8px",
        background: "var(--bg-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            {tournament.name}
          </h3>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "0.25rem",
            }}
          >
            {tournament.type} • {tournament.skill_tier}
          </p>
        </div>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "bold",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            backgroundColor: "rgba(255,255,255,0.1)",
            color: statusColors[tournament.status] || "white",
          }}
        >
          {tournament.status}
        </span>
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        <div>
          <strong>Inscripciones:</strong>
          <br />
          {formatDate(tournament.registration_start_date)}
        </div>
        <div>
          <strong>Torneo:</strong>
          <br />
          {formatDate(tournament.start_date)}
        </div>
        <div>
          <strong>Cupos:</strong> {tournament.teams?.length || 0} /{" "}
          {tournament.max_teams}
        </div>
        <div>
          <strong>Premio:</strong> {tournament.prize_pool || "A confirmar"}
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          //disabled={tournament.status !== "REGISTRATION"}
          onClick={() => {
            navigate(`/tournaments/${tournament.id}`);
          }}
        >
          {tournament.status === "PREPARING"
            ? "Inscribir Equipo"
            : "Ver Detalles"}
        </button>
      </div>
    </div>
  );
}
