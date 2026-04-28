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
import { useLocation } from "react-router-dom";
import apiFetch from "../api/apiFetch";
import { AUTH_SESSION_INVALIDATION_CODES } from "../constants/authErrorCodes";
import { getActiveRoles, normalizeSessionUser } from "../utils/userRoles";

const AuthContext = createContext();
const SESSION_STORAGE_KEY = "auth-session-v2";
const SESSION_SYNC_STORAGE_KEY = "auth-session-sync-v1";
const SESSION_SYNC_CHANNEL_NAME = "auth-session-sync-v1";
const MAX_PROCESSED_SYNC_MESSAGE_IDS = 50;
const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_WARNING_LEAD_MS = 2 * 60 * 1000;
const SESSION_SYNC_TRANSPORT_BROADCAST_CHANNEL = "broadcast_channel";
const SESSION_SYNC_TRANSPORT_STORAGE = "storage";
const AUTH_OPTIONAL_PATHS = new Set([
  "/",
  "/login",
  "/solicitar-restablecimiento",
  "/reset-password",
]);

const isAuthOptionalPath = (pathname = "") => AUTH_OPTIONAL_PATHS.has(pathname);

const buildDefaultSessionTiming = () => ({
  idleTimeoutMs: DEFAULT_IDLE_TIMEOUT_MS,
  warningLeadMs: DEFAULT_WARNING_LEAD_MS,
  lastActivityAt: null,
  absoluteExpiresAt: null,
});

const getSessionStorage = () =>
  typeof window !== "undefined" ? window.sessionStorage : null;

const getLocalStorage = () =>
  typeof window !== "undefined" ? window.localStorage : null;

const createSessionSyncSourceId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `auth-tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const normalizeInteractiveTimestamp = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

const resolveLatestInteractiveAt = (...values) => {
  const candidates = values
    .map((value) => normalizeInteractiveTimestamp(value))
    .filter((value) => value !== null);

  if (!candidates.length) {
    return null;
  }

  return Math.max(...candidates);
};

const buildSessionSyncMessageId = ({
  sourceId,
  emittedAt,
  type,
  occurredAt = null,
}) =>
  `${String(sourceId || "unknown")}::${String(emittedAt || "0")}::${String(type || "unknown")}::${String(
    normalizeInteractiveTimestamp(occurredAt) ?? "na",
  )}`;

const createSessionSyncMessage = ({
  sourceId,
  type,
  occurredAt = null,
  emittedAt = Date.now(),
}) => ({
  messageId: buildSessionSyncMessageId({
    sourceId,
    emittedAt,
    type,
    occurredAt,
  }),
  sourceId,
  type,
  emittedAt,
  occurredAt: normalizeInteractiveTimestamp(occurredAt),
});

const buildSessionUxTimerPlan = ({
  isAuthenticated,
  sessionTiming,
  lastInteractiveAt,
  now = Date.now(),
}) => {
  if (!isAuthenticated) {
    return null;
  }

  const idleTimeoutMs =
    sessionTiming?.idleTimeoutMs || DEFAULT_IDLE_TIMEOUT_MS;
  const warningLeadMs = Math.min(
    sessionTiming?.warningLeadMs || DEFAULT_WARNING_LEAD_MS,
    Math.max(60 * 1000, idleTimeoutMs - 60 * 1000),
  );
  const baselineActivityAt = Number.isFinite(lastInteractiveAt)
    ? lastInteractiveAt
    : sessionTiming?.lastActivityAt
      ? new Date(sessionTiming.lastActivityAt).getTime()
      : now;
  const absoluteExpiresAt = sessionTiming?.absoluteExpiresAt
    ? new Date(sessionTiming.absoluteExpiresAt).getTime()
    : null;
  const idleExpiresAt = baselineActivityAt + idleTimeoutMs;
  const effectiveExpiresAt = Number.isFinite(absoluteExpiresAt)
    ? Math.min(idleExpiresAt, absoluteExpiresAt)
    : idleExpiresAt;
  const warningAt = Math.min(
    idleExpiresAt - warningLeadMs,
    Number.isFinite(absoluteExpiresAt)
      ? absoluteExpiresAt - warningLeadMs
      : Number.POSITIVE_INFINITY,
  );

  return {
    idleTimeoutMs,
    warningLeadMs,
    baselineActivityAt,
    absoluteExpiresAt: Number.isFinite(absoluteExpiresAt)
      ? new Date(absoluteExpiresAt).toISOString()
      : null,
    effectiveExpiresAt: new Date(effectiveExpiresAt).toISOString(),
    expirationSource:
      Number.isFinite(absoluteExpiresAt) && effectiveExpiresAt === absoluteExpiresAt
        ? "absolute"
        : "idle",
    warningTime: Math.max(
      warningAt - now,
      0,
    ),
    expiredTime: Math.max(effectiveExpiresAt - now, 0),
  };
};

const resolveAuthSessionErrorDisposition = (error) => {
  const code = String(
    error?.code || error?.response?.data?.code || error?.response?.data?.error?.code || "",
  )
    .trim()
    .toUpperCase();
  const status = Number(error?.response?.status);

  if (AUTH_SESSION_INVALIDATION_CODES.includes(code)) {
    return "invalidated";
  }

  if (status === 401) {
    return "invalidated";
  }

  return "transient";
};

const resolveLogoutFailureDisposition = (error) => {
  const authDisposition = resolveAuthSessionErrorDisposition(error);

  if (authDisposition === "invalidated") {
    return {
      success: true,
      shouldInvalidateLocally: true,
      toastLevel: "info",
      message:
        "La sesion ya no estaba activa. Se sincronizo el estado local.",
    };
  }

  return {
    success: false,
    shouldInvalidateLocally: false,
    toastLevel: "error",
    message:
      "No se pudo confirmar el cierre de sesion. Tu sesion sigue activa.",
  };
};

const buildClearActiveContextRequestOptions = () => ({
  method: "DELETE",
  sessionActivity: "interactive",
});

const normalizeSessionTiming = (timing) => {
  const idleTimeoutMs = Number.isFinite(Number(timing?.idleTimeoutMs))
    ? Math.max(Number(timing.idleTimeoutMs), 60 * 1000)
    : DEFAULT_IDLE_TIMEOUT_MS;
  const defaultWarningLeadMs = Math.min(
    DEFAULT_WARNING_LEAD_MS,
    Math.max(60 * 1000, Math.floor(idleTimeoutMs / 6)),
  );
  const warningLeadCandidate = Number(timing?.warningLeadMs);
  const warningLeadMs = Number.isFinite(warningLeadCandidate)
    ? Math.min(
        Math.max(warningLeadCandidate, 60 * 1000),
        Math.max(60 * 1000, idleTimeoutMs - 60 * 1000),
      )
    : defaultWarningLeadMs;

  return {
    idleTimeoutMs,
    warningLeadMs,
    lastActivityAt: normalizeTimestamp(timing?.lastActivityAt),
    absoluteExpiresAt: normalizeTimestamp(timing?.absoluteExpiresAt),
  };
};

const normalizeActiveContext = (context) => {
  if (!context || typeof context !== "object") {
    return null;
  }

  return {
    ...context,
    role: context.role || context.rolOperativo || null,
    rolOperativo: context.rolOperativo || context.role || null,
    esAreaLogistica:
      context.area?.esAreaLogistica ?? context.esAreaLogistica ?? null,
    esAreaAlmacen:
      context.area?.esAreaAlmacen ?? context.esAreaAlmacen ?? null,
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
            esAreaLogistica:
              context.area?.esAreaLogistica ??
              context.esAreaLogistica ??
              null,
            esAreaAlmacen:
              context.area?.esAreaAlmacen ?? context.esAreaAlmacen ?? null,
          }
        : null,
  };
};

const normalizeAvailableContexts = (contexts) =>
  Array.isArray(contexts)
    ? contexts.map((context) => normalizeActiveContext(context)).filter(Boolean)
    : [];

const sanitizeStoredArea = (area) => {
  const normalizedArea = area && typeof area === "object" ? area : null;

  if (!normalizedArea) {
    return null;
  }

  return {
    id: Number(normalizedArea.id || 0) || null,
    nombre: normalizedArea.nombre || null,
    abreviatura: normalizedArea.abreviatura || null,
    codigo: normalizedArea.codigo || null,
    branchDescription: normalizedArea.branchDescription || null,
    tipoUnidad: normalizedArea.tipoUnidad || null,
    esAreaLogistica: normalizedArea.esAreaLogistica ?? null,
    esAreaAlmacen: normalizedArea.esAreaAlmacen ?? null,
  };
};

const sanitizeStoredIdentity = (identity) => {
  const normalizedIdentity = normalizeSessionUser(identity);

  if (!normalizedIdentity) {
    return null;
  }

  return {
    id: Number(normalizedIdentity.id || 0) || null,
    nombre: normalizedIdentity.nombre || null,
    email: normalizedIdentity.email || null,
    cargo: normalizedIdentity.cargo || null,
    codigoUsuario: normalizedIdentity.codigoUsuario || null,
    activo: normalizedIdentity.activo !== false,
  };
};

const sanitizeStoredContext = (context) => {
  const normalizedContext = normalizeActiveContext(context);

  if (!normalizedContext) {
    return null;
  }

  return {
    contextKey: normalizedContext.contextKey || null,
    displayName: normalizedContext.displayName || null,
    role: normalizedContext.role || null,
    rolOperativo: normalizedContext.rolOperativo || normalizedContext.role || null,
    areaId: normalizedContext.areaId || null,
    areaNombre: normalizedContext.areaNombre || null,
    branchDescription: normalizedContext.branchDescription || null,
    esAreaLogistica:
      normalizedContext.area?.esAreaLogistica ??
      normalizedContext.esAreaLogistica ??
      null,
    esAreaAlmacen:
      normalizedContext.area?.esAreaAlmacen ??
      normalizedContext.esAreaAlmacen ??
      null,
    area: sanitizeStoredArea(normalizedContext.area),
  };
};

const buildStoredSessionSnapshot = ({
  identity,
  availableContexts,
  activeContext,
  sessionTiming,
  lastInteractiveAt = null,
}) => ({
  identity: sanitizeStoredIdentity(identity),
  availableContexts: normalizeAvailableContexts(availableContexts)
    .map((context) => sanitizeStoredContext(context))
    .filter(Boolean),
  activeContext: sanitizeStoredContext(activeContext),
  sessionTiming: normalizeSessionTiming(sessionTiming),
  lastInteractiveAt: normalizeInteractiveTimestamp(lastInteractiveAt),
});

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
    identityRoles: getActiveRoles(normalizedIdentity),
    userRangos: normalizedIdentity.userRangos,
    asignacionesOperativas: normalizedIdentity.asignacionesOperativas,
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
      normalizedContext.area?.abreviatura ||
      normalizedIdentity.areaAbreviatura ||
      null,
    areaCodigo:
      normalizedContext.area?.codigo || normalizedIdentity.areaCodigo || null,
    esAreaLogistica:
      normalizedContext.area?.esAreaLogistica ??
      normalizedContext.esAreaLogistica ??
      null,
    esAreaAlmacen:
      normalizedContext.area?.esAreaAlmacen ??
      normalizedContext.esAreaAlmacen ??
      null,
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
            esAreaLogistica:
              normalizedContext.area?.esAreaLogistica ??
              normalizedContext.esAreaLogistica ??
              null,
            esAreaAlmacen:
              normalizedContext.area?.esAreaAlmacen ??
              normalizedContext.esAreaAlmacen ??
              null,
          }
        : normalizedIdentity.area),
    activeContext: normalizedContext,
  };
};

const getSessionSyncTransportMode = (channel) =>
  channel && typeof channel.postMessage === "function"
    ? SESSION_SYNC_TRANSPORT_BROADCAST_CHANNEL
    : SESSION_SYNC_TRANSPORT_STORAGE;

const publishSessionSyncMessage = ({ payload, channel, storage }) => {
  const transportMode = getSessionSyncTransportMode(channel);

  if (transportMode === SESSION_SYNC_TRANSPORT_BROADCAST_CHANNEL) {
    channel.postMessage(payload);
    return transportMode;
  }

  if (!storage || typeof storage.setItem !== "function") {
    return null;
  }

  storage.setItem(SESSION_SYNC_STORAGE_KEY, JSON.stringify(payload));

  if (typeof storage.removeItem === "function") {
    storage.removeItem(SESSION_SYNC_STORAGE_KEY);
  }

  return transportMode;
};

const persistSessionSnapshot = ({
  identity,
  availableContexts,
  activeContext,
  sessionTiming,
  lastInteractiveAt = null,
}) => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const payload = buildStoredSessionSnapshot({
    identity,
    availableContexts,
    activeContext,
    sessionTiming,
    lastInteractiveAt,
  });

  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
};

const readStoredSessionSnapshot = () => {
  const storage = getSessionStorage();
  if (!storage) return null;

  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const applyActivityToSessionSnapshot = (snapshot, occurredAt) => {
  if (!snapshot?.identity) {
    return snapshot || null;
  }

  const normalizedSessionTiming = normalizeSessionTiming(snapshot.sessionTiming);
  const nextLastInteractiveAt =
    resolveLatestInteractiveAt(
      occurredAt,
      snapshot.lastInteractiveAt,
      normalizedSessionTiming.lastActivityAt
        ? new Date(normalizedSessionTiming.lastActivityAt).getTime()
        : null,
    ) || Date.now();

  return buildStoredSessionSnapshot({
    identity: snapshot.identity,
    availableContexts: snapshot.availableContexts,
    activeContext: snapshot.activeContext,
    sessionTiming: {
      ...normalizedSessionTiming,
      lastActivityAt: new Date(nextLastInteractiveAt).toISOString(),
    },
    lastInteractiveAt: nextLastInteractiveAt,
  });
};

const applySessionSyncMessageToSnapshot = (snapshot, payload) => {
  if (!payload || typeof payload !== "object") {
    return snapshot || null;
  }

  if (payload.type === "invalidated") {
    return null;
  }

  if (payload.type === "activity") {
    return applyActivityToSessionSnapshot(snapshot, payload.occurredAt);
  }

  return snapshot || null;
};

const shouldProcessSessionSyncMessage = ({
  payload,
  currentSourceId,
  processedMessageIds,
}) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (payload.sourceId === currentSourceId) {
    return false;
  }

  const messageId =
    payload.messageId ||
    buildSessionSyncMessageId({
      sourceId: payload.sourceId,
      emittedAt: payload.emittedAt,
      type: payload.type,
      occurredAt: payload.occurredAt,
    });

  if (processedMessageIds?.has(messageId)) {
    return false;
  }

  if (processedMessageIds) {
    processedMessageIds.add(messageId);
    while (processedMessageIds.size > MAX_PROCESSED_SYNC_MESSAGE_IDS) {
      const oldestMessageId = processedMessageIds.values().next().value;
      processedMessageIds.delete(oldestMessageId);
    }
  }

  return true;
};

const routeSessionSyncMessage = ({
  payload,
  currentSourceId,
  processedMessageIds,
  onActivity,
  onInvalidated,
}) => {
  if (
    !shouldProcessSessionSyncMessage({
      payload,
      currentSourceId,
      processedMessageIds,
    })
  ) {
    return false;
  }

  if (payload.type === "activity") {
    onActivity?.(payload.occurredAt);
    return true;
  }

  if (payload.type === "invalidated") {
    onInvalidated?.();
    return true;
  }

  return false;
};

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [user, setUser] = useState(null);
  const [activeContext, setActiveContext] = useState(null);
  const [availableContexts, setAvailableContexts] = useState([]);
  const [sessionTiming, setSessionTiming] = useState(buildDefaultSessionTiming);
  const [lastInteractiveAt, setLastInteractiveAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextBusy, setContextBusy] = useState(false);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const lastInteractiveAtRef = useRef(null);
  const hasSessionStateRef = useRef(false);
  const syncSourceIdRef = useRef(createSessionSyncSourceId());
  const processedSyncMessageIdsRef = useRef(new Set());
  const syncChannelRef = useRef(null);

  const clearSessionState = useCallback(() => {
    const storage = getSessionStorage();
    storage?.removeItem(SESSION_STORAGE_KEY);
    lastInteractiveAtRef.current = null;
    hasSessionStateRef.current = false;
    setIsAuthenticated(false);
    setIdentity(null);
    setUser(null);
    setActiveContext(null);
    setAvailableContexts([]);
    setSessionTiming(buildDefaultSessionTiming());
    setLastInteractiveAt(null);
  }, []);

  const broadcastSessionSyncMessage = useCallback((message) => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = createSessionSyncMessage({
      ...message,
      sourceId: syncSourceIdRef.current,
    });

    try {
      publishSessionSyncMessage({
        payload,
        channel: syncChannelRef.current,
        storage: getLocalStorage(),
      });
    } catch {
      // noop
    }
  }, []);

  const syncInteractiveActivity = useCallback(
    (occurredAt, { broadcast = false } = {}) => {
      const normalizedOccurredAt =
        normalizeInteractiveTimestamp(occurredAt) || Date.now();
      const currentLastInteractiveAt =
        resolveLatestInteractiveAt(lastInteractiveAtRef.current) || null;

      if (
        currentLastInteractiveAt !== null &&
        normalizedOccurredAt <= currentLastInteractiveAt
      ) {
        return false;
      }

      const nextLastActivityAt = new Date(normalizedOccurredAt).toISOString();

      lastInteractiveAtRef.current = normalizedOccurredAt;
      setLastInteractiveAt(normalizedOccurredAt);
      setSessionTiming((previous) => ({
        ...previous,
        lastActivityAt: nextLastActivityAt,
      }));

      const storedSession = readStoredSessionSnapshot();
      const updatedStoredSession = applyActivityToSessionSnapshot(
        storedSession,
        normalizedOccurredAt,
      );
      if (updatedStoredSession?.identity) {
        persistSessionSnapshot(updatedStoredSession);
      }

      if (broadcast) {
        broadcastSessionSyncMessage({
          type: "activity",
          occurredAt: normalizedOccurredAt,
        });
      }

      return true;
    },
    [broadcastSessionSyncMessage],
  );

  const handleAuthSessionInvalidation = useCallback(
    ({ broadcast = false } = {}) => {
      if (!hasSessionStateRef.current) {
        setLoading(false);
        setContextBusy(false);
        return false;
      }

      clearSessionState();
      setLoading(false);
      setContextBusy(false);

      if (broadcast) {
        broadcastSessionSyncMessage({
          type: "invalidated",
        });
      }

      return true;
    },
    [broadcastSessionSyncMessage, clearSessionState],
  );

  const applySessionState = useCallback(
    (sessionPayload) => {
      const normalizedIdentity = normalizeSessionUser(
        sessionPayload?.identity || sessionPayload?.usuario || null,
      );
      const normalizedContexts = normalizeAvailableContexts(
        sessionPayload?.availableContexts,
      );
      const normalizedActiveContext = normalizeActiveContext(
        sessionPayload?.activeContext,
      );
      const normalizedSessionTiming = normalizeSessionTiming(
        sessionPayload?.sessionTiming,
      );
      const storedSession = readStoredSessionSnapshot();
      const isSameStoredIdentity =
        normalizedIdentity?.id &&
        storedSession?.identity?.id &&
        Number(normalizedIdentity.id) === Number(storedSession.identity.id);
      const nextLastInteractiveAt = resolveLatestInteractiveAt(
        sessionPayload?.lastInteractiveAt,
        normalizedSessionTiming.lastActivityAt
          ? new Date(normalizedSessionTiming.lastActivityAt).getTime()
          : null,
        isSameStoredIdentity ? storedSession?.lastInteractiveAt : null,
        lastInteractiveAtRef.current,
      );
      const effectiveSessionTiming = {
        ...normalizedSessionTiming,
        lastActivityAt: nextLastInteractiveAt
          ? new Date(nextLastInteractiveAt).toISOString()
          : normalizedSessionTiming.lastActivityAt,
      };
      const operationalUser = buildOperationalUser(
        normalizedIdentity,
        normalizedActiveContext,
      );

      if (!normalizedIdentity) {
        clearSessionState();
        return null;
      }

      lastInteractiveAtRef.current = nextLastInteractiveAt;
      hasSessionStateRef.current = true;

      persistSessionSnapshot({
        identity: normalizedIdentity,
        availableContexts: normalizedContexts,
        activeContext: normalizedActiveContext,
        sessionTiming: effectiveSessionTiming,
        lastInteractiveAt: nextLastInteractiveAt,
      });

      setIsAuthenticated(true);
      setIdentity(normalizedIdentity);
      setAvailableContexts(normalizedContexts);
      setActiveContext(normalizedActiveContext);
      setSessionTiming(effectiveSessionTiming);
      setLastInteractiveAt(nextLastInteractiveAt);
      setUser(operationalUser);

      return {
        identity: normalizedIdentity,
        availableContexts: normalizedContexts,
        activeContext: normalizedActiveContext,
        user: operationalUser,
        sessionTiming: effectiveSessionTiming,
      };
    },
    [clearSessionState],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("auth/logout", { method: "POST" });
      handleAuthSessionInvalidation({ broadcast: true });
      return { success: true };
    } catch (error) {
      const logoutFailure = resolveLogoutFailureDisposition(error);

      if (logoutFailure.shouldInvalidateLocally) {
        handleAuthSessionInvalidation({ broadcast: true });
      } else {
        console.error("Error al cerrar sesion en el backend:", error);
      }

      toast[logoutFailure.toastLevel](logoutFailure.message, {
        autoClose: 8000,
      });

      return {
        success: logoutFailure.success,
        error,
      };
    }
  }, [handleAuthSessionInvalidation]);

  const refreshAuthSession = useCallback(async () => {
    try {
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

      handleAuthSessionInvalidation({ broadcast: true });
      return null;
    } catch (error) {
      if (resolveAuthSessionErrorDisposition(error) === "invalidated") {
        handleAuthSessionInvalidation({ broadcast: true });
      }

      throw error;
    }
  }, [applySessionState, handleAuthSessionInvalidation]);

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
          error,
        );
      }

      const storedSession = readStoredSessionSnapshot();
      if (storedSession?.identity) {
        applySessionState(storedSession);
      }

       const shouldValidateSession =
        Boolean(storedSession?.identity) ||
        !isAuthOptionalPath(location.pathname);

      if (!shouldValidateSession) {
        setLoading(false);
        return;
      }

      try {
        await refreshAuthSession();
      } catch (error) {
        if (resolveAuthSessionErrorDisposition(error) !== "invalidated") {
          console.error("Error al validar el token:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAppStatus();
  }, [applySessionState, clearSessionState, location.pathname, refreshAuthSession]);

  useEffect(() => {
    const handleInvalidContext = async () => {
      try {
        await refreshAuthSession();
      } catch (error) {
        if (resolveAuthSessionErrorDisposition(error) !== "invalidated") {
          console.error(
            "No se pudo resincronizar el contexto operativo:",
            error,
          );
        }
      }
    };

    window.addEventListener(
      "operational-context-invalidated",
      handleInvalidContext,
    );

    return () => {
      window.removeEventListener(
        "operational-context-invalidated",
        handleInvalidContext,
      );
    };
  }, [refreshAuthSession]);

  useEffect(() => {
    const handleInvalidAuthSession = () => {
      handleAuthSessionInvalidation({ broadcast: true });
    };

    window.addEventListener(
      "auth-session-invalidated",
      handleInvalidAuthSession,
    );

    return () => {
      window.removeEventListener(
        "auth-session-invalidated",
        handleInvalidAuthSession,
      );
    };
  }, [handleAuthSessionInvalidation]);

  useEffect(() => {
    const handleAuthSessionActivity = (event) => {
      const occurredAt =
        Number(event?.detail?.occurredAt) > 0
          ? Number(event.detail.occurredAt)
          : Date.now();

      syncInteractiveActivity(occurredAt, { broadcast: true });
    };

    window.addEventListener("auth-session-activity", handleAuthSessionActivity);

    return () => {
      window.removeEventListener(
        "auth-session-activity",
        handleAuthSessionActivity,
      );
    };
  }, [syncInteractiveActivity]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSyncPayload = (payload) => {
      routeSessionSyncMessage({
        payload,
        currentSourceId: syncSourceIdRef.current,
        processedMessageIds: processedSyncMessageIdsRef.current,
        onActivity: (occurredAt) =>
          syncInteractiveActivity(occurredAt, { broadcast: false }),
        onInvalidated: () =>
          handleAuthSessionInvalidation({ broadcast: false }),
      });
    };

    const handleStorage = (event) => {
      if (event.key !== SESSION_SYNC_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        handleSyncPayload(JSON.parse(event.newValue));
      } catch {
        // noop
      }
    };

    let onBroadcastMessage = null;
    let shouldListenStorage = true;

    if (typeof window.BroadcastChannel === "function") {
      try {
        const channel = new window.BroadcastChannel(SESSION_SYNC_CHANNEL_NAME);
        onBroadcastMessage = (event) => handleSyncPayload(event?.data);

        if (typeof channel.addEventListener === "function") {
          channel.addEventListener("message", onBroadcastMessage);
        } else {
          channel.onmessage = onBroadcastMessage;
        }

        syncChannelRef.current = channel;
        shouldListenStorage = false;
      } catch {
        syncChannelRef.current = null;
      }
    }

    if (shouldListenStorage) {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      if (shouldListenStorage) {
        window.removeEventListener("storage", handleStorage);
      }

      if (syncChannelRef.current) {
        if (
          onBroadcastMessage &&
          typeof syncChannelRef.current.removeEventListener === "function"
        ) {
          syncChannelRef.current.removeEventListener(
            "message",
            onBroadcastMessage,
          );
        }

        syncChannelRef.current.close?.();
        syncChannelRef.current = null;
      }
    };
  }, [handleAuthSessionInvalidation, syncInteractiveActivity]);

  // UX Timer: Supportive warning only; backend is authoritative for idle expiry.
  useEffect(() => {
    const timerPlan = buildSessionUxTimerPlan({
      isAuthenticated,
      sessionTiming,
      lastInteractiveAt,
    });
    if (!timerPlan) return undefined;

    const warningTimer = setTimeout(() => {
      toast.warn(
        "Tu sesion expirara pronto. Guarda o completa lo necesario para continuar.",
        {
          autoClose: 10000,
        },
      );
    }, timerPlan.warningTime);

    const expiredTimer = setTimeout(() => {
      toast.info(
        "Tu sesion puede haber expirado. Vuelve a iniciar sesion si es necesario.",
        {
          autoClose: 10000,
        },
      );
    }, timerPlan.expiredTime);

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(expiredTimer);
    };
  }, [isAuthenticated, lastInteractiveAt, sessionTiming]);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response?.identity) {
        const session = applySessionState(response);
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
        sessionActivity: "interactive",
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
        sessionActivity: "interactive",
      });
      applySessionState(response);
      window.dispatchEvent(
        new CustomEvent("operational-context-changed", {
          detail: { contextKey },
        }),
      );
      return response;
    } finally {
      setContextBusy(false);
    }
  };

  const clearActiveContextSelection = async () => {
    setContextBusy(true);
    try {
      const response = await apiFetch(
        "auth/context/active",
        buildClearActiveContextRequestOptions(),
      );
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
    [activeContext, isAuthenticated],
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
        sessionTiming,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const __authContextTestUtils = {
  applyActivityToSessionSnapshot,
  applySessionSyncMessageToSnapshot,
  buildClearActiveContextRequestOptions,
  buildStoredSessionSnapshot,
  buildSessionUxTimerPlan,
  buildSessionSyncMessageId,
  createSessionSyncMessage,
  getSessionSyncTransportMode,
  normalizeSessionTiming,
  publishSessionSyncMessage,
  resolveAuthSessionErrorDisposition,
  resolveLogoutFailureDisposition,
  routeSessionSyncMessage,
  resolveLatestInteractiveAt,
  shouldProcessSessionSyncMessage,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
