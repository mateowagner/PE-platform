// pe-web/src/config/apiClient.ts
import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/authStore";

// Estructura de respuesta de renovación de sesión
interface RefreshAuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    riotGameName?: string;
    riotTagLine?: string;
    riotRegion?: string;
    soloTier?: string;
    soloRank?: string;
    soloLp?: number;
    flexTier?: string;
    flexRank?: string;
    flexLp?: number;
    rankPoints?: number;
    teamId?: string;
  };
}

interface FailedRequestPromise {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: FailedRequestPromise[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── INTERCEPTOR DE SALIDA ──────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── INTERCEPTOR DE ENTRADA (Renovación Silenciosa + Queue) ─────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err: unknown) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post<RefreshAuthResponse>(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { accessToken, user } = refreshResponse.data;

      useAuthStore.getState().login(user, accessToken);
      processQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
