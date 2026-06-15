import { useAuthStore } from "../store/authStore";
import type { Tournament, TournamentDetails } from "../types"; // ➔ Importamos las interfaces unificadas

const API_BASE = import.meta.env.VITE_API_URL;

export function useApi() {
  const { logout } = useAuthStore();

  const authFetch = async (
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    const token = useAuthStore.getState().token;

    const makeRequest = (t: string) =>
      fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
          ...(options.headers ?? {}),
        },
        credentials: "include",
      });

    let res = await makeRequest(token ?? "");

    if (res.status === 401) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshRes.ok) {
          const refreshData = (await refreshRes.json()) as {
            accessToken: string;
            user: Parameters<
              ReturnType<typeof useAuthStore.getState>["login"]
            >[0];
          };

          useAuthStore
            .getState()
            .login(refreshData.user, refreshData.accessToken);

          res = await makeRequest(refreshData.accessToken);
        } else {
          logout();
          window.location.href = "/";
        }
      } catch {
        logout();
        window.location.href = "/";
      }
    }

    return res;
  };

  // ─── SERVICIOS ADMINISTRATIVOS DE ESCRITURA (NUEVOS) ───────────────────

  // 1. CREAR TORNEO (Gatillado por el Modal / Formulario)
  const createTournament = async (
    data: Partial<Tournament>,
  ): Promise<Tournament> => {
    const res = await authFetch("/tournaments", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Error al crear el torneo.");
    }

    return (await res.json()) as Tournament;
  };

  // 2. EDITAR TORNEO (Gatillado por el panel de detalles)
  const updateTournament = async (
    id: string,
    data: Partial<Tournament>,
  ): Promise<TournamentDetails> => {
    const res = await authFetch(`/tournaments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Error al actualizar el torneo.");
    }

    return (await res.json()) as TournamentDetails;
  };

  // 3. ELIMINAR TORNEO (Abstrae la destrucción física/lógica de la base de datos)
  const deleteTournament = async (id: string): Promise<void> => {
    const res = await authFetch(`/tournaments/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "No se pudo eliminar el torneo.");
    }
  };

  // Exportamos los métodos listos para usar consumiendo el mismo interceptor
  return {
    authFetch,
    createTournament,
    updateTournament,
    deleteTournament,
  };
}
