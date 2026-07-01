/**
 * Axios instance with:
 *  - Automatic Bearer token injection from auth store
 *  - 401 → redirect to /login
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/",
  timeout: 60000,
});

type TokenStore = { state?: { token?: string } };

// Type the interceptor config via the axios request config interface.
// We use ReturnType of create to keep everything inferred from the instance.
type ApiInstance = typeof api;

// Extract InternalAxiosRequestConfig via the instance's defaults type
type ReqConfig = ApiInstance["defaults"] extends { headers: infer _H }
  ? Awaited<ReturnType<ApiInstance["request"]>> extends { config: infer C }
    ? C
    : ApiInstance["defaults"]
  : ApiInstance["defaults"];

// Simpler: cast to a compatible shape we know axios sends
interface AxiosRequestCfg {
  headers: Record<string, string> & { Authorization?: string };
  [key: string]: unknown;
}

interface AxiosResp {
  status: number;
  data: unknown;
  [key: string]: unknown;
}

// Request interceptor — attach token
api.interceptors.request.use(
  (config: AxiosRequestCfg): AxiosRequestCfg => {
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

// Response interceptor — handle 401
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
