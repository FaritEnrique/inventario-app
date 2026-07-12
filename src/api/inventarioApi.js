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


const buildDocumentoInventarioFormalFormData = (payload = {}) => {
  const { documentoSustento, ...payloadSinArchivo } = payload;
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payloadSinArchivo));
  if (documentoSustento) {
    formData.append("documentoSustento", documentoSustento);
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

  obtenerPrestamos: (params = {}) =>
    apiFetch(`inventario/prestamos${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerReporteAtencionNotaSalida: (id) =>
    apiFetch(`inventario/notas-salida/${id}/reporte-atencion`, {
      sessionActivity: "interactive",
    }),

  registrarDevolucionPrestamo: (id, payload) =>
    apiFetch(`inventario/notas-salida/${id}/devoluciones`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  emitirActaRegularizacionSalidaTemporal: (id, payload) =>
    apiFetch(`inventario/notas-salida/${id}/regularizaciones`, {
      method: "POST",
      body: buildDocumentoInventarioFormalFormData(payload),
      sessionActivity: "interactive",
    }),

  obtenerActaRegularizacionSalidaTemporal: (id) =>
    apiFetch(`inventario/regularizaciones-salida-temporal/${id}`, {
      sessionActivity: "interactive",
    }),

  decidirActaRegularizacionSalidaTemporal: (id, payload) =>
    apiFetch(`inventario/regularizaciones-salida-temporal/${id}/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerActaRegularizacionPdfBlob: (id) =>
    apiFetchBlob(`inventario/regularizaciones-salida-temporal/${id}/pdf`, {
      sessionActivity: "interactive",
    }),

  obtenerSustentoActaRegularizacionBlob: (id) =>
    apiFetchBlob(`inventario/regularizaciones-salida-temporal/${id}/sustento`, {
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

  registrarIngresoPorNota: (payload) => {
    const formData = buildNotaIngresoFormData(payload);

    return apiFetch("inventario/notas-ingreso", {
      method: "POST",
      body: formData || JSON.stringify(payload),
      sessionActivity: "interactive",
    });
  },

  emitirAjusteInventario: (payload) =>
    apiFetch("inventario/ajustes-inventario", {
      method: "POST",
      body: buildDocumentoInventarioFormalFormData(payload),
      sessionActivity: "interactive",
    }),

  obtenerAjustesInventario: (params = {}) =>
    apiFetch(`inventario/ajustes-inventario${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerAjusteInventario: (id) =>
    apiFetch(`inventario/ajustes-inventario/${id}`, {
      sessionActivity: "interactive",
    }),

  decidirAjusteInventario: (id, payload) =>
    apiFetch(`inventario/ajustes-inventario/${id}/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerAjusteInventarioPdfBlob: (id) =>
    apiFetchBlob(`inventario/ajustes-inventario/${id}/pdf`, {
      sessionActivity: "interactive",
    }),

  obtenerSustentoAjusteInventarioBlob: (id) =>
    apiFetchBlob(`inventario/ajustes-inventario/${id}/sustento`, {
      sessionActivity: "interactive",
    }),

  crearNotaTransferenciaInventario: (payload) =>
    apiFetch("inventario/notas-transferencia", {
      method: "POST",
      body: buildDocumentoInventarioFormalFormData(payload),
      sessionActivity: "interactive",
    }),

  listarNotasTransferenciaInventario: (params = {}) =>
    apiFetch(`inventario/notas-transferencia${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerNotaTransferenciaInventario: (id) =>
    apiFetch(`inventario/notas-transferencia/${id}`, {
      sessionActivity: "interactive",
    }),

  decidirNotaTransferenciaInventario: (id, payload) =>
    apiFetch(`inventario/notas-transferencia/${id}/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  prepararDespachoTransferencia: (id, payload) =>
    apiFetch(`inventario/notas-transferencia/${id}/despacho`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  decidirDespachoTransferencia: (id, payload) =>
    apiFetch(`inventario/notas-transferencia/${id}/despacho/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  prepararRecepcionTransferencia: (id, payload) =>
    apiFetch(`inventario/notas-transferencia/${id}/recepcion`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  decidirRecepcionTransferencia: (id, payload) =>
    apiFetch(`inventario/notas-transferencia/${id}/recepcion/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerNotaTransferenciaPdfBlob: (id) =>
    apiFetchBlob(`inventario/notas-transferencia/${id}/pdf`, {
      sessionActivity: "interactive",
    }),

  obtenerSustentoNotaTransferenciaBlob: (id) =>
    apiFetchBlob(`inventario/notas-transferencia/${id}/sustento`, {
      sessionActivity: "interactive",
    }),

};

export default inventarioApi;
