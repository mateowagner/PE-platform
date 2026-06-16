import { useState, useEffect } from "react";
import type { Tournament } from "../types";
import TournamentCard from "../components/TournamentCard";
import { useAuthStore } from "../store/authStore";
import CreateTournamentModal from "../components/CreateTournamentModal";
import { useTournament } from "../hooks/useTournaments";
import axios from "axios";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { getTournaments } = useTournament();

  const fetchTournaments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTournaments();
      setTournaments(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Error al cargar los torneos");
      } else {
        setError("Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTournaments();
  }, []);

  const handleTournamentCreated = (newTournament: Tournament) => {
    setTournaments((prev) => [newTournament, ...prev]);
    setIsCreateModalOpen(false);
  };

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
          justifyContent: "space-between",
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

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
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

      {/* ─── GRILLA DE TORNEOS ─────────────────────────────────────────────── */}
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

      {/* ─── MODAL INTERACTIVO DE CREACIÓN ────────────────────── */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTournamentCreated={handleTournamentCreated}
      />
    </div>
  );
}
