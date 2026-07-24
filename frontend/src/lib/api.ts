import axios from "axios";

// In dev, Vite proxies /api to :8000. In prod (Vercel), VITE_API_URL points at Render.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

export const api = axios.create({ baseURL });

let accessToken: string | null = localStorage.getItem("access");

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("access", token);
  else localStorage.removeItem("access");
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && location.pathname !== "/login") {
      setAccessToken(null);
      location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/** Pull a human-readable message out of a DRF error envelope. */
export function apiError(error: unknown, fallback = "Something went wrong"): string {
  const e = error as { response?: { data?: { error?: { detail?: unknown } } } };
  const detail = e?.response?.data?.error?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const first = Object.entries(detail)[0];
    if (first) return `${first[0]}: ${String(first[1])}`;
  }
  return fallback;
}
