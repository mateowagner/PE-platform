import { useState } from "react";
import { useApi } from "../hooks/useApi"; // Ajustá el path según tus carpetas

// Definimos que ahora el componente exige recibir el teamId real por props
interface SendInvitationFormProps {
  teamId: string;
}

export default function SendInvitationForm({
  teamId,
}: SendInvitationFormProps) {
  const { authFetch } = useApi();

  const [inviteeId, setInviteeId] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeId.trim()) return;

    setSending(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      // Usamos el teamId que viene por props de forma segura
      const res = await authFetch(`/invitations/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: inviteeId }),
      });

      // Si la respuesta no es OK, leemos el JSON defensivamente
      if (!res.ok) {
        let errorMessage =
          "No se pudo enviar la invitación. Verifica el ID del jugador.";
        try {
          const data = await res.json();
          // Si el backend mandó un mensaje personalizado (ej: "El jugador no existe"), usamos ese
          if (data.message) errorMessage = data.message;
        } catch {
          // Si ni siquiera se puede parsear el JSON (ej: un 404 de ruta), nos quedamos con el mensaje genérico
        }
        throw new Error(errorMessage);
      }

      setInviteSuccess(true);
      setInviteeId("");
    } catch (err: any) {
      // REGLA DEFENSIVA: Si el error es un "Cannot POST" o error de red crudo, lo solapamos
      if (
        err.message.includes("Cannot POST") ||
        err.message.includes("Failed to fetch")
      ) {
        setInviteError(
          "Hubo un problema de conexión con el servidor. Intentalo más tarde.",
        );
      } else {
        setInviteError(err.message);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        padding: "2rem",
        borderRadius: "8px",
        border: "1px solid var(--border-subtle)",
        marginTop: "2rem",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
          marginBottom: "1.5rem",
          fontSize: "1.25rem",
          fontWeight: "bold",
          letterSpacing: "0.05em",
        }}
      >
        INVITAR JUGADOR AL EQUIPO
      </h3>

      <form
        onSubmit={handleSendInvitation}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Pegá el ID del usuario aquí..."
            value={inviteeId}
            onChange={(e) => setInviteeId(e.target.value)}
            disabled={sending}
            style={{
              flex: 1,
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              padding: "0.75rem 1rem",
              borderRadius: "4px",
              fontSize: "1rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !inviteeId.trim()}
            style={{
              padding: "0.75rem 2rem",
              fontWeight: "600",
              minWidth: "120px",
            }}
          >
            {sending ? "Enviando..." : "ENVIAR"}
          </button>
        </div>

        {/* Feedback visual de Error sanitizado */}
        {inviteError && (
          <p
            style={{
              color: "var(--danger, #ff4d4d)",
              margin: "0.5rem 0 0 0",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            ⚠️ {inviteError}
          </p>
        )}

        {/* Feedback visual de Éxito */}
        {inviteSuccess && (
          <p
            style={{
              color: "var(--success, #4caf50)",
              margin: "0.5rem 0 0 0",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            ✓ ¡Invitación enviada con éxito! El jugador ya puede verla en su
            perfil.
          </p>
        )}
      </form>
    </div>
  );
}
