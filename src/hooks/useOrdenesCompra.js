import { useCallback, useState } from "react";
import ordenesCompraApi from "../api/ordenesCompraApi";

const useOrdenesCompra = () => {
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
    obtenerOrdenesCompra: useCallback(
      (params = {}) => execute(() => ordenesCompraApi.obtenerOrdenesCompra(params)),
      [execute]
    ),
    obtenerBandejaAprobacionOrdenCompra: useCallback(
      (params = {}) =>
        execute(() => ordenesCompraApi.obtenerBandejaAprobacion(params)),
      [execute]
    ),
    obtenerOrdenCompraPorId: useCallback(
      (id) => execute(() => ordenesCompraApi.obtenerOrdenCompraPorId(id)),
      [execute]
    ),
    obtenerOrdenCompraPdfBlob: useCallback(
      (id) => execute(() => ordenesCompraApi.obtenerOrdenCompraPdfBlob(id)),
      [execute]
    ),
    actualizarAprobacionOrdenCompra: useCallback(
      (id, payload) =>
        execute(() =>
          ordenesCompraApi.actualizarAprobacionOrdenCompra(id, payload)
        ),
      [execute]
    ),
    cerrarOrdenCompra: useCallback(
      (id, payload = {}) =>
        execute(() => ordenesCompraApi.cerrarOrdenCompra(id, payload)),
      [execute]
    ),
    cancelarOrdenCompra: useCallback(
      (id, payload = {}) =>
        execute(() => ordenesCompraApi.cancelarOrdenCompra(id, payload)),
      [execute]
    ),
    anularOrdenCompra: useCallback(
      (id, payload = {}) =>
        execute(() => ordenesCompraApi.anularOrdenCompra(id, payload)),
      [execute]
    ),
  };
};

export default useOrdenesCompra;
