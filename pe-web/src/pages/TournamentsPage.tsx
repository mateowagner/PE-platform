import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import type { Tournament } from "../types";
import TournamentCard from "../components/TournamentCard";

export default function TournamentsPage() {
  const { authFetch } = useApi();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        // Asumo que tu endpoint en NestJS es GET /tournaments
        const res = await authFetch("/tournaments");

        if (!res.ok) {
          throw new Error("No se pudieron cargar los torneos");
        }

        const data = (await res.json()) as Tournament[];
        // Guardamos los torneos en el estado de React
        setTournaments(data);
      } catch (err) {
        setError("Ocurrió un error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    void fetchTournaments();
  }, []); // El array vacío asegura que esto se ejecute solo una vez al abrir la página

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>Buscando torneos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // Opcional: Filtramos para mostrar solo los que no están terminados
  const activeTournaments = tournaments.filter((t) => t.status !== "FINISHED");

  return (
    <div className="page-container">
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Torneos Activos
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Inscribí a tu equipo en las próximas competencias y sumá puntos para
          la liga.
        </p>
      </div>

      {activeTournaments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "var(--bg-card)",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "var(--text-muted)" }}>
            No hay torneos activos en este momento.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {activeTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );
}
