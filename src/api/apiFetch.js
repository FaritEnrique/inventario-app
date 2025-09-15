//src/api/apiFetch.js
const baseURL =
  import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "";

const apiFetch = async (endpoint, options = {}) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const res = await fetch(`${baseURL}/${endpoint}`, {
      headers,
      ...options,
      credentials: "include", // Importante para enviar cookies
    });

    if (!res.ok && res.status !== 404) {
      const data = await res.json(); // Get the full data object
      const errorMessage = data.mensaje || data.message || "Error al conectar con el servidor";
      const validationErrors = data.errores || [];
      
      const fullError = new Error(errorMessage);
      fullError.response = { data, status: res.status }; // Attach the full data and status
      fullError.validationErrors = validationErrors; // Keep this for existing logic
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