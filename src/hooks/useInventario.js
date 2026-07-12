import { useCallback, useState } from "react";
import inventarioApi from "../api/inventarioApi";

const useInventario = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (operation) => {
    setLoading(true);
    setError(null);

    try {
      return await operation();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    obtenerStock: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerStock(params)),
      [execute],
    ),
    obtenerStockPorProducto: useCallback(
      (productoId) =>
        execute(() => inventarioApi.obtenerStockPorProducto(productoId)),
      [execute],
    ),
    obtenerBienesInventario: useCallback(
      (params = {}) =>
        execute(() => inventarioApi.obtenerBienesInventario(params)),
      [execute],
    ),
    obtenerBienInventarioPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerBienInventarioPorId(id)),
      [execute],
    ),
    obtenerNotasIngreso: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerNotasIngreso(params)),
      [execute],
    ),
    obtenerNotaIngresoPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerNotaIngresoPorId(id)),
      [execute],
    ),
    listarDocumentosNotaIngreso: useCallback(
      (notaIngresoId) =>
        execute(() => inventarioApi.listarDocumentosNotaIngreso(notaIngresoId)),
      [execute],
    ),

    subirDocumentoNotaIngreso: useCallback(
      (notaIngresoId, payload) =>
        execute(() =>
          inventarioApi.subirDocumentoNotaIngreso(notaIngresoId, payload),
        ),
      [execute],
    ),

    actualizarDocumentoNotaIngreso: useCallback(
      (notaIngresoId, documentoId, payload) =>
        execute(() =>
          inventarioApi.actualizarDocumentoNotaIngreso(
            notaIngresoId,
            documentoId,
            payload,
          ),
        ),
      [execute],
    ),

    eliminarDocumentoNotaIngreso: useCallback(
      (notaIngresoId, documentoId, payload = {}) =>
        execute(() =>
          inventarioApi.eliminarDocumentoNotaIngreso(
            notaIngresoId,
            documentoId,
            payload,
          ),
        ),
      [execute],
    ),

    getDocumentoNotaIngresoUrl: useCallback(
      (notaIngresoId, documentoId) =>
        inventarioApi.getDocumentoNotaIngresoUrl(notaIngresoId, documentoId),
      [],
    ),
    obtenerNotaIngresoPdfBlob: useCallback(
      (id) => execute(() => inventarioApi.obtenerNotaIngresoPdfBlob(id)),
      [execute],
    ),
    actualizarAprobacionDocumentalNotaIngreso: useCallback(
      (id, payload) =>
        execute(() =>
          inventarioApi.actualizarAprobacionDocumentalNotaIngreso(id, payload),
        ),
      [execute],
    ),
    subsanarNotaIngresoDocumental: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.subsanarNotaIngresoDocumental(id, payload)),
      [execute],
    ),
    obtenerNotasSalida: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerNotasSalida(params)),
      [execute],
    ),
    obtenerNotaSalidaPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerNotaSalidaPorId(id)),
      [execute],
    ),

    obtenerPrestamos: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerPrestamos(params)),
      [execute],
    ),
    obtenerReporteAtencionNotaSalida: useCallback(
      (id) =>
        execute(() => inventarioApi.obtenerReporteAtencionNotaSalida(id)),
      [execute],
    ),
    registrarDevolucionPrestamo: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.registrarDevolucionPrestamo(id, payload)),
      [execute],
    ),
    emitirActaRegularizacionSalidaTemporal: useCallback(
      (id, payload) =>
        execute(() =>
          inventarioApi.emitirActaRegularizacionSalidaTemporal(id, payload),
        ),
      [execute],
    ),
    obtenerActaRegularizacionSalidaTemporal: useCallback(
      (id) =>
        execute(() => inventarioApi.obtenerActaRegularizacionSalidaTemporal(id)),
      [execute],
    ),
    decidirActaRegularizacionSalidaTemporal: useCallback(
      (id, payload) =>
        execute(() =>
          inventarioApi.decidirActaRegularizacionSalidaTemporal(id, payload),
        ),
      [execute],
    ),
    obtenerActaRegularizacionPdfBlob: useCallback(
      (id) => execute(() => inventarioApi.obtenerActaRegularizacionPdfBlob(id)),
      [execute],
    ),
    obtenerSustentoActaRegularizacionBlob: useCallback(
      (id) =>
        execute(() => inventarioApi.obtenerSustentoActaRegularizacionBlob(id)),
      [execute],
    ),
    actualizarAprobacionDocumentalNotaSalida: useCallback(
      (id, payload) =>
        execute(() =>
          inventarioApi.actualizarAprobacionDocumentalNotaSalida(id, payload),
        ),
      [execute],
    ),
    obtenerReservas: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerReservas(params)),
      [execute],
    ),
    obtenerReservaPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerReservaPorId(id)),
      [execute],
    ),
    obtenerMovimientos: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerMovimientos(params)),
      [execute],
    ),
    obtenerMovimientoPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerMovimientoPorId(id)),
      [execute],
    ),
    obtenerKardex: useCallback(
      (productoId, params = {}) =>
        execute(() => inventarioApi.obtenerKardex(productoId, params)),
      [execute],
    ),
    registrarIngresoPorNota: useCallback(
      (payload) =>
        execute(() => inventarioApi.registrarIngresoPorNota(payload)),
      [execute],
    ),
    emitirAjusteInventario: useCallback(
      (payload) => execute(() => inventarioApi.emitirAjusteInventario(payload)),
      [execute],
    ),
    obtenerAjustesInventario: useCallback(
      (params = {}) =>
        execute(() => inventarioApi.obtenerAjustesInventario(params)),
      [execute],
    ),
    obtenerAjusteInventario: useCallback(
      (id) => execute(() => inventarioApi.obtenerAjusteInventario(id)),
      [execute],
    ),
    decidirAjusteInventario: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.decidirAjusteInventario(id, payload)),
      [execute],
    ),
    obtenerAjusteInventarioPdfBlob: useCallback(
      (id) => execute(() => inventarioApi.obtenerAjusteInventarioPdfBlob(id)),
      [execute],
    ),
    obtenerSustentoAjusteInventarioBlob: useCallback(
      (id) =>
        execute(() => inventarioApi.obtenerSustentoAjusteInventarioBlob(id)),
      [execute],
    ),
    crearNotaTransferenciaInventario: useCallback(
      (payload) =>
        execute(() => inventarioApi.crearNotaTransferenciaInventario(payload)),
      [execute],
    ),
    listarNotasTransferenciaInventario: useCallback(
      (params = {}) =>
        execute(() => inventarioApi.listarNotasTransferenciaInventario(params)),
      [execute],
    ),
    obtenerNotaTransferenciaInventario: useCallback(
      (id) =>
        execute(() => inventarioApi.obtenerNotaTransferenciaInventario(id)),
      [execute],
    ),
    decidirNotaTransferenciaInventario: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.decidirNotaTransferenciaInventario(id, payload)),
      [execute],
    ),
    prepararDespachoTransferencia: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.prepararDespachoTransferencia(id, payload)),
      [execute],
    ),
    decidirDespachoTransferencia: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.decidirDespachoTransferencia(id, payload)),
      [execute],
    ),
    prepararRecepcionTransferencia: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.prepararRecepcionTransferencia(id, payload)),
      [execute],
    ),
    decidirRecepcionTransferencia: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.decidirRecepcionTransferencia(id, payload)),
      [execute],
    ),
    obtenerNotaTransferenciaPdfBlob: useCallback(
      (id) => execute(() => inventarioApi.obtenerNotaTransferenciaPdfBlob(id)),
      [execute],
    ),
    obtenerSustentoNotaTransferenciaBlob: useCallback(
      (id) =>
        execute(() => inventarioApi.obtenerSustentoNotaTransferenciaBlob(id)),
      [execute],
    ),
  };
};

export default useInventario;
