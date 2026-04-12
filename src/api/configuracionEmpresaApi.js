import apiFetch, { buildApiUrl } from "./apiFetch";

const configuracionEmpresaApi = {
  obtener: () => apiFetch("configuracion-empresa"),
  guardar: (formData) =>
    apiFetch("configuracion-empresa", {
      method: "PUT",
      body: formData,
    }),
  guardarLogo: (formData) =>
    apiFetch("configuracion-empresa/logo", {
      method: "PUT",
      body: formData,
    }),
  obtenerMembretePdfUrl: () =>
    buildApiUrl("configuracion-empresa/membrete/pdf"),
  quitarLogo: () =>
    apiFetch("configuracion-empresa/logo", {
      method: "DELETE",
    }),
};

export default configuracionEmpresaApi;
