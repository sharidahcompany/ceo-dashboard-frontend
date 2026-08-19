import "server-only";
import axios from "axios";
import { cookies } from "next/headers";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
  // Without this a hung upstream leaves the caller's promise pending forever —
  // client grids sit on their loading skeleton until a full page reload.
  timeout: 60_000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const cookieStore = await cookies();

      const token = cookieStore.get("auth_token")?.value;
      const language = cookieStore.get("NEXT_LOCALE")?.value || "ar";
      const tenant = cookieStore.get("tenant")?.value;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (language) {
        config.headers["Accept-Language"] = language;
      }

      if (tenant && !config.headers["X-Tenant"]) {
        config.headers["X-Tenant"] = tenant;
      }

      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

    } catch (error) {
      console.error("Failed to fetch cookies:", error);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;