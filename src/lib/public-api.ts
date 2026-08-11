import "server-only";
import axios from "axios";

/**
 * Bare API client for the fully public, unauthenticated document endpoints
 * (verification and signing). Deliberately separate from `@/lib/api`: that
 * client exists specifically to attach the `auth_token`/`tenant` cookies, and
 * a public visitor has neither — there is nothing for it to attach, and
 * reusing it would be misleading about what these calls actually send.
 */
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 10000,
});

// Same fix as @/lib/api: let axios set the multipart boundary itself instead
// of sending a plain "multipart/form-data" header with none.
publicApi.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default publicApi;
