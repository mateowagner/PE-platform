// pe-web/src/components/NotificationBell.tsx
import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { useInvitations } from "../hooks/useInvitations";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { getTeamLogo, handleImageError } from "../utils/image";
import axios from "axios";
import type { Invitation } from "../types";

export default function NotificationBell() {
  const { updateUser } = useAuthStore();
  const navigate = useNavigate();
  const { getPendingInvitations, respondToInvitation } = useInvitations();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchInvitations = async () => {
    try {
      const data = await getPendingInvitations();
      setInvitations(data || []);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
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

  const handleAction = async (id: string, action: "accept" | "reject") => {
    setLoadingAction(id);

    try {
      await respondToInvitation(id, action);

      if (action === "accept") {
        const acceptedInv = invitations.find((inv) => inv.id === id);
        if (acceptedInv) {
          updateUser({ teamId: acceptedInv.team.id });
          setIsOpen(false);
          navigate("/team");
        }
      }

      await fetchInvitations();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setInvitations((prev) => prev.filter((inv) => inv.id !== id));
        } else {
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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary, #9ca3af)",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--text-primary, #ffffff)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-secondary, #9ca3af)")
        }
      >
        <Bell size={22} />

        {invitations.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "#ff6b00",
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
              boxShadow: "0 0 0 2px #0a0a0c",
            }}
          >
            {invitations.length}
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "8px",
            width: "320px",
            background: "#111218",
            border: "1px solid #282a3d",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.7)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid #1e2233",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "#ffffff",
                fontWeight: "bold",
                letterSpacing: "0.5px",
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
                  color: "#6b7280",
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
                    padding: "0.85rem 1rem",
                    borderBottom: "1px solid #1a1c28",
                    background: "rgba(255,255,255,0.01)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={getTeamLogo(inv.team)}
                      alt={inv.team.name}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                      onError={(e) => handleImageError(e, "/logo.jpeg")}
                    />
                    <div style={{ overflow: "hidden" }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          color: "#ffffff",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {inv.team.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.7rem",
                          color: "#9ca3af",
                        }}
                      >
                        Te invitó a unirte
                      </p>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div
                    style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}
                  >
                    <button
                      type="button"
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
                      title="Aceptar invitación"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
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
                      title="Rechazar invitación"
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
