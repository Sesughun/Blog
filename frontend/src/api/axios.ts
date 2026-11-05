import axios from "axios";

const TOKEN_KEY = "folio_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Turn a DRF error response into one readable message. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (!data) return "Could not reach the server.";
    if (typeof data === "string") return "Something went wrong.";
    if (data.detail) return String(data.detail);
    const first = Object.entries(data)[0];
    if (first) {
      const [field, msg] = first as [string, unknown];
      return `${field}: ${Array.isArray(msg) ? msg[0] : msg}`;
    }
  }
  return "Something went wrong.";
}

export default api;
