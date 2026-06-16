import React, { useState } from "react";
import type { TournamentDetails } from "../types";
import { useTournament } from "../hooks/useTournament"; // ➔ Importamos tu hook
import axios from "axios";

interface Props {
  tournament: TournamentDetails;
  onTournamentStarted: (updatedTournament: TournamentDetails) => void;
}

export const AdminTournamentPanel: React.FC<Props> = ({
  tournament,
  onTournamentStarted,
}) => {
  const { startTournament } = useTournament();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Evaluamos cupos
  const totalTeamsInscribed = tournament.teams?.length || 0;
  const isCupoIncompleto = totalTeamsInscribed < tournament.max_teams;

  if (tournament.status !== "PREPARING") {
    return null;
  }

  const handleConfirmStart = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Delegamos el POST a Axios
      const updatedTournament = await startTournament(tournament.id);

      // 2. Cerramos el modal
      setIsModalOpen(false);

      // 3. Notificamos al padre para que actualice el estado y recargue las llaves
      onTournamentStarted(updatedTournament);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || "Error al iniciar el torneo.",
        );
      } else {
        setErrorMessage("Error de conexión con el servidor.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-panel-container">
      <button
        className="btn btn-primary"
        style={{ height: "38px", fontSize: "0.85rem", padding: "0.5rem 1rem" }}
        onClick={() => setIsModalOpen(true)}
      >
        Arrancar Torneo
      </button>

      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              padding: "2.5rem",
              borderRadius: "8px",
              maxWidth: "460px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "800",
                marginBottom: "1rem",
                color: isCupoIncompleto ? "#f59e0b" : "#10b981",
              }}
            >
              {isCupoIncompleto
                ? "⚠️ Advertencia: Cupo Incompleto"
                : "🏆 Confirmar Inicio"}
            </h3>

            <div
              className="modal-body"
              style={{
                color: "var(--text-secondary)",
                marginBottom: "2rem",
                fontSize: "0.95rem",
                textAlign: "left",
              }}
            >
              {isCupoIncompleto ? (
                <p>
                  El torneo aún no alcanzó el cupo máximo (Inscriptos:{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {totalTeamsInscribed}
                  </strong>{" "}
                  de{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {tournament.max_teams}
                  </strong>
                  ). Si lo arrancás ahora, el fixture se generará con los
                  equipos actuales y algunos avanzarán de ronda automáticamente
                  (BYE). ¿Deseas continuar de todas formas?
                </p>
              ) : (
                <p>
                  ¿Estás seguro de que querés arrancar el torneo{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {tournament.name}
                  </strong>
                  ? Se cerrarán las inscripciones de forma definitiva, se
                  generarán las llaves y se solicitarán los códigos de partida
                  oficiales a Riot Games.
                </p>
              )}
            </div>

            {errorMessage && (
              <div
                className="alert-message error-alert"
                style={{ marginBottom: "1.5rem" }}
              >
                ⚠️ {errorMessage}
              </div>
            )}

            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primary"
                onClick={handleConfirmStart}
                disabled={isLoading}
                style={{
                  background: isCupoIncompleto
                    ? "#f59e0b"
                    : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                  border: "none",
                }}
              >
                {isLoading ? "Procesando con Riot..." : "Sí, Arrancar Torneo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
