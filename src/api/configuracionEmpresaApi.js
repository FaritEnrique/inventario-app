import apiFetch from "./apiFetch";

const configuracionEmpresaApi = {
  obtener: () => apiFetch("configuracion-empresa"),
  guardar: (formData) =>
    apiFetch("configuracion-empresa", {
      method: "PUT",
      body: formData,
    }),
};

export default configuracionEmpresaApi;
