import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import productosTemporalesApi from "../api/productosTemporalesApi";

const normalizeListResponse = (response) =>
  Array.isArray(response?.productosTemporales)
    ? response.productosTemporales
    : [];

const DEFAULT_PARAMS = { estado: "PENDIENTE" };

const useProductosTemporales = (initialParams = DEFAULT_PARAMS) => {
  const initialParamsRef = useRef(initialParams);
  const paramsRef = useRef(initialParams);
  const [productosTemporales, setProductosTemporales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const listarProductosTemporales = useCallback(async (nextParams) => {
    const resolvedParams = nextParams ?? paramsRef.current;

    try {
      setLoading(true);
      setError(null);
      paramsRef.current = resolvedParams;
      setParams(resolvedParams);
      const response = await productosTemporalesApi.listar(resolvedParams);
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
  }, []);

  useEffect(() => {
    listarProductosTemporales(initialParamsRef.current).catch(() => {});
  }, [listarProductosTemporales]);

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
