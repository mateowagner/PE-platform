import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { useInvitations } from "../hooks/useInvitations"; // ➔ Importación corregida
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // ➔ Necesario para el tipado de errores
import type { Invitation } from "../types";

export default function NotificationBell() {
  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  // ➔ Extraemos las herramientas de red de su propio dominio
  const { getPendingInvitations, respondToInvitation } = useInvitations();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Cargar invitaciones pendientes
  const fetchInvitations = async () => {
    try {
      const data = await getPendingInvitations();
      setInvitations(data || []);
    } catch (error) {
      console.error("Error cargando notificaciones", error);
    }
  };

  useEffect(() => {
    void fetchInvitations();

    const interval = setInterval(() => void fetchInvitations(), 30000);
    return () => clearInterval(interval);
  }, []);

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
  const handleAction = async (id: string, action: "ACCEPT" | "REJECT") => {
    setLoadingAction(id);

    try {
      // Ejecución aislada de red
      await respondToInvitation(id, action);

      if (action === "ACCEPT") {
        const acceptedInv = invitations.find((inv) => inv.id === id);
        if (acceptedInv) {
          updateUser({ teamId: acceptedInv.team.id });
          setIsOpen(false);
          navigate("/team");
        }
      }

      await fetchInvitations();
    } catch (error) {
      // ➔ MANEJO DE ESTADOS HTTP CON AXIOS
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // La magia del 404 ocurre ahora dentro de las excepciones
          setInvitations((prev) => prev.filter((inv) => inv.id !== id));
        } else {
          // Errores como 409 (Ya perteneces a un equipo)
          alert(
            error.response?.data?.message ||
              "Hubo un problema al procesar la solicitud.",
          );
        }
      } else {
        console.error("Error en la acción de la invitación:", error);
      }
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
                      onClick={() => void handleAction(inv.id, "ACCEPT")}
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
                      onClick={() => void handleAction(inv.id, "REJECT")}
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
