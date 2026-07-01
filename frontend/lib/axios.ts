/**
 * Centralised Axios instance.
 *
 * URL strategy
 * ─────────────
 * • In the browser all requests go to `/api/...` which Next.js rewrites to
 *   the backend (see next.config.mjs).  This means NEXT_PUBLIC_API_URL is
 *   only needed at *build time* by next.config.mjs — the browser never
 *   calls Render directly, so there are no CORS preflight issues.
 *
 * • During SSR/SSG (server-side) Next.js also resolves the rewrites, so
 *   relative URLs work there too.
 *
 * Features
 * ─────────
 * • Attaches JWT Bearer token from the Zustand-persisted store
 * • Redirects to /login on 401
 */

import axios from "axios";

// Always use the relative /api path — Next.js rewrites handle the rest.
// Never point directly at the Render URL from the browser.
const api = axios.create({
  baseURL: "/",
  timeout: 60_000,
});

type TokenStore = { state?: { token?: string } };

interface AxiosRequestCfg {
  headers: Record<string, string> & { Authorization?: string };
  [key: string]: unknown;
}

interface AxiosResp {
  status: number;
  data: unknown;
  [key: string]: unknown;
}

// ── Request interceptor — attach Bearer token ─────────────────────────────
api.interceptors.request.use(
  (config: AxiosRequestCfg): AxiosRequestCfg => {
    if (typeof window === "undefined") return config; // skip on server
    try {
      const raw = localStorage.getItem("academic_ai_token");
      if (raw) {
        const parsed = JSON.parse(raw) as TokenStore;
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore parse errors
    }
    return config;
  }
);

// ── Response interceptor — handle 401 ────────────────────────────────────
api.interceptors.response.use(
  (res: AxiosResp): AxiosResp => res,
  (error: { response?: { status?: number } }): Promise<never> => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem("academic_ai_token");
      } catch {
        // ignore
      }
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
