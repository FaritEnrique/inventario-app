import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let applyActivityToSessionSnapshot;
let applySessionSyncMessageToSnapshot;
let buildClearActiveContextRequestOptions;
let buildStoredSessionSnapshot;
let buildSessionUxTimerPlan;
let createSessionSyncMessage;
let getSessionSyncTransportMode;
let normalizeSessionTiming;
let publishSessionSyncMessage;
let resolveAuthSessionErrorDisposition;
let resolveLogoutFailureDisposition;
let routeSessionSyncMessage;
let resolveLatestInteractiveAt;
let shouldProcessSessionSyncMessage;

beforeAll(async () => {
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  const { __authContextTestUtils } = await import("./authContext");

  applyActivityToSessionSnapshot =
    __authContextTestUtils.applyActivityToSessionSnapshot;
  applySessionSyncMessageToSnapshot =
    __authContextTestUtils.applySessionSyncMessageToSnapshot;
  buildClearActiveContextRequestOptions =
    __authContextTestUtils.buildClearActiveContextRequestOptions;
  buildStoredSessionSnapshot =
    __authContextTestUtils.buildStoredSessionSnapshot;
  buildSessionUxTimerPlan = __authContextTestUtils.buildSessionUxTimerPlan;
  createSessionSyncMessage = __authContextTestUtils.createSessionSyncMessage;
  getSessionSyncTransportMode =
    __authContextTestUtils.getSessionSyncTransportMode;
  normalizeSessionTiming = __authContextTestUtils.normalizeSessionTiming;
  publishSessionSyncMessage = __authContextTestUtils.publishSessionSyncMessage;
  resolveAuthSessionErrorDisposition =
    __authContextTestUtils.resolveAuthSessionErrorDisposition;
  resolveLogoutFailureDisposition =
    __authContextTestUtils.resolveLogoutFailureDisposition;
  routeSessionSyncMessage = __authContextTestUtils.routeSessionSyncMessage;
  resolveLatestInteractiveAt = __authContextTestUtils.resolveLatestInteractiveAt;
  shouldProcessSessionSyncMessage =
    __authContextTestUtils.shouldProcessSessionSyncMessage;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const buildSnapshot = ({
  idleTimeoutMs = 3 * 60 * 1000,
  warningLeadMs = 60 * 1000,
  lastActivityAt = new Date(0).toISOString(),
  lastInteractiveAt = null,
} = {}) => ({
  identity: {
    id: 1,
    nombre: "Usuario Demo",
    email: "demo@example.com",
    cargo: "Analista",
    activo: true,
    passwordHash: "secreto",
    userRangos: [{ rol: "JEFE_AREA" }],
  },
  activeContext: {
    contextKey: "ctx-1",
    displayName: "Operador - Logistica",
    role: "OPERADOR",
    areaId: 8,
    areaNombre: "Logistica",
    area: {
      id: 8,
      nombre: "Logistica",
      branchDescription: "Sede central",
      esAreaLogistica: true,
      esAreaAlmacen: false,
    },
  },
  availableContexts: [
    {
      contextKey: "ctx-1",
      displayName: "Operador - Logistica",
      role: "OPERADOR",
      areaId: 8,
      areaNombre: "Logistica",
      area: {
        id: 8,
        nombre: "Logistica",
        branchDescription: "Sede central",
        esAreaLogistica: true,
        esAreaAlmacen: false,
      },
    },
  ],
  sessionTiming: {
    idleTimeoutMs,
    warningLeadMs,
    lastActivityAt,
    absoluteExpiresAt: new Date(idleTimeoutMs * 2).toISOString(),
  },
  lastInteractiveAt,
});

describe("authContext inactivity UX helpers", () => {
  it("usa sessionTiming del backend para calcular warning y expiry, no hardcodes fijos", () => {
    const sessionTiming = normalizeSessionTiming({
      idleTimeoutMs: 3 * 60 * 1000,
      warningLeadMs: 60 * 1000,
      lastActivityAt: new Date(0).toISOString(),
    });

    const timerPlan = buildSessionUxTimerPlan({
      isAuthenticated: true,
      sessionTiming,
      lastInteractiveAt: null,
      now: 0,
    });

    expect(timerPlan.warningTime).toBe(2 * 60 * 1000);
    expect(timerPlan.expiredTime).toBe(3 * 60 * 1000);
  });

  it("acorta warning y expiry cuando absoluteExpiresAt vence antes que el idle timeout", () => {
    const sessionTiming = normalizeSessionTiming({
      idleTimeoutMs: 10 * 60 * 1000,
      warningLeadMs: 2 * 60 * 1000,
      lastActivityAt: new Date(0).toISOString(),
      absoluteExpiresAt: new Date(5 * 60 * 1000).toISOString(),
    });

    const timerPlan = buildSessionUxTimerPlan({
      isAuthenticated: true,
      sessionTiming,
      lastInteractiveAt: null,
      now: 0,
    });

    expect(timerPlan.expirationSource).toBe("absolute");
    expect(timerPlan.warningTime).toBe(3 * 60 * 1000);
    expect(timerPlan.expiredTime).toBe(5 * 60 * 1000);
  });

  it("reprograma el reloj UX cuando entra actividad interactiva mas reciente", () => {
    const snapshot = buildSnapshot({
      idleTimeoutMs: 2 * 60 * 1000,
      warningLeadMs: 60 * 1000,
      lastActivityAt: new Date(0).toISOString(),
    });

    const updatedSnapshot = applyActivityToSessionSnapshot(
      snapshot,
      30 * 1000,
    );

    const timerPlan = buildSessionUxTimerPlan({
      isAuthenticated: true,
      sessionTiming: updatedSnapshot.sessionTiming,
      lastInteractiveAt: updatedSnapshot.lastInteractiveAt,
      now: 59 * 1000,
    });

    expect(updatedSnapshot.lastInteractiveAt).toBe(30 * 1000);
    expect(updatedSnapshot.sessionTiming.lastActivityAt).toBe(
      new Date(30 * 1000).toISOString(),
    );
    expect(timerPlan.warningTime).toBe(31 * 1000);
  });

  it("la invalidacion limpia el snapshot sincronizado entre pestanas", () => {
    const snapshot = buildSnapshot();

    const clearedSnapshot = applySessionSyncMessageToSnapshot(snapshot, {
      type: "invalidated",
      sourceId: "other-tab",
    });

    expect(clearedSnapshot).toBe(null);
  });

  it("la sincronizacion entre pestanas actualiza el reloj UX con actividad remota", () => {
    const snapshot = buildSnapshot({
      idleTimeoutMs: 2 * 60 * 1000,
      warningLeadMs: 60 * 1000,
      lastActivityAt: new Date(0).toISOString(),
    });

    const syncedSnapshot = applySessionSyncMessageToSnapshot(snapshot, {
      type: "activity",
      occurredAt: 45 * 1000,
      sourceId: "other-tab",
    });

    const timerPlan = buildSessionUxTimerPlan({
      isAuthenticated: true,
      sessionTiming: syncedSnapshot.sessionTiming,
      lastInteractiveAt: syncedSnapshot.lastInteractiveAt,
      now: 60 * 1000,
    });

    expect(syncedSnapshot.lastInteractiveAt).toBe(45 * 1000);
    expect(timerPlan.warningTime).toBe(45 * 1000);
  });

  it("ignora actividad remota mas antigua y no retrocede el reloj UX", () => {
    const snapshot = buildSnapshot({
      idleTimeoutMs: 2 * 60 * 1000,
      warningLeadMs: 60 * 1000,
      lastActivityAt: new Date(90 * 1000).toISOString(),
      lastInteractiveAt: 90 * 1000,
    });

    const syncedSnapshot = applySessionSyncMessageToSnapshot(snapshot, {
      type: "activity",
      occurredAt: 45 * 1000,
      sourceId: "other-tab",
    });

    expect(syncedSnapshot.lastInteractiveAt).toBe(90 * 1000);
    expect(syncedSnapshot.sessionTiming.lastActivityAt).toBe(
      new Date(90 * 1000).toISOString(),
    );
  });

  it("preserva el timestamp interactivo mas reciente cuando validate-token devuelve uno mas antiguo por throttling", () => {
    const resolvedTimestamp = resolveLatestInteractiveAt(
      null,
      new Date("2026-04-18T10:00:00.000Z").toISOString(),
      1713434700000,
      1713434760000,
    );

    expect(resolvedTimestamp).toBe(1713434760000);
  });

  it("deduplica el mismo mensaje remoto cuando llega repetido", () => {
    const syncMessage = createSessionSyncMessage({
      sourceId: "other-tab",
      type: "activity",
      occurredAt: 45 * 1000,
      emittedAt: 123456,
    });
    const processedMessageIds = new Set();
    const onActivity = vi.fn();
    const onInvalidated = vi.fn();

    const firstDelivery = routeSessionSyncMessage({
      payload: syncMessage,
      currentSourceId: "current-tab",
      processedMessageIds,
      onActivity,
      onInvalidated,
    });

    const secondDelivery = routeSessionSyncMessage({
      payload: syncMessage,
      currentSourceId: "current-tab",
      processedMessageIds,
      onActivity,
      onInvalidated,
    });

    expect(firstDelivery).toBe(true);
    expect(secondDelivery).toBe(false);
    expect(onActivity).toHaveBeenCalledTimes(1);
    expect(onActivity).toHaveBeenCalledWith(45 * 1000);
    expect(onInvalidated).not.toHaveBeenCalled();
  });

  it("hace idempotente la invalidacion remota duplicada", () => {
    const syncMessage = createSessionSyncMessage({
      sourceId: "other-tab",
      type: "invalidated",
      emittedAt: 123456,
    });
    const processedMessageIds = new Set();
    const onActivity = vi.fn();
    const onInvalidated = vi.fn();

    const firstDelivery = routeSessionSyncMessage({
      payload: syncMessage,
      currentSourceId: "current-tab",
      processedMessageIds,
      onActivity,
      onInvalidated,
    });

    const secondDelivery = routeSessionSyncMessage({
      payload: syncMessage,
      currentSourceId: "current-tab",
      processedMessageIds,
      onActivity,
      onInvalidated,
    });

    expect(firstDelivery).toBe(true);
    expect(secondDelivery).toBe(false);
    expect(onInvalidated).toHaveBeenCalledTimes(1);
    expect(onActivity).not.toHaveBeenCalled();
  });

  it("ignora mensajes emitidos por la misma pestana", () => {
    const syncMessage = createSessionSyncMessage({
      sourceId: "same-tab",
      type: "invalidated",
      emittedAt: 123456,
    });

    const shouldProcess = shouldProcessSessionSyncMessage({
      payload: syncMessage,
      currentSourceId: "same-tab",
      processedMessageIds: new Set(),
    });

    expect(shouldProcess).toBe(false);
  });

  it("prefiere BroadcastChannel y no duplica escritura en storage cuando el canal existe", () => {
    const payload = createSessionSyncMessage({
      sourceId: "other-tab",
      type: "activity",
      occurredAt: 45 * 1000,
      emittedAt: 123456,
    });
    const channel = {
      postMessage: vi.fn(),
    };
    const storage = {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    const transportMode = getSessionSyncTransportMode(channel);
    const publishedTransport = publishSessionSyncMessage({
      payload,
      channel,
      storage,
    });

    expect(transportMode).toBe("broadcast_channel");
    expect(publishedTransport).toBe("broadcast_channel");
    expect(channel.postMessage).toHaveBeenCalledWith(payload);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("usa storage como fallback cuando BroadcastChannel no existe", () => {
    const payload = createSessionSyncMessage({
      sourceId: "other-tab",
      type: "activity",
      occurredAt: 45 * 1000,
      emittedAt: 123456,
    });
    const storage = {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    const transportMode = getSessionSyncTransportMode(null);
    const publishedTransport = publishSessionSyncMessage({
      payload,
      channel: null,
      storage,
    });

    expect(transportMode).toBe("storage");
    expect(publishedTransport).toBe("storage");
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).toHaveBeenCalledTimes(1);
  });

  it("reduce el snapshot persistido a los campos realmente necesarios", () => {
    const storedSnapshot = buildStoredSessionSnapshot(buildSnapshot());

    expect(storedSnapshot.identity).toEqual({
      id: 1,
      nombre: "Usuario Demo",
      email: "demo@example.com",
      cargo: "Analista",
      codigoUsuario: null,
      activo: true,
    });
    expect(storedSnapshot.identity.passwordHash).toBeUndefined();
    expect(storedSnapshot.identity.userRangos).toBeUndefined();
    expect(storedSnapshot.activeContext.area).toEqual({
      id: 8,
      nombre: "Logistica",
      abreviatura: null,
      codigo: null,
      branchDescription: "Sede central",
      tipoUnidad: null,
      esAreaLogistica: true,
      esAreaAlmacen: false,
    });
    expect(storedSnapshot.availableContexts).toHaveLength(1);
    expect(storedSnapshot.sessionTiming.idleTimeoutMs).toBe(3 * 60 * 1000);
  });
});

describe("authContext session error handling", () => {
  it("trata 429 de validate-token como error transitorio y preserva sesion local", () => {
    const disposition = resolveAuthSessionErrorDisposition({
      code: "RATE_LIMITED",
      response: { status: 429 },
    });

    expect(disposition).toBe("transient");
  });

  it("trata 500 de validate-token como error transitorio y preserva sesion local", () => {
    const disposition = resolveAuthSessionErrorDisposition({
      response: { status: 500 },
    });

    expect(disposition).toBe("transient");
  });

  it("trata errores de red de validate-token como transitorios y no invalida localmente", () => {
    const disposition = resolveAuthSessionErrorDisposition(
      new TypeError("Failed to fetch"),
    );

    expect(disposition).toBe("transient");
  });

  it("si hay invalidacion auth real, limpia la sesion local", () => {
    const disposition = resolveAuthSessionErrorDisposition({
      code: "AUTH_IDLE_TIMEOUT",
      response: { status: 401 },
    });

    expect(disposition).toBe("invalidated");
  });

  it("logout fallido por error transitorio no confirma revocacion ni limpia localmente", () => {
    const result = resolveLogoutFailureDisposition({
      code: "RATE_LIMITED",
      response: { status: 429 },
    });

    expect(result.success).toBe(false);
    expect(result.shouldInvalidateLocally).toBe(false);
    expect(result.message).toContain("No se pudo confirmar");
  });

  it("logout con sesion ya invalidada sincroniza el estado local sin fingir revocacion", () => {
    const result = resolveLogoutFailureDisposition({
      code: "AUTH_TOKEN_REVOKED",
      response: { status: 401 },
    });

    expect(result.success).toBe(true);
    expect(result.shouldInvalidateLocally).toBe(true);
    expect(result.message).toContain("ya no estaba activa");
  });

  it("clearActiveContextSelection marca actividad interactiva", () => {
    expect(buildClearActiveContextRequestOptions()).toEqual({
      method: "DELETE",
      sessionActivity: "interactive",
    });
  });
});
