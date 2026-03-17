import { useCallback, useState } from "react";
import pedidosInternosApi from "../api/pedidosInternosApi";

const usePedidosInternos = () => {
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
    obtenerPedidos: useCallback(
      (params = {}) => execute(() => pedidosInternosApi.obtenerPedidos(params)),
      [execute]
    ),
    obtenerPedidoPorId: useCallback(
      (id) => execute(() => pedidosInternosApi.obtenerPedidoPorId(id)),
      [execute]
    ),
    obtenerBandejaAprobacion: useCallback(
      () => execute(() => pedidosInternosApi.obtenerBandejaAprobacion()),
      [execute]
    ),
    obtenerBandejaAlmacen: useCallback(
      (params = {}) =>
        execute(() => pedidosInternosApi.obtenerBandejaAlmacen(params)),
      [execute]
    ),
    crearPedido: useCallback(
      (payload) => execute(() => pedidosInternosApi.crearPedido(payload)),
      [execute]
    ),
    aprobarPedido: useCallback(
      (id, payload) =>
        execute(() => pedidosInternosApi.aprobarPedido(id, payload)),
      [execute]
    ),
    atenderPedido: useCallback(
      (id, payload) =>
        execute(() => pedidosInternosApi.atenderPedido(id, payload)),
      [execute]
    ),
  };
};

export default usePedidosInternos;
