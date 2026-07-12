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
    registrarTransferenciaBienInventario: useCallback(
      (id, payload) =>
        execute(() =>
          inventarioApi.registrarTransferenciaBienInventario(id, payload),
        ),
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
    obtenerAjusteInventarioPdfBlob: useCallback(
      (id) => execute(() => inventarioApi.obtenerAjusteInventarioPdfBlob(id)),
      [execute],
    ),
    obtenerSustentoAjusteInventarioBlob: useCallback(
      (id) =>
        execute(() => inventarioApi.obtenerSustentoAjusteInventarioBlob(id)),
      [execute],
    ),
    registrarTransferencia: useCallback(
      (payload) => execute(() => inventarioApi.registrarTransferencia(payload)),
      [execute],
    ),
    liberarReserva: useCallback(
      (id, payload) => execute(() => inventarioApi.liberarReserva(id, payload)),
      [execute],
    ),
  };
};

export default useInventario;
