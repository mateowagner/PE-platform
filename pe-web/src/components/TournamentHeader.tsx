// pe-web/src/components/TournamentHeader.tsx
import {
  Calendar,
  Users,
  Trophy,
  ShieldAlert,
  Edit3,
  Star,
  UserCheck,
} from "lucide-react";
import type { TournamentDetails, Team, Member } from "../types";
import { getTeamLogo, handleImageError } from "../utils/image";
import "./TournamentHeader.css";

interface TournamentHeaderProps {
  tournament: TournamentDetails;
  user: { id: string; username: string } | null;
  myTeam: Team | null;
  isAlreadyInscribed: boolean;
  registeredStarters?: Member[];
  registeredSubs?: Member[];
  actionLoading: boolean;
  onInscribe: () => void;
  onEditRoster: () => void;
  onCancel: () => void;
}

export const TournamentHeader = ({
  tournament,
  user,
  myTeam,
  isAlreadyInscribed,
  registeredStarters = [],
  registeredSubs = [],
  actionLoading,
  onInscribe,
  onEditRoster,
  onCancel,
}: TournamentHeaderProps) => {
  const isCaptain = myTeam && user && myTeam.owner.id === user.id;

  const formatPrice = (fee: string | number) => {
    const numericFee = typeof fee === "string" ? parseFloat(fee) : fee;
    return numericFee === 0 ? "Gratuito" : `$${numericFee.toLocaleString()}`;
  };

  return (
    <div className="tournament-main-card">
      <div className="tournament-card-top-row">
        <span className="badge-status status-preparing">
          Inscripciones Abiertas
        </span>
        {isAlreadyInscribed && (
          <span className="inscribed-success-pill">✓ Equipo Inscripto</span>
        )}
      </div>

      <h1 className="tournament-title">{tournament.name}</h1>
      <p className="tournament-desc">
        {tournament.description || "Sin descripción disponible."}
      </p>

      {/* Grid de Metadatos */}
      <div className="info-meta-grid">
        <div className="meta-item">
          <Calendar size={18} className="icon-cyan" />
          <div>
            <label>Inicio Oficial</label>
            <span>
              {new Date(tournament.start_date).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="meta-item">
          <Users size={18} className="icon-cyan" />
          <div>
            <label>Cupos</label>
            <span>
              {tournament.currentTeamsCount} / {tournament.max_teams} Escuadras
            </span>
          </div>
        </div>

        <div className="meta-item">
          <Trophy size={18} className="icon-gold" />
          <div>
            <label>Premios</label>
            <span>{tournament.prize_pool || "Honor & Gloria"}</span>
          </div>
        </div>

        <div className="meta-item">
          <label className="text-label">Inscripción</label>
          <span className="fee-text">{formatPrice(tournament.entry_fee)}</span>
        </div>
      </div>

      {/* Roster Activo Inscripto (Si el equipo ya está anotado) */}
      {isAlreadyInscribed && myTeam && (
        <div className="active-roster-display-box">
          <div className="active-roster-header">
            <div className="team-roster-identity">
              <img
                src={getTeamLogo(myTeam)}
                alt={myTeam.name}
                className="inscribed-team-logo"
                onError={(e) => handleImageError(e, "/logo.jpeg")}
              />
              <div>
                <h4>Plantilla Registrada: {myTeam.name}</h4>
                <span>Lista de buena fe confirmada</span>
              </div>
            </div>

            {isCaptain && (
              <button
                type="button"
                className="btn-edit-roster-inline"
                onClick={onEditRoster}
                disabled={actionLoading}
                title="Modificar Titulares y Suplentes"
              >
                <Edit3 size={14} /> Modificar Roster
              </button>
            )}
          </div>

          <div className="roster-chips-grid">
            {registeredStarters.map((m, idx) => (
              <div key={m.id} className="roster-chip chip-starter">
                <Star size={11} className="text-gold" />
                <span className="chip-name truncate">{m.username}</span>
                <span className="chip-pos-tag">T{idx + 1}</span>
              </div>
            ))}

            {registeredSubs.map((m, idx) => (
              <div key={m.id} className="roster-chip chip-sub">
                <UserCheck size={11} className="text-purple" />
                <span className="chip-name truncate">{m.username}</span>
                <span className="chip-pos-tag">S{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="tournament-actions-panel">
        {myTeam ? (
          isCaptain ? (
            isAlreadyInscribed ? (
              <button
                type="button"
                className="btn btn-danger btn-lg w-100"
                onClick={onCancel}
                disabled={actionLoading}
              >
                Dar de Baja Inscripción
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-lg w-100"
                onClick={onInscribe}
                disabled={
                  actionLoading ||
                  tournament.currentTeamsCount >= tournament.max_teams
                }
              >
                Inscribir Escuadra (Armar Roster)
              </button>
            )
          ) : (
            <div className="warning-box">
              <ShieldAlert size={18} />
              <p>
                Solo el capitán ({myTeam.owner.username}) puede gestionar la
                inscripción.
              </p>
            </div>
          )
        ) : (
          <div className="warning-box">
            <ShieldAlert size={18} />
            <p>
              Debes pertenecer a una escuadra oficial para participar en
              torneos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
