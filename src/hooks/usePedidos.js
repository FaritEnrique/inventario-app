import { useState } from 'react';
import pedidosApi from '../api/pedidosApi';

const usePedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchPedidos = async (buscar = '') => {
    setCargando(true);
    try {
      const data = await pedidosApi.obtenerTodos(buscar);
      setPedidos(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const crearPedido = async (datos) => {
    const nuevo = await pedidosApi.crear(datos);
    setPedidos([...pedidos, nuevo]);
  };

  const eliminarPedido = async (id) => {
    await pedidosApi.eliminar(id);
    setPedidos(pedidos.filter((p) => p.id !== id));
  };

  return {
    pedidos,
    cargando,
    error,
    fetchPedidos,
    crearPedido,
    eliminarPedido,
  };
};

export default usePedidos;