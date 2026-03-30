const normalizeBaseUrl = (rawUrl) => {
  const trimmedUrl = (rawUrl || "").trim().replace(/\/+$/, "");

  if (!trimmedUrl) {
    throw new Error("VITE_API_URL no esta configurada");
  }

  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

const rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

const baseURL = normalizeBaseUrl(rawBaseUrl);

const FIELD_LABELS = {
  email: "correo electrónico",
  password: "contraseña",
  procedencia: "procedencia",
  razonSocial: "razón social",
  direccion: "dirección",
  telefono: "teléfono",
  correoElectronico: "correo electrónico",
  ruc: "RUC",
  tipoProductoIds: "tipos de producto",
  areaId: "área",
  nombre: "nombre",
  prefijo: "prefijo",
  activo: "estado activo",
};

const formatFieldLabel = (rawField) => {
  const field = String(rawField || "")
    .trim()
    .replace(/\[(\d+)\]/g, " $1")
    .replace(/\./g, " ");

  if (!field) return "valor";

  if (FIELD_LABELS[field]) {
    return FIELD_LABELS[field];
  }

  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const translateValidationMessage = (message) => {
  const rawMessage = String(message || "").trim();

  if (!rawMessage) {
    return "Ocurrió un error de validación.";
  }

  const directTranslations = {
    "Failed to fetch": "No se pudo conectar con el servidor.",
    "Network request failed": "No se pudo conectar con el servidor.",
    "Load failed": "No se pudo conectar con el servidor.",
    "Network Error": "No se pudo conectar con el servidor.",
    "NetworkError when attempting to fetch resource.":
      "No se pudo conectar con el servidor.",
    Unauthorized: "No autorizado.",
    Forbidden: "Acceso denegado.",
    "Not found": "No encontrado.",
    "Internal Server Error": "Error interno del servidor.",
  };

  if (directTranslations[rawMessage]) {
    return directTranslations[rawMessage];
  }

  let match = rawMessage.match(/^"([^"]+)" is required$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} es obligatorio.`;
  }

  match = rawMessage.match(/^"([^"]+)" is not allowed to be empty$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} no puede estar vacío.`;
  }

  match = rawMessage.match(/^"([^"]+)" is not allowed$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} no está permitido.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be a string$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser un texto.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be a number$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser un número.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be an integer$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser un número entero.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be a boolean$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser verdadero o falso.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be an array$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser una lista.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be a valid email$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser un correo electrónico válido.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be a valid date$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser una fecha válida.`;
  }

  match = rawMessage.match(
    /^"([^"]+)" length must be at least (\d+) characters long$/i
  );
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe tener al menos ${match[2]} caracteres.`;
  }

  match = rawMessage.match(
    /^"([^"]+)" length must be less than or equal to (\d+) characters long$/i
  );
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} no puede tener más de ${match[2]} caracteres.`;
  }

  match = rawMessage.match(/^"([^"]+)" must contain at least (\d+) items$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe contener al menos ${match[2]} elementos.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be greater than or equal to ([^ ]+)$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser mayor o igual a ${match[2]}.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be less than or equal to ([^ ]+)$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser menor o igual a ${match[2]}.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be positive$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser un valor positivo.`;
  }

  match = rawMessage.match(/^"([^"]+)" must be one of \[(.+)\]$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} debe ser uno de estos valores: ${match[2]}.`;
  }

  match = rawMessage.match(
    /^"([^"]+)" with value "([^"]*)" fails to match the required pattern: .*$/i
  );
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} tiene un formato inválido.`;
  }

  match = rawMessage.match(/^"([^"]+)" contains an invalid value$/i);
  if (match) {
    return `El campo ${formatFieldLabel(match[1])} contiene un valor inválido.`;
  }

  return rawMessage;
};

export const buildApiUrl = (endpoint) => {
  const normalizedEndpoint = String(endpoint || "").replace(/^\/+/, "");
  return `${baseURL}/${normalizedEndpoint}`;
};

const apiFetch = async (endpoint, options = {}) => {
  try {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(options.headers || {}),
    };

    if (!isFormData && !("Content-Type" in headers)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(buildApiUrl(endpoint), {
      headers,
      ...options,
      credentials: "include",
    });

    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("application/json")) {
        data = await res.json();
      }
      const normalizedError = data?.error || null;
      const errorMessage =
        translateValidationMessage(
          normalizedError?.message ||
            data.mensaje ||
            data.message ||
            "Error al conectar con el servidor"
        );
      const validationErrors =
        (data.errores || normalizedError?.details?.errores || []).map(
          translateValidationMessage
        );

      const fullError = new Error(errorMessage);
      fullError.response = { data, status: res.status };
      fullError.validationErrors = validationErrors;
      fullError.code = normalizedError?.code || data?.code || null;
      fullError.details = normalizedError?.details || data?.detalles || null;
      throw fullError;
    }

    if (res.status === 204) return null;

    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      error.message = translateValidationMessage(error.message);
      if (Array.isArray(error.validationErrors)) {
        error.validationErrors = error.validationErrors.map(
          translateValidationMessage
        );
      }
    }
    console.error("Error en apiFetch:", error.message);
    throw error;
  }
};

export default apiFetch;
