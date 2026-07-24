import { create } from "zustand";

import { api, setAccessToken } from "./api";

export interface Me {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant: string | null;
  branch: string | null;
  team: string | null;
}

interface AuthState {
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  me: null,
  loading: true,
  async login(email, password) {
    const { data } = await api.post("/auth/token/", { email, password });
    setAccessToken(data.access);
    const me = await api.get<Me>("/me/");
    set({ me: me.data, loading: false });
  },
  logout() {
    setAccessToken(null);
    set({ me: null });
  },
  async loadMe() {
    try {
      const me = await api.get<Me>("/me/");
      set({ me: me.data, loading: false });
    } catch {
      set({ me: null, loading: false });
    }
  },
}));
