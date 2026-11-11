// pe-web/src/store/authStore.ts
import { create } from "zustand";

export interface User {
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
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  login: (user: User, token: string) => void; // Alias para LoginPage y RegisterPage
  setUser: (user: User | null) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialToken = localStorage.getItem("pe_token") || null;
  let initialUser: User | null = null;

  try {
    const storedUser = localStorage.getItem("pe_user");
    if (storedUser) initialUser = JSON.parse(storedUser);
  } catch {
    initialUser = null;
  }

  const saveAuth = (user: User, token: string) => {
    localStorage.setItem("pe_user", JSON.stringify(user));
    localStorage.setItem("pe_token", token);
    set({ user, token, isAuthenticated: true });
  };

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: Boolean(initialToken),

    setAuth: saveAuth,
    login: saveAuth,

    setUser: (user) => {
      if (user) localStorage.setItem("pe_user", JSON.stringify(user));
      else localStorage.removeItem("pe_user");
      set({ user });
    },

    updateUser: (partial) => {
      const current = get().user;
      if (!current) return;
      const updated = { ...current, ...partial };
      localStorage.setItem("pe_user", JSON.stringify(updated));
      set({ user: updated });
    },

    logout: () => {
      localStorage.removeItem("pe_user");
      localStorage.removeItem("pe_token");
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
