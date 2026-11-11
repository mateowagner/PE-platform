// pe-web/src/components/CreateTournamentModal.tsx
import React, { useState } from "react";
import { useTournaments } from "../hooks/useTournaments";
import type {
  Tournament,
  TournamentType,
  SeriesFormat,
  ScheduleType,
} from "../types";
import axios from "axios";

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
  const { createTournament } = useTournaments();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "CUP" as TournamentType,
    skill_tier: "OPEN",
    default_series_format: "BO3" as SeriesFormat,
    final_series_format: "BO3" as SeriesFormat,
    schedule_type: "SAME_DAY" as ScheduleType,
    days_between_rounds: 7,
    hours_between_rounds: 1.5,
    max_teams: 8,
    entry_fee: 0,
    registration_start_date: "",
    registration_end_date: "",
    start_date: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
      const newTournament = await createTournament({
        name: formData.name,
        type: formData.type,
        skill_tier: formData.skill_tier,
        default_series_format: formData.default_series_format,
        final_series_format: formData.final_series_format,
        schedule_type: formData.schedule_type,
        days_between_rounds:
          formData.type === "LEAGUE"
            ? Number(formData.days_between_rounds)
            : undefined,
        hours_between_rounds:
          formData.type === "CUP"
            ? Number(formData.hours_between_rounds)
            : undefined,
        max_teams: Number(formData.max_teams),
        entry_fee: Number(formData.entry_fee),
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
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "No se pudo crear el torneo.");
      } else {
        setError("Error de conexión con el servidor.");
      }
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
        padding: "1rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg-card, #111218)",
          border: "1px solid var(--border-subtle, #282a3d)",
          padding: "2rem",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            color: "var(--text-primary, #ffffff)",
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

        {/* Fila 1: Nombre */}
        <div>
          <label
            style={{
              display: "block",
              color: "var(--text-secondary, #9ca3af)",
              fontSize: "0.85rem",
              marginBottom: "0.3rem",
            }}
          >
            Nombre del Torneo
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Copa Pulpito Apertura"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: "100%",
              padding: "0.6rem",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #282a3d",
              color: "#fff",
            }}
          />
        </div>

        {/* Fila 2: Formato y Tier (Incluyendo OPEN) */}
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
                color: "var(--text-secondary, #9ca3af)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Modalidad de Competición
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
                background: "#181924",
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            >
              <option value="CUP">Copa (Playoffs / Bracket)</option>
              <option value="LEAGUE">Liga (Tabla de Posiciones)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary, #9ca3af)",
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
                background: "#181924",
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            >
              <option value="OPEN">Abierto / Sin Restricción (OPEN)</option>
              <option value="HIGH_TIER">Tier Alto (Master +)</option>
              <option value="MID_HIGH">
                Tier Medio-Alto (Esmeralda/Diamante)
              </option>
              <option value="MID">Tier Medio (Oro/Platino)</option>
              <option value="LOW">Tier Bajo (Plata / Bronce / Hierro)</option>
            </select>
          </div>
        </div>

        {/* Fila 3: Formato de Series (Regular y Gran Final) */}
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
                color: "var(--text-secondary, #9ca3af)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Formato Rondas Regulares
            </label>
            <select
              value={formData.default_series_format}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  default_series_format: e.target.value as SeriesFormat,
                })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "#181924",
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            >
              <option value="BO1">Mejor de 1 (Bo1)</option>
              <option value="BO3">Mejor de 3 (Bo3)</option>
              <option value="BO5">Mejor de 5 (Bo5)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary, #9ca3af)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Formato de la Gran Final
            </label>
            <select
              value={formData.final_series_format}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  final_series_format: e.target.value as SeriesFormat,
                })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "#181924",
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            >
              <option value="BO1">Mejor de 1 (Bo1)</option>
              <option value="BO3">Mejor de 3 (Bo3)</option>
              <option value="BO5">Mejor de 5 (Bo5)</option>
            </select>
          </div>
        </div>

        {/* Fila 4: Planificación de Calendario */}
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
                color: "var(--text-secondary, #9ca3af)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Planificación de Partidos
            </label>
            <select
              value={formData.schedule_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  schedule_type: e.target.value as ScheduleType,
                })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "#181924",
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            >
              <option value="SAME_DAY">Un solo dia</option>
              <option value="WEEKEND">Fin de Semana</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary, #9ca3af)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              {formData.type === "LEAGUE"
                ? "Días entre Jornadas"
                : "Horas entre Rondas"}
            </label>
            <input
              type="number"
              step={formData.type === "CUP" ? "0.5" : "1"}
              min={1}
              value={
                formData.type === "LEAGUE"
                  ? formData.days_between_rounds
                  : formData.hours_between_rounds
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ...(formData.type === "LEAGUE"
                    ? { days_between_rounds: Number(e.target.value) }
                    : { hours_between_rounds: Number(e.target.value) }),
                })
              }
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            />
          </div>
        </div>

        {/* Fila 5: Cupos y Costos */}
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
                color: "var(--text-secondary, #9ca3af)",
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
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary, #9ca3af)",
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
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            />
          </div>
        </div>

        {/* Fila 6: Cronograma de Fechas */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}
        >
          <label
            style={{
              color: "var(--text-primary, #ffffff)",
              fontSize: "0.9rem",
              fontWeight: "bold",
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
                  color: "var(--text-secondary, #9ca3af)",
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
                  border: "1px solid #282a3d",
                  color: "#fff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: "var(--text-secondary, #9ca3af)",
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
                  border: "1px solid #282a3d",
                  color: "#fff",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-secondary, #9ca3af)",
                fontSize: "0.85rem",
                marginBottom: "0.3rem",
              }}
            >
              Inicio del Torneo (Ronda 1)
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
                border: "1px solid #282a3d",
                color: "#fff",
              }}
            />
          </div>
        </div>

        {/* Botones */}
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
              color: "var(--text-secondary, #9ca3af)",
              border: "1px solid #282a3d",
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
