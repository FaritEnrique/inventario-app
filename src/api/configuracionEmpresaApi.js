import apiFetch, { buildApiUrl } from "./apiFetch";

const configuracionEmpresaApi = {
  obtener: () =>
    apiFetch("configuracion-empresa", { sessionActivity: "interactive" }),
  obtenerDocumento: () =>
    apiFetch("configuracion-empresa/documento", {
      sessionActivity: "interactive",
    }),
  guardar: (formData) =>
    apiFetch("configuracion-empresa", {
      method: "PUT",
      body: formData,
      sessionActivity: "interactive",
    }),
  guardarLogo: (formData) =>
    apiFetch("configuracion-empresa/logo", {
      method: "PUT",
      body: formData,
      sessionActivity: "interactive",
    }),
  obtenerMembretePdfUrl: () =>
    buildApiUrl("configuracion-empresa/membrete/pdf"),
  quitarLogo: () =>
    apiFetch("configuracion-empresa/logo", {
      method: "DELETE",
      sessionActivity: "interactive",
    }),
};

export default configuracionEmpresaApi;
