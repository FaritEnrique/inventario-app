//src/api/apiFetch.js
const baseURL =
  import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "";

const apiFetch = async (endpoint, options = {}) => {
  try {
    const token = sessionStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseURL}/${endpoint}`, {
      headers,
      ...options,
    });

    if (!res.ok && res.status !== 404) {
      const error = await res.json();
      // Incluir los errores de validación si existen
      const errorMessage = error.mensaje || error.message || "Error al conectar con el servidor";
      const validationErrors = error.errores || [];
      const fullError = new Error(errorMessage);
      fullError.validationErrors = validationErrors; // Adjuntar los errores de validación
      throw fullError;
    }

    if (res.status === 204) return null;
    if (res.status === 404) {
      return { ok: false, status: 404 };
    }

    return await res.json();
  } catch (error) {
    console.error("❌ Error en apiFetch:", error.message);
    throw error;
  }
};

export default apiFetch;
