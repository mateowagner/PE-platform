import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import type { Tournament } from "../types";
import TournamentCard from "../components/TournamentCard";
import { useAuthStore } from "../store/authStore";
import CreateTournamentModal from "../components/CreateTournamentModal";
export default function TournamentsPage() {
  const { authFetch, createTournament } = useApi();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useAuthStore((state) => state.user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const res = await authFetch("/tournaments");

        if (!res.ok) {
          throw new Error("No se pudieron cargar los torneos");
        }

        const data = (await res.json()) as Tournament[];
        setTournaments(data);
      } catch (err) {
        setError("Ocurrió un error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    void fetchTournaments();
  }, []);

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

  const activeTournaments = tournaments.filter((t) => t.status !== "FINISHED");

  return (
    <div className="page-container">
      {/* ─── ENCABEZADO CON RENDERIZADO CONDICIONAL ────────────────────────── */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between", // Corregido 'between' a 'space-between' para compatibilidad CSS estándar
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "250px" }}>
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

        {/* CORTOCIRCUITO LÓGICO: Muestra el botón de creación solo si el usuario es ADMIN */}
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setIsCreateModalOpen(true)} // ➔ Modificado para abrir el formulario modal
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
              color: "#ffffff",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontFamily: "var(--font-display)",
              fontWeight: "bold",
              textTransform: "uppercase",
              fontSize: "0.85rem",
              letterSpacing: "0.5px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.02)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
          >
            + Crear Torneo
          </button>
        )}
      </div>

      {/* ─── GRIETA DE TORNEOS ─────────────────────────────────────────────── */}
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

      {/* ─── MODAL INTERACTIVO DE CREACIÓN (INYECTADO) ────────────────────── */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTournamentCreated={(newTournament) => {
          // Añadimos reactivamente el torneo al inicio de la lista
          setTournaments((prev) => [newTournament, ...prev]);
        }}
      />
    </div>
  );
}
