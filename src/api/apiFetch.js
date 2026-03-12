//src/api/apiFetch.js
const normalizeBaseUrl = (rawUrl) => {
  const trimmedUrl = (rawUrl || "").trim().replace(/\/+$/, "");

  if (!trimmedUrl) {
    return "/api";
  }

  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

const baseURL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development" ? "http://localhost:3000" : "")
);

export const buildApiUrl = (endpoint) => {
  const normalizedEndpoint = String(endpoint || "").replace(/^\/+/, "");
  return `${baseURL}/${normalizedEndpoint}`;
};

const apiFetch = async (endpoint, options = {}) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const res = await fetch(buildApiUrl(endpoint), {
      headers,
      ...options,
      credentials: "include",
    });

    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : {
            message: `Respuesta no JSON del servidor (${res.status} ${res.statusText})`,
          };
      const errorMessage =
        data.mensaje || data.message || "Error al conectar con el servidor";
      const validationErrors = data.errores || [];

      const fullError = new Error(errorMessage);
      fullError.response = { data, status: res.status };
      fullError.validationErrors = validationErrors;
      throw fullError;
    }

    if (res.status === 204) return null;

    return await res.json();
  } catch (error) {
    console.error("Error en apiFetch:", error.message);
    throw error;
  }
};

export default apiFetch;
