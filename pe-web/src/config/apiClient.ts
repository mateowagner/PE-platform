import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE = import.meta.env.VITE_API_URL;

// 1. INSTANCIA BASE CONFIGURADA
export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ➔ CRÍTICO: Permite enviar y recibir la cookie HTTP-Only (Refresh Token)
});

// 2. INTERCEPTOR DE SALIDA (Inyección automática del Access Token)
apiClient.interceptors.request.use(
  (config) => {
    // Obtenemos el token más reciente directo del estado global
    const token = useAuthStore.getState().token;

    // Si hay sesión activa, inyectamos la cabecera
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 3. INTERCEPTOR DE ENTRADA (Renovación silenciosa del Access Token)
apiClient.interceptors.response.use(
  (response) => response, // Si todo sale bien (2xx), dejamos pasar la respuesta intacta
  async (error) => {
    const originalRequest = error.config;

    // Si el servidor escupe un 401 (Token Expirado) y no es una ruta de autenticación
    if (
      error.response?.status === 401 &&
      originalRequest.url &&
      !originalRequest.url.includes("/auth/") &&
      !originalRequest._retry
    ) {
      // ➔ Prevenimos el bucle infinito marcando la petición como "ya reintentada"
      originalRequest._retry = true;

      try {
        // Usamos axios PURO (no apiClient) para aislar la petición y evitar caer de nuevo en este interceptor
        const refreshResponse = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken, user } = refreshResponse.data;

        // Actualizamos la memoria global de Zustand con los nuevos 15 minutos de vida
        useAuthStore.getState().login(user, accessToken);

        // Mutamos la petición original caída con la llave nueva
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Reintentamos el golpe al servidor con la misma configuración
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla (pasaron 30 días, o borraron cookies manuales), liquidamos la sesión
        useAuthStore.getState().logout();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // Cualquier otro error (400, 403, 500) lo dejamos pasar para que lo ataje tu UI
    return Promise.reject(error);
  },
);
