import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, signupUser } from "../services/auth";

const AuthContext = createContext(null);

// localStorage keys — "workbench_" prefix to avoid clashes with old "nexora_" data
const USER_KEY = "workbench_user";
const TOKEN_KEY = "workbench_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Accept both legacy "nexora_user" and current "workbench_user"
      const saved = localStorage.getItem(USER_KEY) || localStorage.getItem("nexora_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem("nexora_token") || null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("nexora_user"); // clean up legacy key
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("nexora_token"); // clean up legacy key
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ email, name, password, workspace_name }) => {
    setLoading(true);
    try {
      const data = await signupUser({ email, name, password, workspaceName: workspace_name });
      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
