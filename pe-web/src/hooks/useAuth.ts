import { apiClient } from "../config/apiClient";

export function useAuth() {
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
  return {
    loginAccount,
    registerAccount,
    linkRiotAccount,
  };
}
