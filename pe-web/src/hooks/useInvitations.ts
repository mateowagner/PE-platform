import { apiClient } from "../config/apiClient";
import type { Invitation } from "../types";
export function useInvitations() {
  const sendInvitation = async (
    teamId: string,
    userId: string,
  ): Promise<void> => {
    // Axios maneja el stringify, los headers, y arroja excepción si no es 2xx
    await apiClient.post(`/invitations/${teamId}`, { userId });
  };
  const getPendingInvitations = async (): Promise<Invitation[]> => {
    const res = await apiClient.get<{ invitations: Invitation[] }>(
      "/invitations/pending-invitations",
    );
    // Retornamos directamente el arreglo desempaquetado
    return res.data.invitations;
  };

  const respondToInvitation = async (
    invitationId: string,
    action: "ACCEPT" | "REJECT",
  ): Promise<void> => {
    // Ajustá esta ruta si tu backend usa endpoints separados (ej: /accept o /reject)
    await apiClient.post(`/invitations/${invitationId}/respond`, { action });
  };
  return { sendInvitation, getPendingInvitations, respondToInvitation };
}
