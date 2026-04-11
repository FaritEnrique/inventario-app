import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import apiFetch from "../api/apiFetch";
import { normalizeSessionUser } from "../utils/userRoles";

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const SESSION_STORAGE_KEY = "auth-session-v2";

const normalizeActiveContext = (context) => {
  if (!context || typeof context !== "object") {
    return null;
  }

  return {
    ...context,
    role: context.role || context.rolOperativo || null,
    rolOperativo: context.rolOperativo || context.role || null,
    areaId: Number(context.areaId || context.area?.id || 0) || null,
    areaNombre: context.areaNombre || context.area?.nombre || null,
    area: context.area
      ? {
          ...context.area,
          id: Number(context.area.id || context.areaId || 0) || null,
        }
      : context.areaId
        ? {
            id: Number(context.areaId),
            nombre: context.areaNombre || null,
            abreviatura: context.areaAbreviatura || null,
            codigo: context.areaCodigo || null,
            branchDescription: context.branchDescription || null,
            tipoUnidad: context.tipoUnidad || null,
          }
        : null,
  };
};

const normalizeAvailableContexts = (contexts) =>
  Array.isArray(contexts)
    ? contexts
        .map((context) => normalizeActiveContext(context))
        .filter(Boolean)
    : [];

const buildOperationalUser = (identity, activeContext) => {
  if (!identity || !activeContext) {
    return null;
  }

  const normalizedIdentity = normalizeSessionUser(identity);
  const normalizedContext = normalizeActiveContext(activeContext);

  return {
    id: normalizedIdentity.id,
    email: normalizedIdentity.email,
    nombre: normalizedIdentity.nombre,
    cargo: normalizedIdentity.cargo,
    codigoUsuario: normalizedIdentity.codigoUsuario || null,
    activo: normalizedIdentity.activo,
    rol: normalizedContext.role || normalizedContext.rolOperativo,
    areaId:
      normalizedContext.areaId ||
      Number(normalizedContext.area?.id || normalizedIdentity.areaId || 0) ||
      null,
    areaNombre:
      normalizedContext.areaNombre ||
      normalizedContext.area?.nombre ||
      normalizedIdentity.areaNombre ||
      null,
    areaAbreviatura:
      normalizedContext.area?.abreviatura || normalizedIdentity.areaAbreviatura || null,
    areaCodigo:
      normalizedContext.area?.codigo || normalizedIdentity.areaCodigo || null,
    area:
      normalizedContext.area ||
      (normalizedContext.areaId
        ? {
            id: normalizedContext.areaId,
            nombre: normalizedContext.areaNombre || null,
            abreviatura: normalizedContext.areaAbreviatura || null,
            codigo: normalizedContext.areaCodigo || null,
            branchDescription: normalizedContext.branchDescription || null,
            tipoUnidad: normalizedContext.tipoUnidad || null,
          }
        : normalizedIdentity.area),
    activeContext: normalizedContext,
  };
};

const persistSessionSnapshot = ({ identity, availableContexts, activeContext }) => {
  const payload = {
    identity,
    availableContexts,
    activeContext,
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
};

const readStoredSessionSnapshot = () => {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [user, setUser] = useState(null);
  const [activeContext, setActiveContext] = useState(null);
  const [availableContexts, setAvailableContexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contextBusy, setContextBusy] = useState(false);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const inactivityTimer = useRef(null);

  const clearSessionState = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setIsAuthenticated(false);
    setIdentity(null);
    setUser(null);
    setActiveContext(null);
    setAvailableContexts([]);
  }, []);

  const applySessionState = useCallback(
    (sessionPayload) => {
      const normalizedIdentity = normalizeSessionUser(
        sessionPayload?.identity || sessionPayload?.usuario || null
      );
      const normalizedContexts = normalizeAvailableContexts(
        sessionPayload?.availableContexts
      );
      const normalizedActiveContext = normalizeActiveContext(
        sessionPayload?.activeContext
      );
      const operationalUser = buildOperationalUser(
        normalizedIdentity,
        normalizedActiveContext
      );

      if (!normalizedIdentity) {
        clearSessionState();
        return null;
      }

      persistSessionSnapshot({
        identity: normalizedIdentity,
        availableContexts: normalizedContexts,
        activeContext: normalizedActiveContext,
      });

      setIsAuthenticated(true);
      setIdentity(normalizedIdentity);
      setAvailableContexts(normalizedContexts);
      setActiveContext(normalizedActiveContext);
      setUser(operationalUser);

      return {
        identity: normalizedIdentity,
        availableContexts: normalizedContexts,
        activeContext: normalizedActiveContext,
        user: operationalUser,
      };
    },
    [clearSessionState]
  );

  const logout = useCallback(async () => {
    clearTimeout(inactivityTimer.current);

    try {
      await apiFetch("auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error al cerrar sesion en el backend:", error);
    } finally {
      clearSessionState();
      setLoading(false);
      setContextBusy(false);
    }
  }, [clearSessionState]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      logout();
      toast.error(
        "Tu sesion ha expirado por inactividad. Por favor, vuelve a iniciar sesion."
      );
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  const refreshAuthSession = useCallback(async () => {
    const response = await apiFetch("auth/validate-token");

    if (response.valid && response.identity) {
      const shouldAutoActivateSingleContext =
        !response.activeContext &&
        Array.isArray(response.availableContexts) &&
        response.availableContexts.length === 1 &&
        response.availableContexts[0]?.contextKey;

      if (shouldAutoActivateSingleContext) {
        const activatedSession = await apiFetch("auth/context/activate", {
          method: "POST",
          body: JSON.stringify({
            contextKey: response.availableContexts[0].contextKey,
          }),
        });

        applySessionState(activatedSession);
        return activatedSession;
      }

      applySessionState(response);
      return response;
    }

    clearSessionState();
    return null;
  }, [applySessionState, clearSessionState]);

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

      const storedSession = readStoredSessionSnapshot();
      if (storedSession?.identity) {
        applySessionState(storedSession);
      }

      try {
        await refreshAuthSession();
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
  }, [applySessionState, clearSessionState, refreshAuthSession]);

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
  }, [isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    const handleInvalidContext = async () => {
      try {
        await refreshAuthSession();
      } catch (error) {
        console.error("No se pudo resincronizar el contexto operativo:", error);
        clearSessionState();
      }
    };

    window.addEventListener("operational-context-invalidated", handleInvalidContext);

    return () => {
      window.removeEventListener(
        "operational-context-invalidated",
        handleInvalidContext
      );
    };
  }, [clearSessionState, refreshAuthSession]);

  useEffect(() => {
    const handleInvalidAuthSession = () => {
      clearTimeout(inactivityTimer.current);
      clearSessionState();
      setLoading(false);
      setContextBusy(false);
    };

    window.addEventListener("auth-session-invalidated", handleInvalidAuthSession);

    return () => {
      window.removeEventListener(
        "auth-session-invalidated",
        handleInvalidAuthSession
      );
    };
  }, [clearSessionState]);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response?.identity) {
        const session = applySessionState(response);
        resetInactivityTimer();
        return {
          success: true,
          session,
          contextSelectionRequired:
            response.contextSelectionRequired || !response.activeContext,
          activeContext: response.activeContext || null,
        };
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

  const activateContext = async (contextKey) => {
    setContextBusy(true);
    try {
      const response = await apiFetch("auth/context/activate", {
        method: "POST",
        body: JSON.stringify({ contextKey }),
      });
      applySessionState(response);
      return response;
    } finally {
      setContextBusy(false);
    }
  };

  const changeContext = async (contextKey) => {
    setContextBusy(true);
    try {
      const response = await apiFetch("auth/context/change", {
        method: "POST",
        body: JSON.stringify({ contextKey }),
      });
      applySessionState(response);
      window.dispatchEvent(
        new CustomEvent("operational-context-changed", {
          detail: { contextKey },
        })
      );
      return response;
    } finally {
      setContextBusy(false);
    }
  };

  const clearActiveContextSelection = async () => {
    setContextBusy(true);
    try {
      const response = await apiFetch("auth/context/active", {
        method: "DELETE",
      });
      applySessionState(response);
      return response;
    } finally {
      setContextBusy(false);
    }
  };

  const completeInitialSetup = () => {
    setNeedsInitialSetup(false);
  };

  const contextSelectionRequired = useMemo(
    () => isAuthenticated && !activeContext,
    [activeContext, isAuthenticated]
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        identity,
        user,
        activeContext,
        availableContexts,
        loading,
        contextBusy,
        contextSelectionRequired,
        login,
        logout,
        activateContext,
        changeContext,
        clearActiveContextSelection,
        refreshAuthSession,
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
