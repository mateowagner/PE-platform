import { useAuthStore } from "../store/authStore";

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

    // Token vencido — intentar refresh automático
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

          // Actualizar el store con el nuevo token
          useAuthStore
            .getState()
            .login(refreshData.user, refreshData.accessToken);

          // Reintentar el request original con el nuevo token
          res = await makeRequest(refreshData.accessToken);
        } else {
          // Refresh falló — sesión expirada, logout
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

  return { authFetch };
}
