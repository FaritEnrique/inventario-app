import React, { useEffect } from 'react';
import usePedidos from '../hooks/usePedidos';

const PedidosPage = () => {
  const { pedidos, fetchPedidos, cargando, error } = usePedidos();

  useEffect(() => {
    fetchPedidos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-indigo-700">Gestión de Pedidos</h1>

      {cargando && <p>Cargando pedidos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <table className="w-full table-auto border mt-4">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2">Código</th>
            <th className="px-4 py-2">Producto</th>
            <th className="px-4 py-2">Cantidad</th>
            <th className="px-4 py-2">Área</th>
            <th className="px-4 py-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className="border-t">
              <td className="px-4 py-2">{pedido.codigo}</td>
              <td className="px-4 py-2">{pedido.producto?.nombre || '—'}</td>
              <td className="px-4 py-2">{pedido.cantidad}</td>
              <td className="px-4 py-2">{pedido.area?.nombre || '—'}</td>
              <td className="px-4 py-2">{new Date(pedido.fecha).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PedidosPage;