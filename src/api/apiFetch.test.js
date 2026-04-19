import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("apiFetch session activity UX sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("dispara actividad UX solo despues de una respuesta interactiva exitosa", async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const { default: apiFetch } = await import("./apiFetch.js");

    const payload = await apiFetch("productos", {
      sessionActivity: "interactive",
    });

    expect(payload).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers["X-Session-Activity"]).toBe(
      "interactive",
    );
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(window.dispatchEvent.mock.calls[0][0].type).toBe(
      "auth-session-activity",
    );
  });

  it("no dispara actividad UX cuando la request interactiva falla", async () => {
    fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "AUTH_TOKEN_EXPIRED",
            message: "La sesion ha expirado.",
          },
        }),
        {
          status: 401,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const { default: apiFetch } = await import("./apiFetch.js");

    await expect(
      apiFetch("auth/validate-token", {
        sessionActivity: "interactive",
      }),
    ).rejects.toMatchObject({
      code: "AUTH_TOKEN_EXPIRED",
    });

    expect(window.dispatchEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "auth-session-activity",
      }),
    );
  });

  it("mantiene sincronizado el reloj UX cuando la request interactiva falla por negocio pero la sesion sigue valida", async () => {
    fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "\"nombre\" is required",
          },
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const { default: apiFetch } = await import("./apiFetch.js");

    await expect(
      apiFetch("usuarios", {
        method: "POST",
        sessionActivity: "interactive",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "auth-session-activity",
      }),
    );
  });

  it("no dispara actividad UX en requests exitosos no interactivos", async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ valid: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const { default: apiFetch } = await import("./apiFetch.js");

    await apiFetch("auth/validate-token");

    expect(window.dispatchEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "auth-session-activity",
      }),
    );
  });

  it("mantiene auth/validate-token pasivo aunque reciba sessionActivity interactiva", async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ valid: true, identity: { id: 1 } }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const { default: apiFetch } = await import("./apiFetch.js");

    const payload = await apiFetch("auth/validate-token", {
      sessionActivity: "interactive",
    });

    expect(payload).toEqual({ valid: true, identity: { id: 1 } });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers["X-Session-Activity"]).toBeUndefined();
    expect(window.dispatchEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "auth-session-activity",
      }),
    );
  });
});
