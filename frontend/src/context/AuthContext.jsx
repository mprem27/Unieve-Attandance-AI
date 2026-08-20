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
  // RESTORE LOGIN SESSION
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const token = localStorage.getItem(
        "access_token"
      );

      const storedUser =
        localStorage.getItem("user");

      // ---------------------------------------------------
      // NO TOKEN
      // ---------------------------------------------------

      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      // ---------------------------------------------------
      // TEMPORARILY RESTORE STORED USER
      // ---------------------------------------------------
      // This prevents the UI from unnecessarily behaving
      // as logged out while the server validates the token.
      // ---------------------------------------------------

      if (storedUser) {
        try {
          const parsedUser =
            JSON.parse(storedUser);

          if (mounted && parsedUser) {
            setUser(parsedUser);
          }
        } catch {
          localStorage.removeItem("user");
        }
      }

      // ---------------------------------------------------
      // VERIFY TOKEN WITH BACKEND
      // ---------------------------------------------------

      try {
        const currentUser =
          await getCurrentUser();

        if (!mounted) {
          return;
        }

        if (!currentUser) {
          throw new Error(
            "Unable to restore authenticated user."
          );
        }

        setUser(currentUser);

        localStorage.setItem(
          "user",
          JSON.stringify(currentUser)
        );
      } catch (error) {
        console.warn(
          "Unable to restore login session:",
          error
        );

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user"
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (
    email,
    password
  ) => {
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

    // ---------------------------------------------------
    // SAVE TOKEN PERSISTENTLY
    // ---------------------------------------------------

    localStorage.setItem(
      "access_token",
      token
    );

    // ---------------------------------------------------
    // GET CURRENT USER
    // ---------------------------------------------------

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      localStorage.removeItem(
        "access_token"
      );

      throw new Error(
        "Unable to load the logged-in user."
      );
    }

    // ---------------------------------------------------
    // SAVE USER
    // ---------------------------------------------------

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

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn(
        "Logout request failed:",
        error
      );
    } finally {
      // -------------------------------------------------
      // ALWAYS CLEAR LOCAL SESSION
      // -------------------------------------------------

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "user"
      );

      setUser(null);
    }
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
    isAuthenticated:
      Boolean(user),
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;