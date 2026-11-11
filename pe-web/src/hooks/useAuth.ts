import { apiClient } from "../config/apiClient";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { updateUser, user } = useAuthStore();
  const loginAccount = async (credentials: Record<string, string>) => {
    // Axios inyecta automáticamente el content-type y parsea la respuesta
    const res = await apiClient.post("/auth/login", credentials);
    return res.data;
  };

  const registerAccount = async (data: Record<string, string>) => {
    const res = await apiClient.post("/auth/register", data);
    return res.data;
  };
  const linkRiotAccount = async (riotId: string) => {
    // Axios maneja el JSON y atrapa los errores de la API
    const res = await apiClient.post("/auth/link-riot", { riotId });
    return res.data;
  };
  const refreshProfile = async () => {
    try {
      const { data } = await apiClient.get("/users/me");
      if (data) {
        updateUser(data); // Actualiza al instante el store y el localStorage
      }
      return data;
    } catch (err) {
      console.error("Error al refrescar perfil:", err);
      return null;
    }
  };

  const syncRiotRank = async () => {
    try {
      const { data } = await apiClient.post("/users/me/sync-rank");
      if (data) {
        updateUser(data); // Aplica los LP, división y puntos recién traídos de Riot API
      }
      return data;
    } catch (err) {
      console.error("Error al sincronizar rango:", err);
      throw err;
    }
  };
  return {
    user,
    loginAccount,
    registerAccount,
    linkRiotAccount,
    refreshProfile,
    syncRiotRank,
  };
}
