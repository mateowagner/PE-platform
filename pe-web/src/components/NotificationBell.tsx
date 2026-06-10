import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
interface Invitation {
  id: string;
  status: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}

export default function NotificationBell() {
  const { authFetch } = useApi();
  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Cargar invitaciones pendientes
  const fetchInvitations = async () => {
    try {
      const res = await authFetch("/invitations/pending-invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error cargando notificaciones", error);
    }
  };

  useEffect(() => {
    void fetchInvitations();

    // Intervalo opcional para que revise cada 30 segundos si hay invitaciones nuevas
    const interval = setInterval(() => void fetchInvitations(), 30000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar el menú si hace clic afuera de la campanita
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Manejar las acciones de los botones (Aceptar / Rechazar)
  const handleAction = async (id: string, action: "accept" | "reject") => {
    setLoadingAction(id);
    try {
      const res = await authFetch(`/invitations/${id}/${action}`, {
        method: "POST",
      });

      // ESCENARIO 1: Todo salió perfecto (200/201 OK)
      if (res.ok) {
        if (action === "accept") {
          const acceptedInv = invitations.find((inv) => inv.id === id);
          if (acceptedInv) {
            updateUser({ teamId: acceptedInv.team.id });
            setIsOpen(false);
            navigate("/team");
          }
        }
        await fetchInvitations(); // Refresca la lista
        return;
      }

      // ESCENARIO 2: El backend rebotó la petición (Errores 400, 404, 409, etc.)
      const data = await res.json();

      if (res.status === 404) {
        // ¡Acá está la magia! Si es 404, significa que ya no está pendiente.
        // En vez de tirar alert(), la removemos silenciosamente del estado local
        setInvitations((prev) => prev.filter((inv) => inv.id !== id));

        // Opcional: refrescamos por las dudas para sincronizar con el back
        void fetchInvitations();
      } else {
        // Si es otro tipo de error (ej: 409 porque ya tiene otro equipo), ahí sí avisamos
        alert(data.message || "Hubo un problema al procesar la solicitud.");
      }
    } catch (error) {
      console.error("Error en la acción de la invitación:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Botón de la Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--text-primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-secondary)")
        }
      >
        <Bell size={22} />

        {/* Badge llamativo con el número (Naranja/Rojo) */}
        {invitations.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "var(--orange-bright, #ff6b00)", // Tu color naranja corporativo
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              borderRadius: "50%",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 0 0 2px var(--bg-body, #0a0a0c)",
            }}
          >
            {invitations.length}
          </span>
        )}
      </button>

      {/* Menú Desplegable (Dropdown) */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "8px",
            width: "320px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "var(--text-primary)",
                fontWeight: "bold",
              }}
            >
              INVITACIONES RECIBIDAS
            </h4>
          </div>

          <div style={{ maxHeight: "280px", overflowY: "auto" }}>
            {invitations.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: "1.5rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              >
                No tenés invitaciones pendientes.
              </p>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: "rgba(255,255,255,0.01)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <img
                      src={inv.team.logoUrl || "/logo.jpeg"}
                      alt={inv.team.name}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          color: "var(--text-primary)",
                          fontWeight: "600",
                        }}
                      >
                        {inv.team.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Te invitó a unirte
                      </p>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      disabled={loadingAction !== null}
                      onClick={() => void handleAction(inv.id, "accept")}
                      style={{
                        background: "rgba(76, 175, 80, 0.15)",
                        border: "1px solid #4caf50",
                        color: "#4caf50",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      disabled={loadingAction !== null}
                      onClick={() => void handleAction(inv.id, "reject")}
                      style={{
                        background: "rgba(244, 67, 54, 0.15)",
                        border: "1px solid #f44336",
                        color: "#f44336",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
