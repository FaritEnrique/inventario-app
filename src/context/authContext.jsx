import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import apiFetch from "../api/apiFetch";
import { normalizeSessionUser } from "../utils/userRoles";

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const inactivityTimer = useRef(null);

  const clearSessionState = () => {
    sessionStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  const applySessionState = (usuario) => {
    const normalizedUser = normalizeSessionUser(usuario);
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));
    setIsAuthenticated(true);
    setUser(normalizedUser);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      logout();
      toast.error(
        "Tu sesion ha expirado por inactividad. Por favor, vuelve a iniciar sesion."
      );
    }, INACTIVITY_TIMEOUT_MS);
  };

  const logout = async () => {
    clearTimeout(inactivityTimer.current);

    try {
      await apiFetch("auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error al cerrar sesion en el backend:", error);
    } finally {
      clearSessionState();
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAppStatus = async () => {
      setLoading(true);

      try {
        const { count } = await apiFetch("usuarios/count");
        if (count === 0) {
          setNeedsInitialSetup(true);
          clearSessionState();
          setLoading(false);
          return;
        }
        setNeedsInitialSetup(false);
      } catch (error) {
        console.error(
          "Error al verificar el estado inicial de la aplicacion:",
          error
        );
      }

      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(normalizeSessionUser(JSON.parse(storedUser)));
        } catch {
          sessionStorage.removeItem("user");
        }
      }

      try {
        const response = await apiFetch("auth/validate-token");

        if (response.valid && response.usuario) {
          applySessionState(response.usuario);
        } else {
          clearSessionState();
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Error al validar el token:", error);
        }
        clearSessionState();
      } finally {
        setLoading(false);
      }
    };

    checkAppStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
    }

    const events = ["mousemove", "keydown", "click", "scroll"];
    const handleActivity = () => {
      if (isAuthenticated) {
        resetInactivityTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      clearTimeout(inactivityTimer.current);
    };
  }, [isAuthenticated]);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response?.usuario) {
        applySessionState(response.usuario);
        resetInactivityTimer();
        return { success: true };
      }

      return { success: false, error: "Credenciales invalidas" };
    } catch (error) {
      console.error("Error al iniciar sesion:", error);
      return {
        success: false,
        error: error.message || "Error al iniciar sesion",
      };
    } finally {
      setLoading(false);
    }
  };

  const completeInitialSetup = () => {
    setNeedsInitialSetup(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        needsInitialSetup,
        completeInitialSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
