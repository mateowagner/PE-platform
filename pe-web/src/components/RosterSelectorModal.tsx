// pe-web/src/components/RosterSelectorModal.tsx
import { useState, useEffect } from "react";
import type { Member, TournamentDetails } from "../types";
import { validatePlayerTier } from "../utils/tierValidator";
import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Users,
  Star,
  Armchair,
} from "lucide-react";
import "./RosterSelectorModal.css";

interface RosterSelectorModalProps {
  tournament: TournamentDetails;
  availableMembers: Member[];
  initialStarters?: string[];
  initialSubs?: string[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (starters: string[], subs: string[]) => Promise<void>;
}

export function RosterSelectorModal({
  tournament,
  availableMembers,
  initialStarters = [],
  initialSubs = [],
  isOpen,
  onClose,
  onConfirm,
}: RosterSelectorModalProps) {
  // Mantener orden de selección: los primeros 5 son titulares, 6to y 7mo suplentes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStarters.length > 0) {
      setSelectedIds([...initialStarters, ...initialSubs]);
    }
  }, [initialStarters, initialSubs]);

  if (!isOpen) return null;

  const starters = selectedIds.slice(0, 5);
  const subs = selectedIds.slice(5, 7);

  const togglePlayer = (userId: string, isAllowed: boolean) => {
    if (!isAllowed) return;
    setError(null);

    if (selectedIds.includes(userId)) {
      setSelectedIds(selectedIds.filter((id) => id !== userId));
    } else {
      if (selectedIds.length >= 7) {
        setError(
          "El límite máximo de la plantilla es de 7 jugadores (5 titulares + 2 suplentes).",
        );
        return;
      }
      setSelectedIds([...selectedIds, userId]);
    }
  };

  const handleSave = async () => {
    if (starters.length < 5) {
      setError(
        "Debes seleccionar obligatoriamente al menos 5 titulares para competir.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(starters, subs);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al registrar la plantilla.";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="roster-modal-backdrop" onClick={onClose}>
      <div
        className="roster-modal-container fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="roster-modal-header">
          <div className="roster-header-title-flex">
            <Shield size={22} className="text-gold" />
            <div>
              <h3>Confirmar Roster Oficial</h3>
              <p>
                {tournament.name} • Tier {tournament.skill_tier}
              </p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Guía informativa de cupos */}
        <div className="roster-status-banner">
          <div className="roster-counter-pill">
            <Users size={15} />
            <span>
              Seleccionados: <strong>{selectedIds.length} / 7</strong>
            </span>
          </div>

          <div className="roster-legend-tags">
            <span className="legend-tag legend-starter">
              <Star size={12} /> Titulares ({starters.length}/5)
            </span>
            <span className="legend-tag legend-sub">
              <Armchair size={13} /> Suplentes ({subs.length}/2)
            </span>
          </div>
        </div>

        {error && (
          <div className="roster-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Lista interactiva de jugadores */}
        <div className="roster-players-scroll">
          {availableMembers.map((member) => {
            const isSelected = selectedIds.includes(member.id);
            const selectionIndex = selectedIds.indexOf(member.id);
            const isStarter = isSelected && selectionIndex < 5;
            const isSub = isSelected && selectionIndex >= 5;

            const validation = validatePlayerTier(
              member.soloTier,
              tournament.skill_tier,
              Boolean(member.riotGameName),
            );

            return (
              <div
                key={member.id}
                className={`roster-player-card ${
                  !validation.allowed
                    ? "card-blocked"
                    : isStarter
                      ? "card-starter"
                      : isSub
                        ? "card-sub"
                        : "card-available"
                }`}
                onClick={() => togglePlayer(member.id, validation.allowed)}
              >
                <div className="player-meta-left">
                  <div className="player-avatar-badge">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="player-names-row">
                      <span className="player-name">{member.username}</span>
                      {member.riotGameName && (
                        <span className="player-riot-id">
                          ({member.riotGameName}#{member.riotTagLine})
                        </span>
                      )}
                    </div>
                    <span className="player-tier-sub">
                      Rango:{" "}
                      <strong>
                        {member.soloTier || "UNRANKED"} {member.soloRank || ""}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="player-status-right">
                  {!validation.allowed ? (
                    <span className="status-blocked-tag">
                      {validation.reason}
                    </span>
                  ) : isStarter ? (
                    <span className="role-tag role-starter">
                      <Star size={12} /> Titular #{selectionIndex + 1}
                    </span>
                  ) : isSub ? (
                    <span className="role-tag role-sub">
                      <Armchair size={13} /> Suplente #{selectionIndex - 4}
                    </span>
                  ) : (
                    <span className="status-selectable-tag">Elegir</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="roster-modal-footer">
          <p className="roster-footer-help">
            * Los primeros 5 seleccionados juegan como titulares. Puedes
            modificar la lista antes de que inicie la ronda 1.
          </p>
          <div className="roster-footer-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || starters.length < 5}
              onClick={handleSave}
            >
              <Check size={16} />
              {isSubmitting ? "Guardando Roster..." : "Confirmar Plantilla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
