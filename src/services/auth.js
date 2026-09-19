import { apiFetch } from "./api";

/**
 * Sign up a new user.
 * @returns {{ success, user, token, message }}
 */
export async function signupUser({ email, name, password, workspaceName }) {
  const res = await apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, name, password, workspace_name: workspaceName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Signup failed.");
  return data;
}

/**
 * Log in an existing user.
 * @returns {{ success, user, token, message }}
 */
export async function loginUser({ email, password }) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed.");
  return data;
}
