import React, { useState } from "react";
import { useApi } from "../hooks/useApi";
import type { Tournament, TournamentType } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTournamentCreated: (newTournament: Tournament) => void;
}

export default function CreateTournamentModal({
  isOpen,
  onClose,
  onTournamentCreated,
}: Props) {
  const { createTournament } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados locales alineados estrictamente con el DTO del backend
  const [formData, setFormData] = useState({
    name: "",
    type: "CUP" as TournamentType,
    skill_tier: "DIV_1",
    max_teams: 4,
    entry_fee: 0,
    registration_start_date: "", // ➔ Nueva fecha independiente
    registration_end_date: "", // ➔ Nueva fecha independiente
    start_date: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validación rápida en el cliente antes de golpear NestJS
    const regStart = new Date(formData.registration_start_date).getTime();
    const regEnd = new Date(formData.registration_end_date).getTime();
    const tourneyStart = new Date(formData.start_date).getTime();

    if (regEnd <= regStart) {
      setError("El cierre de inscripciones debe ser posterior a la apertura.");
      setIsLoading(false);
      return;
    }

    if (tourneyStart < regEnd) {
      setError(
        "La fecha de inicio del torneo debe ser posterior al cierre de las inscripciones.",
      );
      setIsLoading(false);
      return;
    }

    try {
      // ➔ PAYLOAD TRANSPARENTE: Mapeo directo uno a uno con el DTO
      const newTournament = await createTournament({
        name: formData.name,
        type: formData.type,
        skill_tier: formData.skill_tier,
        max_teams: formData.max_teams,
        entry_fee: formData.entry_fee,
        registration_start_date: new Date(
          formData.registration_start_date,
        ).toISOString(),
        registration_end_date: new Date(
          formData.registration_end_date,
        ).toISOString(),
        start_date: new Date(formData.start_date).toISOString(),
      });

      onTournamentCreated(newTournament);
      onClose();
    } catch (err: any) {
      setError(err.message || "No se pudo crear el torneo.");
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
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          padding: "2rem",
          borderRadius: "8px",
          maxWidth: "520px",
          width: "90%",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
            fontSize: "1.25rem",
            margin: 0,
            letterSpacing: "0.5px",
          }}
        >
          🏆 CONFIGURAR NUEVA COMPETENCIA
        </h3>
        {error && (
          <div
            style={{
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.1)",
              padding: "0.6rem",
              borderRadius: "4px",
              fontSize: "0.85rem",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            ⚠️ {error}
          </div>
        )}
        {/* FILA 1: Nombre del Torneo */}
        <div>
          <label
            style={{
              display: "block",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              marginBottom: "0.3rem",
            }}
          >
            Nombre del Torneo
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Copa Libertadores"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: "100%",
              padding: "0.6rem",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-color)",
              color: "#fff",
            }}
          />
        </div>
        {/* FILA 2: Formato y División Competitiva */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Formato de Juego
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as TournamentType,
                })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "#1e1b4b",
                border: "1px solid var(--border-color)",
                color: "#fff",
              }}
            >
              <option value="CUP">Copa (Eliminación)</option>
              <option value="LEAGUE">Liga (HLTV Tabla)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              División / Skill Tier
            </label>
            <select
              value={formData.skill_tier}
              onChange={(e) =>
                setFormData({ ...formData, skill_tier: e.target.value })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "#1e1b4b",
                border: "1px solid var(--border-color)",
                color: "#fff",
              }}
            >
              <option value="HIGH_TIER">Tier Alto (Master +)</option>
              <option value="MID_HIGH">
                Tier Medio-Alto (Esmeralda/Diamante)
              </option>
              <option value="MID">Tier Medio (Oro/Platino)</option>
              <option value="LOW">Tier bajo (Plata -)</option>
            </select>
          </div>
        </div>
        {/* FILA 3: Cupos y Costos */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Cupo Máximo de Equipos
            </label>
            <input
              type="number"
              required
              min={2}
              value={formData.max_teams}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_teams: parseInt(e.target.value) || 0,
                })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-color)",
                color: "#fff",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Costo de Inscripción ($)
            </label>
            <input
              type="number"
              required
              min={0}
              value={formData.entry_fee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entry_fee: parseFloat(e.target.value) || 0,
                })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-color)",
                color: "#fff",
              }}
            />
          </div>
        </div>
        {/* FILA 4: Fecha de Lanzamiento */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}
        >
          <label
            style={{
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              fontWeight: "bold",
              fontFamily: "var(--font-display)",
            }}
          >
            📅 CRONOGRAMA OFICIAL
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  marginBottom: "0.3rem",
                }}
              >
                Apertura Inscripciones
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registration_start_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_start_date: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-color)",
                  color: "#fff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  marginBottom: "0.3rem",
                }}
              >
                Cierre Inscripciones
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registration_end_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_end_date: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-color)",
                  color: "#fff",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Fecha y Hora de Inicio del Torneo
            </label>
            <input
              type="datetime-local"
              required
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-color)",
                color: "#fff",
              }}
            />
          </div>
        </div>
        {/* Acciones de Cierre/Envío */}
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
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              padding: "0.6rem 1.2rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Creando..." : "Crear Torneo"}
          </button>
        </div>
      </form>
    </div>
  );
}
