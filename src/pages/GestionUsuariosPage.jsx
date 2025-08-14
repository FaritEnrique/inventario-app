import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import useUsers from '../hooks/useUsers';
import apiFetch from '../api/apiFetch'; 
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root');

const GestionUsuariosPage = () => {
  const {
    usuarios,
    cargando: cargandoUsuarios,
    crearUsuario,
    eliminarUsuario,
    actualizarUsuario,
  } = useUsers();

  const [areas, setAreas] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  const [cargandoRangos, setCargandoRangos] = useState(true);
  const [errorAreas, setErrorAreas] = useState(null);
  const [errorRangos, setErrorRangos] = useState(null);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: '',
    email: '',
    password: '',
    areaId: '', 
    rangoId: '',
    activo: false, // ✅ CORRECCIÓN: Estado activo por defecto para nuevos usuarios
  });

  const [ultimoCodigoGenerado, setUltimoCodigoGenerado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        setCargandoAreas(true);
        setCargandoRangos(true);
        
        const areasResponse = await apiFetch('areas');
        setAreas(areasResponse);
        
        const rangosResponse = await apiFetch('rangos');
        setRangos(rangosResponse);
        
      } catch (err) {
        console.error("Error al cargar datos desde el backend:", err);
        toast.error("No se pudieron cargar las áreas y/o rangos del servidor.");
        setErrorAreas("No se pudieron cargar las áreas desde el servidor.");
        setErrorRangos("No se pudieron cargar los rangos desde el servidor.");
      } finally {
        setCargandoAreas(false);
        setCargandoRangos(false);
      }
    };
    fetchSelectData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value; // ✅ CORRECCIÓN: Manejar el checkbox
    const parsedValue = (name === 'areaId' || name === 'rangoId') && newValue !== '' ? parseInt(newValue, 10) : newValue;
    setNuevoUsuario((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nuevoUsuario.areaId === '' || isNaN(nuevoUsuario.areaId)) {
      toast.error('Por favor, selecciona un área válida para el usuario.');
      return;
    }
    if (nuevoUsuario.rangoId === '' || isNaN(nuevoUsuario.rangoId)) {
      toast.error('Por favor, selecciona un rango válido para el usuario.');
      return;
    }

    try {
      const usuarioCreado = await crearUsuario(nuevoUsuario); // ✅ Envía el objeto completo, incluido 'activo'
      if (usuarioCreado && usuarioCreado.codigoUsuario) {
        setUltimoCodigoGenerado(usuarioCreado.codigoUsuario);
      }
      toast.success('Usuario creado con éxito!');
      setNuevoUsuario({
        name: '',
        email: '',
        password: '',
        areaId: '',
        rangoId: '',
        activo: false, // ✅ Reiniciamos el estado activo
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      toast.error(error.message || 'Error al crear usuario.');
      setUltimoCodigoGenerado(null);
    }
  };

  const handleEditClick = (user) => {
    setUsuarioAEditar({ 
      ...user, 
      areaId: user.areaId || '',
      rangoId: user.rangoId || ''
    });
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target; // ✅ CORRECCIÓN: Manejar el checkbox
    const newValue = type === 'checkbox' ? checked : value;
    const parsedValue = (name === 'areaId' || name === 'rangoId') && newValue !== '' ? parseInt(newValue, 10) : newValue;
    setUsuarioAEditar((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!usuarioAEditar) return;

    try {
      await actualizarUsuario(usuarioAEditar.id, {
        name: usuarioAEditar.name,
        email: usuarioAEditar.email,
        areaId: usuarioAEditar.areaId,
        rangoId: usuarioAEditar.rangoId,
        activo: usuarioAEditar.activo, // ✅ CORRECCIÓN: Envía el campo 'activo'
      });
      handleCloseModal();
      toast.success('Usuario actualizado con éxito.');
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      toast.error('No se pudieron guardar los cambios.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUsuarioAEditar(null);
  };

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      {/* Formulario de Creación de Usuarios */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" value={nuevoUsuario.name} onChange={handleChange} placeholder="Nombre" className="p-2 border rounded" autoComplete="name" required />
        <input name="email" value={nuevoUsuario.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" type="email" autoComplete="email" required />
        <input name="password" value={nuevoUsuario.password} onChange={handleChange} placeholder="Contraseña" className="p-2 border rounded" type="password" autoComplete="new-password" required />
        
        {/* Selector de Área */}
        {(cargandoAreas || cargandoRangos) ? (
          <p className="p-2 border rounded text-gray-500 bg-gray-100 col-span-full">Cargando datos...</p>
        ) : errorAreas || errorRangos ? (
          <p className="p-2 border rounded text-red-500 bg-red-50 col-span-full">Error al cargar datos.</p>
        ) : (
          <>
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

            {/* Selector de Rango */}
            <select
              name="rangoId"
              value={nuevoUsuario.rangoId}
              onChange={handleChange}
              className="p-2 border rounded"
              required
            >
              <option value="">-- Selecciona un Rango --</option>
              {rangos.map((rango) => (
                <option key={rango.id} value={rango.id}>
                  {rango.nombre}
                </option>
              ))}
            </select>
          </>
        )}

        {/* ✅ CORRECCIÓN: Checkbox para el estado activo */}
        <div className="flex items-center col-span-1 md:col-span-2">
          <input
            type="checkbox"
            id="activo-crear"
            name="activo"
            checked={nuevoUsuario.activo}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="activo-crear" className="text-sm text-gray-700">Usuario Activo</label>
        </div>

        <button type="submit" className="col-span-1 md:col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors">
          Crear Usuario
        </button>
      </form>

      {/* Mensaje de éxito al crear usuario */}
      {ultimoCodigoGenerado && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
          <p className="font-semibold">¡Usuario creado con éxito!</p>
          <p>El código de usuario asignado es: <span className="font-bold text-green-900 text-lg">{ultimoCodigoGenerado}</span></p>
        </div>
      )}

      <hr className="my-6" />

      {/* Lista de Usuarios */}
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
                  <p className="text-sm text-gray-600">
                    Rango: <span className="font-semibold text-gray-700">{user.rango?.nombre || 'Sin rango asignado'}</span>
                  </p>
                  {/* ✅ CORRECCIÓN: Muestra el estado activo */}
                  <p className="text-sm text-gray-600">
                    Estado: <span className={`font-semibold ${user.activo ? 'text-green-600' : 'text-red-600'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarUsuario(user.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {/* Modal de Edición */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        style={customStyles}
        contentLabel="Editar Usuario"
      >
        <h3 className="text-xl font-bold mb-4">Editar Usuario</h3>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="name"
              value={usuarioAEditar?.name || ''}
              onChange={handleEditChange}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={usuarioAEditar?.email || ''}
              onChange={handleEditChange}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Área</label>
            {(cargandoAreas || cargandoRangos) ? (
              <p className="mt-1 p-2 border rounded-md text-gray-500 bg-gray-100">Cargando datos...</p>
            ) : errorAreas ? (
              <p className="mt-1 p-2 border rounded-md text-red-500 bg-red-50">Error: {errorAreas}</p>
            ) : (
              <select
                name="areaId"
                value={usuarioAEditar?.areaId || ''}
                onChange={handleEditChange}
                className="mt-1 block w-full p-2 border rounded-md"
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rango</label>
            {cargandoRangos ? (
              <p className="mt-1 p-2 border rounded-md text-gray-500 bg-gray-100">Cargando rangos...</p>
            ) : errorRangos ? (
              <p className="mt-1 p-2 border rounded-md text-red-500 bg-red-50">Error: {errorRangos}</p>
            ) : (
              <select
                name="rangoId"
                value={usuarioAEditar?.rangoId || ''}
                onChange={handleEditChange}
                className="mt-1 block w-full p-2 border rounded-md"
                required
              >
                <option value="">-- Selecciona un Rango --</option>
                {rangos.map((rango) => (
                  <option key={rango.id} value={rango.id}>
                    {rango.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Código de Usuario</label>
            <input
              type="text"
              name="codigoUsuario"
              value={usuarioAEditar?.codigoUsuario || 'N/A'}
              readOnly
              className="mt-1 block w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>
          {/* ✅ CORRECCIÓN: Checkbox para el estado activo en el modal */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo-editar"
              name="activo"
              checked={usuarioAEditar?.activo || false}
              onChange={handleEditChange}
              className="mr-2"
            />
            <label htmlFor="activo-editar" className="text-sm font-medium text-gray-700">Usuario Activo</label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GestionUsuariosPage;