import apiFetch, { apiFetchBlob, buildApiUrl } from "./apiFetch";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.append(key, value);
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
};

const normalizeDocumentosEntrega = (payload = {}) =>
  Array.isArray(payload.documentosEntrega)
    ? payload.documentosEntrega.filter((documento) => documento?.file)
    : [];

const buildNotaIngresoFormData = (payload = {}) => {
  const documentosEntrega = normalizeDocumentosEntrega(payload);

  if (!documentosEntrega.length) {
    return null;
  }

  const { documentosEntrega: _documentosEntrega, ...payloadSinArchivos } =
    payload;

  const formData = new FormData();

  formData.append("payload", JSON.stringify(payloadSinArchivos));
  formData.append(
    "documentosMetadata",
    JSON.stringify(
      documentosEntrega.map((documento) => ({
        tipoDocumento: documento.tipoDocumento,
        numeroDocumento: documento.numeroDocumento || null,
        fechaDocumento: documento.fechaDocumento,
        observaciones: documento.observaciones || null,
      })),
    ),
  );

  documentosEntrega.forEach((documento) => {
    formData.append("documentos", documento.file);
  });

  return formData;
};

const buildDocumentoNotaIngresoFormData = (payload = {}) => {
  const formData = new FormData();

  formData.append("tipoDocumento", payload.tipoDocumento || "");
  formData.append("numeroDocumento", payload.numeroDocumento || "");
  formData.append("fechaDocumento", payload.fechaDocumento || "");
  formData.append("observaciones", payload.observaciones || "");

  if (payload.file) {
    formData.append("documento", payload.file);
  }

  return formData;
};

const inventarioApi = {
  obtenerStock: (params = {}) =>
    apiFetch(`inventario/stock${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerStockPorProducto: (productoId) =>
    apiFetch(`inventario/stock/${productoId}`, {
      sessionActivity: "interactive",
    }),

  obtenerBienesInventario: (params = {}) =>
    apiFetch(`inventario/bienes-inventario${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerBienInventarioPorId: (id) =>
    apiFetch(`inventario/bienes-inventario/${id}`, {
      sessionActivity: "interactive",
    }),

  registrarDevolucionBienInventario: (id, payload) =>
    apiFetch(`inventario/bienes-inventario/${id}/devoluciones`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarTransferenciaBienInventario: (id, payload) =>
    apiFetch(`inventario/bienes-inventario/${id}/transferencias`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarBajaBienInventario: (id, payload) =>
    apiFetch(`inventario/bienes-inventario/${id}/bajas`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerNotasIngreso: (params = {}) =>
    apiFetch(`inventario/notas-ingreso${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerNotaIngresoPorId: (id) =>
    apiFetch(`inventario/notas-ingreso/${id}`, {
      sessionActivity: "interactive",
    }),

  listarDocumentosNotaIngreso: (notaIngresoId) =>
    apiFetch(`inventario/notas-ingreso/${notaIngresoId}/documentos`, {
      sessionActivity: "interactive",
    }),

  subirDocumentoNotaIngreso: (notaIngresoId, payload) =>
    apiFetch(`inventario/notas-ingreso/${notaIngresoId}/documentos`, {
      method: "POST",
      body: buildDocumentoNotaIngresoFormData(payload),
      sessionActivity: "interactive",
    }),

  actualizarDocumentoNotaIngreso: (notaIngresoId, documentoId, payload) =>
    apiFetch(
      `inventario/notas-ingreso/${notaIngresoId}/documentos/${documentoId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        sessionActivity: "interactive",
      },
    ),

  eliminarDocumentoNotaIngreso: (notaIngresoId, documentoId, payload = {}) =>
    apiFetch(
      `inventario/notas-ingreso/${notaIngresoId}/documentos/${documentoId}`,
      {
        method: "DELETE",
        body: JSON.stringify(payload),
        sessionActivity: "interactive",
      },
    ),

  getDocumentoNotaIngresoUrl: (notaIngresoId, documentoId) =>
    buildApiUrl(
      `inventario/notas-ingreso/${notaIngresoId}/documentos/${documentoId}/descargar`,
    ),

  obtenerDocumentoNotaIngresoBlob: (notaIngresoId, documentoId) =>
    apiFetchBlob(
      `inventario/notas-ingreso/${notaIngresoId}/documentos/${documentoId}/descargar`,
      {
        sessionActivity: "interactive",
      },
    ),

  obtenerNotaIngresoPdfBlob: (id) =>
    apiFetchBlob(`inventario/notas-ingreso/${id}/pdf`, {
      sessionActivity: "interactive",
    }),

  actualizarAprobacionDocumentalNotaIngreso: (id, payload) =>
    apiFetch(`inventario/notas-ingreso/${id}/aprobacion-documental`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  subsanarNotaIngresoDocumental: (id, payload) =>
    apiFetch(`inventario/notas-ingreso/${id}/subsanacion-documental`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerNotasSalida: (params = {}) =>
    apiFetch(`inventario/notas-salida${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerNotaSalidaPorId: (id) =>
    apiFetch(`inventario/notas-salida/${id}`, {
      sessionActivity: "interactive",
    }),

  actualizarAprobacionDocumentalNotaSalida: (id, payload) =>
    apiFetch(`inventario/notas-salida/${id}/aprobacion-documental`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerReservas: (params = {}) =>
    apiFetch(`inventario/reservas${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerReservaPorId: (id) =>
    apiFetch(`inventario/reservas/${id}`, {
      sessionActivity: "interactive",
    }),

  obtenerMovimientos: (params = {}) =>
    apiFetch(`inventario/movimientos${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerMovimientoPorId: (id) =>
    apiFetch(`inventario/movimientos/${id}`, {
      sessionActivity: "interactive",
    }),

  obtenerKardex: (productoId, params = {}) =>
    apiFetch(`inventario/kardex/${productoId}${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  registrarEntrada: (payload) =>
    apiFetch("inventario/entradas", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarIngresoPorNota: (payload) => {
    const formData = buildNotaIngresoFormData(payload);

    return apiFetch("inventario/notas-ingreso", {
      method: "POST",
      body: formData || JSON.stringify(payload),
      sessionActivity: "interactive",
    });
  },

  registrarSalida: (payload) =>
    apiFetch("inventario/salidas", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarAjuste: (payload) =>
    apiFetch("inventario/ajustes", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarCargaInicial: (payload) =>
    apiFetch("inventario/carga-inicial", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarTransferencia: (payload) =>
    apiFetch("inventario/transferencias", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),


  liberarReserva: (id, payload = {}) =>
    apiFetch(`inventario/reservas/${id}/liberar`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

};

export default inventarioApi;
