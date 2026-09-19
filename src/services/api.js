/**
 * Central API configuration.
 * All backend communication goes through this base URL.
 * Change this one constant to point at a different backend.
 */
export const API_BASE = "http://localhost:8000";

/**
 * Thin fetch wrapper that prepends API_BASE and sets Content-Type.
 * Returns the raw Response so callers can handle ok/error as needed.
 */
export async function apiFetch(path, options = {}) {
  const { headers = {}, ...rest } = options;
  return fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...headers },
    ...rest,
  });
}
