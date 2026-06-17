export const PAGE_SIZE = 10;

export const numberFormatter = new Intl.NumberFormat("es-PE");

export const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

export const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? numberFormatter.format(number) : "0";
};

export const formatDate = (value) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? dateFormatter.format(timestamp) : "-";
};

export const formatDateTime = (value) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? dateTimeFormatter.format(timestamp) : "-";
};

export const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const normalizePagedResponse = (payload) => {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      totalItems: payload.length,
      totalPages: 1,
      currentPage: 1,
    };
  }

  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    totalItems: Number(payload?.totalItems ?? payload?.total ?? 0),
    totalPages: Number(payload?.totalPages ?? 1),
    currentPage: Number(payload?.currentPage ?? payload?.page ?? 1),
  };
};

export const paginateRows = (rows, currentPage, pageSize = PAGE_SIZE) => {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    totalPages,
    currentPage: safePage,
  };
};

export const getProductoLabel = (producto) =>
  [producto?.codigo, producto?.nombre].filter(Boolean).join(" · ") ||
  "Producto sin nombre";

export const getProveedorLabel = (proveedor) =>
  [proveedor?.ruc, proveedor?.razonSocial || proveedor?.nombre]
    .filter(Boolean)
    .join(" · ") || "Proveedor no registrado";

export const getAreaLabel = (area) =>
  [area?.abreviatura, area?.nombre].filter(Boolean).join(" · ") || "-";

export const buildSearchParams = (values = {}) => {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
};
