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
  mfa_enabled?: boolean;
  lead_routing_strategy?: string | null;
}

interface AuthState {
  me: Me | null;
  loading: boolean;
  /** True after password login when MFA still needs verification. */
  mfaPending: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean }>;
  completeMfa: () => void;
  logout: () => void;
  loadMe: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  me: null,
  loading: true,
  mfaPending: false,
  async login(email, password) {
    const { data } = await api.post("/auth/token/", { email, password });
    setAccessToken(data.access);
    const me = await api.get<Me>("/me/");
    const mfaRequired = Boolean(me.data.mfa_enabled);
    set({
      me: me.data,
      loading: false,
      mfaPending: mfaRequired,
    });
    return { mfaRequired };
  },
  completeMfa() {
    set({ mfaPending: false });
  },
  logout() {
    setAccessToken(null);
    set({ me: null, mfaPending: false });
  },
  async loadMe() {
    try {
      const me = await api.get<Me>("/me/");
      set({ me: me.data, loading: false, mfaPending: false });
    } catch {
      set({ me: null, loading: false, mfaPending: false });
    }
  },
  async refreshMe() {
    const me = await api.get<Me>("/me/");
    set({ me: me.data });
  },
}));
