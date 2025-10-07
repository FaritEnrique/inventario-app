import React, { useState, useEffect, useContext } from "react";
import Modal from "react-modal";
import useUsers from "../hooks/useUsers";
import apiFetch from "../api/apiFetch";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/authContext";
import ConfirmToast from "../components/ConfirmToast";

Modal.setAppElement("#root");

const GestionUsuariosPage = () => {
  const {
    usuarios,
    cargando: cargandoUsuarios,
    crearUsuario,
    eliminarUsuario,
    actualizarUsuario,
  } = useUsers();

  const { user: currentUser } = useContext(AuthContext);

  const [areas, setAreas] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  const [cargandoRangos, setCargandoRangos] = useState(true);

  const roles = [
    'GERENTE_GENERAL',
    'GERENTE_ADMINISTRACION',
    'GERENTE_FUNCIONAL',
    'ADMINISTRADOR_SISTEMA',
    'JEFE_AREA',
    'OTROS'
  ];

  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: "", email: "", password: "", areaId: "", rangoId: "", activo: true, cargo: "", rol: "OTROS",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [areasResponse, rangosResponse] = await Promise.all([apiFetch("areas"), apiFetch("rangos")]);
        setAreas(areasResponse);
        setRangos(rangosResponse);
      } catch (err) {
        toast.error("No se pudieron cargar las áreas y/o rangos.");
      } finally {
        setCargandoAreas(false);
        setCargandoRangos(false);
      }
    };
    fetchSelectData();
  }, []);

  const showConfirmToast = ({ message, onConfirm }) => {
    toast(<ConfirmToast message={message} onConfirm={onConfirm} />, {
      position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: true, style: { width: '450px' }
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    const parsedValue = (name === "areaId" || name === "rangoId") && val !== "" ? parseInt(val, 10) : val;
    setNuevoUsuario((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.areaId || !nuevoUsuario.rangoId) {
      toast.error("Por favor, selecciona un área y un rango válidos.");
      return;
    }
    try {
      await crearUsuario(nuevoUsuario);
      toast.success("Usuario creado con éxito!");
      setNuevoUsuario({ name: "", email: "", password: "", areaId: "", rangoId: "", activo: true, cargo: "", rol: "OTROS" });
    } catch (error) {
      toast.error(error.message || "Error al crear usuario.");
    }
  };

  const handleEditClick = (user) => {
    setUsuarioAEditar({ ...user, areaId: user.areaId || "", rangoId: user.rangoId || "", cargo: user.cargo || "", rol: user.rol || 'OTROS' });
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    const parsedValue = (name === "areaId" || name === "rangoId") && val !== "" ? parseInt(val, 10) : val;
    setUsuarioAEditar((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!usuarioAEditar) return;

    const payload = { name: usuarioAEditar.name, email: usuarioAEditar.email, areaId: usuarioAEditar.areaId, rangoId: usuarioAEditar.rangoId, activo: usuarioAEditar.activo, cargo: usuarioAEditar.cargo, rol: usuarioAEditar.rol };

    if (payload.rol === 'ADMINISTRADOR_SISTEMA' && usuarioAEditar.rol !== 'ADMINISTRADOR_SISTEMA') {
      const message = currentUser.rol === 'GERENTE_GENERAL'
        ? `Estás nombrando a ${usuarioAEditar.name} como nuevo Administrador del Sistema. El administrador actual (si existe) será reemplazado. ¿Continuar?`
        : `Estás a punto de transferir tu rol de Administrador a ${usuarioAEditar.name}. Perderás tus privilegios. ¿Continuar?`;

      showConfirmToast({
        message,
        onConfirm: async () => {
          try {
            await actualizarUsuario(usuarioAEditar.id, payload);
            handleCloseModal();
            toast.success("Usuario actualizado y rol transferido con éxito.");
          } catch (error) {
            toast.error(error.message || "No se pudo actualizar el usuario.");
          }
        },
      });
    } else {
      try {
        await actualizarUsuario(usuarioAEditar.id, payload);
        handleCloseModal();
        toast.success("Usuario actualizado con éxito.");
      } catch (error) {
        toast.error(error.message || "No se pudieron guardar los cambios.");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUsuarioAEditar(null);
  };
  
  const handleDelete = (userId) => {
    showConfirmToast({
      message: '¿Estás seguro de que quieres eliminar este usuario?',
      onConfirm: async () => {
        try {
          await eliminarUsuario(userId);
          toast.success('Usuario eliminado correctamente');
        } catch (error) {
          toast.error(error.message || 'Error al eliminar el usuario');
        }
      }
    });
  };

  const customStyles = { content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '450px', padding: '20px', borderRadius: '8px' } };
  const canManageAdminRole = currentUser?.rol === 'GERENTE_GENERAL' || currentUser?.rol === 'ADMINISTRADOR_SISTEMA';

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Gestión de Usuarios</h1>

      {/* Formulario de Creación */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <input name="name" value={nuevoUsuario.name} onChange={handleChange} placeholder="Nombre" className="p-2 border rounded" required />
        <input name="email" value={nuevoUsuario.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" type="email" required />
        <input name="password" value={nuevoUsuario.password} onChange={handleChange} placeholder="Contraseña" className="p-2 border rounded" type="password" required />
        <input name="cargo" value={nuevoUsuario.cargo} onChange={handleChange} placeholder="Cargo" className="p-2 border rounded" required />
        <select name="areaId" value={nuevoUsuario.areaId} onChange={handleChange} className="p-2 border rounded" required><option value="">-- Área --</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}</select>
        <select name="rangoId" value={nuevoUsuario.rangoId} onChange={handleChange} className="p-2 border rounded" required><option value="">-- Rango --</option>{rangos.map((rango) => <option key={rango.id} value={rango.id}>{rango.nombre}</option>)}</select>
        <select name="rol" value={nuevoUsuario.rol} onChange={handleChange} className="p-2 border rounded" required><option value="">-- Rol --</option>{roles.map((rol) => <option key={rol} value={rol} disabled={rol === 'ADMINISTRADOR_SISTEMA'}>{rol}</option>)}</select>
        <div className="flex items-center md:col-span-3"><input type="checkbox" id="activo-crear" name="activo" checked={nuevoUsuario.activo} onChange={handleChange} className="mr-2" /><label htmlFor="activo-crear">Usuario Activo</label></div>
        <button type="submit" className="col-span-1 p-2 text-white bg-blue-600 rounded md:col-span-3">Crear Usuario</button>
      </form>

      {/* Lista de Usuarios */}
      {cargandoUsuarios ? <p>Cargando...</p> : (
        <ul className="space-y-2">
          {usuarios.map((user) => (
            <li key={user.id} className="flex flex-col items-start justify-between p-4 bg-white border rounded shadow-sm md:flex-row md:items-center">
              <div>
                <p><strong>{user.name}</strong> - {user.email}</p>
                <p className="text-sm">Rol: <span className="font-semibold text-purple-700">{user.rol || "N/A"}</span></p>
                <p className="text-sm">Cargo: <span className="font-semibold text-gray-700">{user.cargo || "N/A"}</span></p>
                <p className="text-sm">Área: <span className="font-semibold text-gray-700">{user.area?.nombre || "N/A"}</span></p>
                <p className="text-sm">Estado: <span className={`font-semibold ${user.activo ? "text-green-600" : "text-red-600"}`}>{user.activo ? "Activo" : "Inactivo"}</span></p>
              </div>
              <div className="flex gap-2 mt-3 md:mt-0">
                <button onClick={() => handleEditClick(user)} className="px-4 py-2 text-sm text-white bg-green-500 rounded">Editar</button>
                <button onClick={() => handleDelete(user.id)} className="px-4 py-2 text-sm text-white bg-red-500 rounded">Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de Edición */}
      {usuarioAEditar && (
        <Modal isOpen={isModalOpen} onRequestClose={handleCloseModal} style={customStyles}>
          <h3 className="mb-4 text-xl font-bold">Editar Usuario</h3>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div><label>Nombre</label><input type="text" name="name" value={usuarioAEditar.name} onChange={handleEditChange} className="block w-full p-2 mt-1 border rounded-md" required /></div>
            <div><label>Email</label><input type="email" name="email" value={usuarioAEditar.email} onChange={handleEditChange} className="block w-full p-2 mt-1 border rounded-md" required /></div>
            <div><label>Cargo</label><input type="text" name="cargo" value={usuarioAEditar.cargo} onChange={handleEditChange} className="block w-full p-2 mt-1 border rounded-md" required /></div>
            <select name="areaId" value={usuarioAEditar.areaId} onChange={handleEditChange} className="block w-full p-2 mt-1 border rounded-md" required><option value="">-- Área --</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}</select>
            <select name="rangoId" value={usuarioAEditar.rangoId} onChange={handleEditChange} className="block w-full p-2 mt-1 border rounded-md" required><option value="">-- Rango --</option>{rangos.map((rango) => <option key={rango.id} value={rango.id}>{rango.nombre}</option>)}</select>
            <div>
              <label>Rol</label>
              <select name="rol" value={usuarioAEditar.rol} onChange={handleEditChange} className="block w-full p-2 mt-1 border rounded-md" required>
                {roles.map((rol) => (
                  <option key={rol} value={rol} disabled={rol === 'ADMINISTRADOR_SISTEMA' && !canManageAdminRole && usuarioAEditar.rol !== 'ADMINISTRADOR_SISTEMA'}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center"><input type="checkbox" id="activo-editar" name="activo" checked={usuarioAEditar.activo} onChange={handleEditChange} className="mr-2" /><label htmlFor="activo-editar">Usuario Activo</label></div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Guardar Cambios</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GestionUsuariosPage;
