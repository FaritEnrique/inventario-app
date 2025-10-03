import React, { useEffect } from 'react';
import useRequerimientos from '../hooks/useRequerimientos';
import Loader from '../components/Loader'; // Assuming a Loader component exists

const RequerimientosPage = () => {
  const { requerimientos, fetchRequerimientos, cargando, error } = useRequerimientos();

  useEffect(() => {
    fetchRequerimientos();
  }, [fetchRequerimientos]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-indigo-700">Gestión de Requerimientos</h1>

      {cargando && <Loader />}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full table-auto border mt-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Área Solicitante</th>
              <th className="px-4 py-2">N° de Ítems</th>
              <th className="px-4 py-2">Prioridad</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {requerimientos.map((req) => (
              <tr key={req.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800">{req.codigo}</td>
                <td className="px-4 py-2">{req.area?.nombre || '—'}</td>
                <td className="px-4 py-2 text-center">{req.items?.length || 0}</td>
                <td className="px-4 py-2">{req.prioridad}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    req.estado === 'Aprobado' ? 'bg-green-100 text-green-800' :
                    req.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    req.estado === 'Rechazado' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {req.estado}
                  </span>
                </td>
                <td className="px-4 py-2">{new Date(req.fecha).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequerimientosPage;
