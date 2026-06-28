import React, { useEffect } from 'react';
import usePedidos from '../hooks/usePedidos';

const formatPedidoDate = (value) =>
  value ? new Date(value).toLocaleDateString() : '-';

const PedidosPage = () => {
  const { pedidos, fetchPedidos, cargando, error } = usePedidos();

  useEffect(() => {
    fetchPedidos();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-semibold text-indigo-700">Gestión de Pedidos</h1>

      {cargando && <p>Cargando pedidos…</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-[760px] w-full table-auto text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="whitespace-nowrap px-4 py-2">Código</th>
            <th className="whitespace-nowrap px-4 py-2">Producto</th>
            <th className="whitespace-nowrap px-4 py-2">Cantidad</th>
            <th className="whitespace-nowrap px-4 py-2">Área</th>
            <th className="whitespace-nowrap px-4 py-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className="border-t">
              <td className="whitespace-nowrap px-4 py-2">{pedido.codigo}</td>
              <td className="whitespace-nowrap px-4 py-2">{pedido.producto?.nombre || '—'}</td>
              <td className="whitespace-nowrap px-4 py-2">{pedido.cantidad}</td>
              <td className="whitespace-nowrap px-4 py-2">{pedido.area?.nombre || '—'}</td>
              <td className="whitespace-nowrap px-4 py-2">{formatPedidoDate(pedido.fecha)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default PedidosPage;
