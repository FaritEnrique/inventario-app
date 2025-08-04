// src/pages/GestionUsuariosPage.jsx
import React, { useState, useEffect } from 'react';
import useUsers from '../hooks/useUsers';

const GestionUsuariosPage = () => {
  const {
    usuarios,
    cargando: cargandoUsuarios,
    crearUsuario,
    eliminarUsuario,
  } = useUsers();

  const [areas, setAreas] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  const [errorAreas, setErrorAreas] = useState(null);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: '',
    email: '',
    nome: '',
    password: '',
    areaId: '',
  });

  // Estado para guardar el código del último usuario creado y mostrarlo
  const [ultimoCodigoGenerado, setUltimoCodigoGenerado] = useState(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setCargandoAreas(true);
        setErrorAreas(null);
        const response = await fetch('http://localhost:3000/api/areas');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAreas(data);
        if (data.length > 0 && !nuevoUsuario.areaId) {
          setNuevoUsuario((prev) => ({ ...prev, areaId: data[0].id }));
        }
      } catch (err) {
        console.error("Error al cargar áreas desde el backend:", err);
        setErrorAreas("No se pudieron cargar las áreas desde el servidor.");
      } finally {
        setCargandoAreas(false);
      }
    };

    fetchAreas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'areaId' && value !== '' ? parseInt(value, 10) : value;
    setNuevoUsuario((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      ...nuevoUsuario,
      areaId: nuevoUsuario.areaId === '' ? null : nuevoUsuario.areaId,
    };

    if (dataToSend.areaId === null) {
      alert('Por favor, selecciona un área para el usuario.');
      return;
    }

    try {
      const usuarioCreado = await crearUsuario(dataToSend);
      if (usuarioCreado && usuarioCreado.codigoUsuario) {
        setUltimoCodigoGenerado(usuarioCreado.codigoUsuario);
      }
      setNuevoUsuario({
        name: '',
        email: '',
        password: '',
        areaId: areas.length > 0 ? areas[0].id : '',
      });
    } catch (error) {
      alert(`Error al crear usuario: ${error.message}`);
      console.error("Error al crear usuario:", error);
      setUltimoCodigoGenerado(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" value={nuevoUsuario.name} onChange={handleChange} placeholder="Nombre" className="p-2 border rounded" autoComplete="name" required />
        <input name="email" value={nuevoUsuario.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" type="email" autoComplete="email" required />
        <input name="password" value={nuevoUsuario.password} onChange={handleChange} placeholder="Contraseña" className="p-2 border rounded" type="password" autoComplete="new-password" required />

        {cargandoAreas ? (
          <p className="p-2 border rounded text-gray-500 bg-gray-100">Cargando áreas...</p>
        ) : errorAreas ? (
          <p className="p-2 border rounded text-red-500 bg-red-50">Error al cargar áreas: {errorAreas}</p>
        ) : (
          <select
            name="areaId"
            value={nuevoUsuario.areaId}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="">-- Selecciona un Área --</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre} ({area.codigo})
              </option>
            ))}
          </select>
        )}

        <button type="submit" className="col-span-1 md:col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors">
          Crear Usuario
        </button>
      </form>

      {/* Campo de solo lectura para el Código de Usuario Generado */}
      {ultimoCodigoGenerado && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <p className="font-semibold">¡Usuario creado con éxito!</p>
          <p>El código asignado es: <span className="font-bold text-green-900 text-lg">{ultimoCodigoGenerado}</span></p>
        </div>
      )}

      ---

      {/* Lista de Usuarios (sin cambios) */}
      {cargandoUsuarios ? (
        <p>Cargando usuarios...</p>
      ) : (
        <ul className="space-y-2">
          {usuarios.length === 0 ? (
            <p className="text-gray-600">No hay usuarios registrados.</p>
          ) : (
            usuarios.map((user) => (
              <li
                key={user.id}
                className="p-4 border rounded flex flex-col md:flex-row justify-between items-start md:items-center bg-white shadow-sm"
              >
                <div>
                  <p className="text-gray-800">
                    <strong>{user.name}</strong> - {user.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Código: <span className="font-semibold text-blue-700">{user.codigoUsuario || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Área: <span className="font-semibold text-gray-700">{user.area?.nombre || 'Sin área asignada'}</span>
                  </p>
                </div>
                <button
                  onClick={() => eliminarUsuario(user.id)}
                  className="mt-3 md:mt-0 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                >
                  Eliminar
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default GestionUsuariosPage;