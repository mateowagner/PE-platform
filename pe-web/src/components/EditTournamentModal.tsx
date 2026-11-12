import { useState } from "react";
import type { TournamentDetails, UpdateTournamentInput } from "../types";
import { useTournaments } from "../hooks/useTournaments";

interface EditTournamentModalProps {
  tournament: TournamentDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTournamentModal = ({
  tournament,
  onClose,
  onSuccess,
}: EditTournamentModalProps) => {
  const { updateTournament } = useTournaments();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función de utilidad para adaptar fechas ISO al formato de input HTML (YYYY-MM-DDTHH:mm)
  const formatISOToInput = (isoString?: string) => {
    if (!isoString) return "";
    return isoString.substring(0, 16);
  };

  // 1. Clonamos todos los datos actuales hacia el estado local del formulario de forma simétrica
  const [formData, setFormData] = useState<UpdateTournamentInput>({
    name: tournament.name,
    description: tournament.description || "",
    entry_fee: tournament.entry_fee,
    prize_pool: tournament.prize_pool || "",
    max_teams: tournament.max_teams,
    type: tournament.type,
    skill_tier: tournament.skill_tier,
    registration_start_date: formatISOToInput(
      tournament.registration_start_date,
    ),
    registration_end_date: formatISOToInput(tournament.registration_end_date),
    start_date: formatISOToInput(tournament.start_date),
  });

  // 2. Manejador dinámico para todos los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // 3. Orquestación de la petición
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Formateamos las fechas de regreso a ISO estricto para satisfacer el ValidationPipe
    const payload: UpdateTournamentInput = {
      ...formData,
      registration_start_date: formData.registration_start_date
        ? new Date(formData.registration_start_date).toISOString()
        : undefined,
      registration_end_date: formData.registration_end_date
        ? new Date(formData.registration_end_date).toISOString()
        : undefined,
      start_date: formData.start_date
        ? new Date(formData.start_date).toISOString()
        : undefined,
    };

    try {
      await updateTournament(tournament.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al actualizar los datos del torneo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
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
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          padding: "2rem",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "550px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            marginBottom: "1.5rem",
            fontSize: "1.25rem",
          }}
        >
          Editar Torneo
        </h3>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              padding: "0.75rem",
              borderRadius: "4px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* Nombre */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.85rem",
              }}
            >
              Nombre del Torneo
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className="input-field"
              required
              minLength={5}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.85rem",
              }}
            >
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className="input-field"
              rows={3}
              style={{
                width: "100%",
                padding: "0.5rem",
                resize: "vertical",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-subtle)",
                color: "white",
              }}
            />
          </div>

          {/* Tipo y Tier */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                Formato
              </label>
              <select
                name="type"
                value={formData.type || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "#1e1e24",
                  color: "white",
                  border: "1px solid var(--border-subtle)",
                }}
                required
              >
                <option value="CUP">CUP (Eliminación directa)</option>
                <option value="LEAGUE">LEAGUE (Todos contra todos)</option>
                <option value="GROUPS">GROUPS (Fase de Grupos)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                Skill Tier
              </label>
              <select
                name="skill_tier"
                value={formData.skill_tier || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "#1e1e24",
                  color: "white",
                  border: "1px solid var(--border-subtle)",
                }}
                required
              >
                <option value="IRON">Hierro</option>
                <option value="BRONZE">Bronce</option>
                <option value="SILVER">Plata</option>
                <option value="GOLD">Oro</option>
                <option value="PLATINUM">Platino</option>
                <option value="EMERALD">Esmeralda</option>
                <option value="DIAMOND">Diamante</option>
                <option value="MASTER">Maestro</option>
              </select>
            </div>
          </div>

          {/* Costo, Cupos y Premio */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                Inscripción
              </label>
              <input
                type="number"
                name="entry_fee"
                value={formData.entry_fee ?? 0}
                onChange={handleChange}
                className="input-field"
                required
                min={0}
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                Cupo Máximo
              </label>
              <input
                type="number"
                name="max_teams"
                value={formData.max_teams ?? 0}
                onChange={handleChange}
                className="input-field"
                required
                min={2}
                max={64}
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.85rem",
              }}
            >
              Premio (Prize Pool)
            </label>
            <input
              type="text"
              name="prize_pool"
              value={formData.prize_pool || ""}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: $1000 USD"
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          {/* Fechas de Inscripción */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                Inicio Inscripciones
              </label>
              <input
                type="datetime-local"
                name="registration_start_date"
                value={formData.registration_start_date || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "#1e1e24",
                  color: "white",
                  border: "1px solid var(--border-subtle)",
                }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                Cierre Inscripciones
              </label>
              <input
                type="datetime-local"
                name="registration_end_date"
                value={formData.registration_end_date || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "#1e1e24",
                  color: "white",
                  border: "1px solid var(--border-subtle)",
                }}
                required
              />
            </div>
          </div>

          {/* Fecha del Torneo */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.85rem",
              }}
            >
              Fecha de Inicio Torneo
            </label>
            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date || ""}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "#1e1e24",
                color: "white",
                border: "1px solid var(--border-subtle)",
              }}
              required
            />
          </div>

          {/* Acciones */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
