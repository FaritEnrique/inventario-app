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
      [execute]
    ),
    obtenerStockPorProducto: useCallback(
      (productoId) =>
        execute(() => inventarioApi.obtenerStockPorProducto(productoId)),
      [execute]
    ),
    obtenerNotasIngreso: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerNotasIngreso(params)),
      [execute]
    ),
    obtenerNotaIngresoPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerNotaIngresoPorId(id)),
      [execute]
    ),
    actualizarAprobacionDocumentalNotaIngreso: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.actualizarAprobacionDocumentalNotaIngreso(id, payload)),
      [execute]
    ),
    obtenerNotasSalida: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerNotasSalida(params)),
      [execute]
    ),
    obtenerNotaSalidaPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerNotaSalidaPorId(id)),
      [execute]
    ),
    actualizarAprobacionDocumentalNotaSalida: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.actualizarAprobacionDocumentalNotaSalida(id, payload)),
      [execute]
    ),
    obtenerReservas: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerReservas(params)),
      [execute]
    ),
    obtenerReservaPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerReservaPorId(id)),
      [execute]
    ),
    obtenerMovimientos: useCallback(
      (params = {}) => execute(() => inventarioApi.obtenerMovimientos(params)),
      [execute]
    ),
    obtenerMovimientoPorId: useCallback(
      (id) => execute(() => inventarioApi.obtenerMovimientoPorId(id)),
      [execute]
    ),
    obtenerKardex: useCallback(
      (productoId, params = {}) =>
        execute(() => inventarioApi.obtenerKardex(productoId, params)),
      [execute]
    ),
    registrarEntrada: useCallback(
      (payload) => execute(() => inventarioApi.registrarEntrada(payload)),
      [execute]
    ),
    registrarIngresoPorNota: useCallback(
      (payload) =>
        execute(() => inventarioApi.registrarIngresoPorNota(payload)),
      [execute]
    ),
    registrarSalida: useCallback(
      (payload) => execute(() => inventarioApi.registrarSalida(payload)),
      [execute]
    ),
    registrarAjuste: useCallback(
      (payload) => execute(() => inventarioApi.registrarAjuste(payload)),
      [execute]
    ),
    registrarCargaInicial: useCallback(
      (payload) => execute(() => inventarioApi.registrarCargaInicial(payload)),
      [execute]
    ),
    registrarTransferencia: useCallback(
      (payload) => execute(() => inventarioApi.registrarTransferencia(payload)),
      [execute]
    ),
    registrarReserva: useCallback(
      (payload) => execute(() => inventarioApi.registrarReserva(payload)),
      [execute]
    ),
    liberarReserva: useCallback(
      (id, payload) => execute(() => inventarioApi.liberarReserva(id, payload)),
      [execute]
    ),
    despacharReserva: useCallback(
      (id, payload) =>
        execute(() => inventarioApi.despacharReserva(id, payload)),
      [execute]
    ),
  };
};

export default useInventario;
