import React, { useEffect, useState } from 'react';
import useAreas from '../hooks/useAreas';

const AreasPage = () => {
  const { fetchAreas, crearArea, actualizarArea, eliminarArea, areas } = useAreas();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [areaActual, setAreaActual] = useState({ codigo: '', nombre: '' });

  const cargarAreas = async () => {
    try {
      await fetchAreas();
    } catch (error) {
      console.error('Error al cargar áreas:', error.message);
    }
  };

  useEffect(() => {
    cargarAreas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await actualizarArea(areaActual.id, areaActual);
      } else {
        await crearArea(areaActual);
      }
      setAreaActual({ codigo: '', nombre: '' });
      setModoEdicion(false);
      cargarAreas();
    } catch (error) {
      console.error('Error al guardar área:', error.message);
    }
  };

  const handleEditar = (area) => {
    setAreaActual(area);
    setModoEdicion(true);
  };

  const handleEliminar = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta área?')) {
      await eliminarArea(id);
      cargarAreas();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Gestión de Áreas</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label htmlFor="codigo" className="block text-sm font-medium">
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            type="text"
            autoComplete="organization-title"
            value={areaActual.codigo}
            onChange={(e) => setAreaActual({ ...areaActual, codigo: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="nombre" className="block text-sm font-medium">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="organization"
            value={areaActual.nombre}
            onChange={(e) => setAreaActual({ ...areaActual, nombre: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          {modoEdicion ? 'Actualizar' : 'Registrar'}
        </button>
      </form>

      <table className="w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">Código</th>
            <th className="border px-3 py-2">Nombre</th>
            <th className="border px-3 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area.id}>
              <td className="border px-3 py-2">{area.codigo}</td>
              <td className="border px-3 py-2">{area.nombre}</td>
              <td className="border px-3 py-2 space-x-2">
                <button
                  onClick={() => handleEditar(area)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(area.id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {areas.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center py-4">
                No hay áreas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AreasPage;