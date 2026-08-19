import {
  createContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // SESSION
  // =====================================================

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);

        localStorage.setItem(
          "user",
          JSON.stringify(currentUser)
        );
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (email, password) => {
    const data = await loginUser(
      email,
      password
    );

    const token =
      data?.accessToken ||
      data?.access_token;

    if (!token) {
      throw new Error(
        "Access token was not returned by the server."
      );
    }

    localStorage.setItem(
      "access_token",
      token
    );

    const currentUser =
      await getCurrentUser();

    setUser(currentUser);

    localStorage.setItem(
      "user",
      JSON.stringify(currentUser)
    );

    return currentUser;
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  // =====================================================
  // CONTEXT
  // =====================================================

  const value = {
    user,
    loading,
    login,
    logout,
    setUser,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;