import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import productosTemporalesApi from "../api/productosTemporalesApi";

const normalizeListResponse = (response) =>
  Array.isArray(response?.productosTemporales)
    ? response.productosTemporales
    : [];

const useProductosTemporales = (initialParams = { estado: "PENDIENTE" }) => {
  const [productosTemporales, setProductosTemporales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const listarProductosTemporales = useCallback(async (nextParams = params) => {
    try {
      setLoading(true);
      setError(null);
      setParams(nextParams);
      const response = await productosTemporalesApi.listar(nextParams);
      const items = normalizeListResponse(response);
      setProductosTemporales(items);
      return response;
    } catch (err) {
      setError(err.message || "No se pudieron cargar productos temporales.");
      toast.error(err.message || "No se pudieron cargar productos temporales.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    listarProductosTemporales(initialParams).catch(() => {});
  }, []);

  const vincularProductoTemporal = useCallback(async (id, payload) => {
    const response = await productosTemporalesApi.vincular(id, payload);
    toast.success("Producto temporal vinculado correctamente.");
    return response;
  }, []);

  const crearProductoDesdeTemporal = useCallback(async (id, payload) => {
    const response = await productosTemporalesApi.crearProducto(id, payload);
    toast.success("Producto creado y vinculado correctamente.");
    return response;
  }, []);

  return {
    productosTemporales,
    loading,
    error,
    params,
    listarProductosTemporales,
    vincularProductoTemporal,
    crearProductoDesdeTemporal,
  };
};

export default useProductosTemporales;
