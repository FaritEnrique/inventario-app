import apiFetch from "./apiFetch";

const basePath = (token) =>
  `public/proveedor/cotizaciones/${encodeURIComponent(token || "")}`;

const publicProveedorCotizacionesApi = {
  obtenerEstado: (token) => apiFetch(basePath(token)),
  validarClave: (token, claveTemporal) =>
    apiFetch(`${basePath(token)}/validar-clave`, {
      method: "POST",
      body: JSON.stringify({ claveTemporal }),
    }),
  registrarCotizacion: (token, payload) =>
    apiFetch(`${basePath(token)}/cotizacion`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export default publicProveedorCotizacionesApi;
