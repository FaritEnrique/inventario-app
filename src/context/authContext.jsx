import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import apiFetch from "../api/apiFetch";
import { toast } from "react-toastify";

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const inactivityTimer = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      logout();
      toast.error(
        "Tu sesión ha expirado por inactividad. Por favor, vuelve a iniciar sesión."
      );
    }, INACTIVITY_TIMEOUT_MS);
  };

  const logout = async () => {
    clearTimeout(inactivityTimer.current);
    try {
      await apiFetch("auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error al cerrar sesión en el backend:", error);
    } finally {
      sessionStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
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
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error al verificar el estado inicial de la aplicación:", error);
        // Opcional: manejar el error de forma más visible para el usuario
      }

      const storedUser = sessionStorage.getItem("user");

      if (!storedUser) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch("auth/validate-token");

        if (res.valid && res.usuario) {
          setIsAuthenticated(true);
          setUser(res.usuario);
          sessionStorage.setItem("user", JSON.stringify(res.usuario));
        } else {
          sessionStorage.removeItem("user");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Error al validar el token:", error);
        }
        sessionStorage.removeItem("user");
        setIsAuthenticated(false);
        setUser(null);
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

      if (response && response.usuario) {
        const { usuario } = response;
        sessionStorage.setItem("user", JSON.stringify(usuario));

        setIsAuthenticated(true);
        setUser(usuario);
        resetInactivityTimer();
        return { success: true };
      } else {
        return { success: false, error: "Credenciales inválidas" };
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      const errorMessage = error.message || "Error al iniciar sesión";
      return { success: false, error: errorMessage };
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};