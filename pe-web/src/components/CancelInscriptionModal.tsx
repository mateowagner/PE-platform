interface CancelInscriptionModalProps {
  teamName?: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CancelInscriptionModal = ({
  teamName,
  isLoading,
  onConfirm,
  onCancel,
}: CancelInscriptionModalProps) => {
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
          padding: "2.5rem",
          borderRadius: "8px",
          maxWidth: "420px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--danger, #ef4444)",
            marginBottom: "1rem",
            fontSize: "1.35rem",
            fontWeight: "800",
          }}
        >
          ¿RETIRAR EQUIPO?
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            marginBottom: "2.5rem",
          }}
        >
          ¿Estás seguro de que querés dar de baja a{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {teamName || "tu equipo"}
          </strong>
          ?
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            className="btn btn-outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            Confirmar Baja
          </button>
        </div>
      </div>
    </div>
  );
};
