import { Calendar, Users, Trophy, ShieldAlert } from "lucide-react";
import type { TournamentDetails } from "../types";

interface TournamentHeaderProps {
  tournament: TournamentDetails;
  user: any;
  myTeam: any;
  isAlreadyInscribed: boolean;
  actionLoading: boolean;
  onInscribe: () => void;
  onCancel: () => void;
}

export const TournamentHeader = ({
  tournament,
  user,
  myTeam,
  isAlreadyInscribed,
  actionLoading,
  onInscribe,
  onCancel,
}: TournamentHeaderProps) => {
  // La lógica visual se encapsula en el componente presentacional
  const formatPrice = (fee: string | number) => {
    const numericFee = typeof fee === "string" ? parseFloat(fee) : fee;
    return numericFee === 0 ? "Gratuito" : `$${numericFee.toLocaleString()}`;
  };

  return (
    <div className="tournament-main-card">
      <span className="badge-status status-preparing">
        Inscripciones Abiertas
      </span>
      <h1 className="tournament-title">{tournament.name}</h1>
      <p className="tournament-desc">
        {tournament.description || "Sin descripción disponible."}
      </p>

      <div className="info-meta-grid">
        <div className="meta-item">
          <Calendar size={20} className="icon-purple" />
          <div>
            <label>Inicio del Torneo</label>
            <span>
              {new Date(tournament.start_date).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="meta-item">
          <Users size={20} className="icon-purple" />
          <div>
            <label>Cupos Disponibles</label>
            <span>
              {tournament.currentTeamsCount} / {tournament.max_teams} Equipos
            </span>
          </div>
        </div>
        <div className="meta-item">
          <Trophy size={20} className="icon-purple" />
          <div>
            <label>Premios / Prize Pool</label>
            <span>{tournament.prize_pool || "Inscripción de Honor"}</span>
          </div>
        </div>
        <div className="meta-item">
          <label className="text-label">Costo de inscripción:</label>
          <span className="fee-text">{formatPrice(tournament.entry_fee)}</span>
        </div>
      </div>

      <div className="tournament-actions-panel">
        {myTeam ? (
          myTeam.owner.id === user?.id ? (
            myTeam.members.length >= 0 ? (
              isAlreadyInscribed ? (
                <button
                  className="btn btn-danger btn-lg w-100"
                  onClick={onCancel}
                  disabled={actionLoading}
                >
                  DAR DE BAJA EQUIPO
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={onInscribe}
                  disabled={
                    actionLoading ||
                    tournament.currentTeamsCount >= tournament.max_teams
                  }
                >
                  INSCRIBIR MI EQUIPO
                </button>
              )
            ) : (
              <div className="warning-box">
                <ShieldAlert size={18} />
                <p>El roster debe tener miembros activos para competir.</p>
              </div>
            )
          ) : (
            <div className="warning-box">
              <ShieldAlert size={18} />
              <p>
                Solo el capitán ({myTeam.owner.username}) puede inscribir al
                equipo.
              </p>
            </div>
          )
        ) : (
          <div className="warning-box">
            <ShieldAlert size={18} />
            <p>
              Necesitás pertenecer o ser capitán de un equipo para poder
              inscribirte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
