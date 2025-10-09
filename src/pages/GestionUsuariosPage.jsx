// src/pages/GestionUsuariosPage.jsx
import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import useUsers from "../hooks/useUsers";
import apiFetch from "../api/apiFetch";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import UsuarioForm from "../components/UsuarioForm";

Modal.setAppElement("#root");

const GestionUsuariosPage = () => {
  const {
    usuarios,
    cargando: cargandoUsuarios,
    crearUsuario,
    eliminarUsuario,
    actualizarUsuario,
    toggleActivo,
    cargarUsuarios,
    page,
    totalPages,
    setPage,
    setSearch,
  } = useUsers();

  const { user: currentUser } = useAuth();

  const [areas, setAreas] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  const [cargandoRangos, setCargandoRangos] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [areasResponse, rangosResponse] = await Promise.all([
          apiFetch("areas"),
          apiFetch("rangos"),
        ]);
        setAreas(areasResponse || []);
        setRangos(rangosResponse || []);
      } catch (err) {
        toast.error("No se pudieron cargar las áreas y/o rangos.");
      } finally {
        setCargandoAreas(false);
        setCargandoRangos(false);
      }
    };
    fetchSelectData();
  }, []);

  const canManageAdminRole =
    currentUser?.rol === "GERENTE_GENERAL" ||
    currentUser?.rol === "ADMINISTRADOR_SISTEMA";

  const handleCrear = async (usuario) => {
    try {
      await crearUsuario(usuario);
      toast.success("Usuario creado con éxito!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al crear usuario.");
      throw error;
    }
  };

  const handleEditClick = (user) => {
    setUsuarioAEditar(user);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async (datos) => {
    if (!usuarioAEditar) return;
    try {
      await actualizarUsuario(usuarioAEditar.id, datos);
      toast.success("Usuario actualizado con éxito.");
      setIsModalOpen(false);
      setUsuarioAEditar(null);
    } catch (error) {
      toast.error(error.message || "No se pudieron guardar los cambios.");
      throw error;
    }
  };

  const handleDelete = (userId, userName) => {
    toast.info(
      <ConfirmDeleteToast2
        message={`¿Estás seguro de que quieres eliminar a ${userName}? Esta acción requiere confirmación.`}
        onConfirm={async () => {
          try {
            await eliminarUsuario(userId);
            toast.success("Usuario eliminado correctamente");
          } catch (error) {
            toast.error(error.message || "Error al eliminar el usuario");
          }
        }}
        closeToast={() => toast.dismiss()}
      />,
      { autoClose: false }
    );
  };

  const handleToggleActivo = async (user) => {
    try {
      await toggleActivo(user.id, !user.activo);
      toast.success(
        `Estado actualizado: ${user.activo ? "Inactivado" : "Activado"}`
      );
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar estado");
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Gestión de Usuarios</h1>

      <div className="mb-6">
        <UsuarioForm
          areas={areas}
          rangos={rangos}
          onSave={handleCrear}
          onCancel={() => {}}
          disableAdminRole={!canManageAdminRole}
        />
      </div>

      {cargandoUsuarios ? (
        <p>Cargando...</p>
      ) : (
        <ul className="space-y-2">
          {usuarios.map((user) => (
            <li
              key={user.id}
              className="flex flex-col items-start justify-between p-4 bg-white border rounded shadow-sm md:flex-row md:items-center"
            >
              <div>
                <p>
                  <strong>{user.name || user.nombre}</strong> - {user.email}
                </p>
                <p className="text-sm">
                  Rol:{" "}
                  <span className="font-semibold text-purple-700">
                    {user.rol || "N/A"}
                  </span>
                </p>
                <p className="text-sm">
                  Cargo:{" "}
                  <span className="font-semibold text-gray-700">
                    {user.cargo || "N/A"}
                  </span>
                </p>
                <p className="text-sm">
                  Área:{" "}
                  <span className="font-semibold text-gray-700">
                    {user.area?.nombre || "N/A"}
                  </span>
                </p>
                <p className="text-sm">
                  Estado:{" "}
                  <span
                    className={`font-semibold ${
                      user.activo ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 mt-3 md:mt-0">
                <button
                  onClick={() => handleEditClick(user)}
                  className="px-4 py-2 text-white bg-green-500 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() =>
                    handleDelete(user.id, user.name || user.nombre)
                  }
                  className="px-4 py-2 text-white bg-red-500 rounded"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => handleToggleActivo(user)}
                  className="px-4 py-2 text-white bg-gray-600 rounded"
                >
                  {user.activo ? "Inactivar" : "Activar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {usuarioAEditar && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          style={{ content: { width: "450px", margin: "auto" } }}
        >
          <h3 className="mb-4 text-xl font-bold">Editar Usuario</h3>
          <UsuarioForm
            initialValues={{
              name: usuarioAEditar.name ?? usuarioAEditar.nombre,
              email: usuarioAEditar.email,
              cargo: usuarioAEditar.cargo,
              areaId: usuarioAEditar.areaId,
              rangoId: usuarioAEditar.rangoId,
              activo: usuarioAEditar.activo,
              rol: usuarioAEditar.rol,
            }}
            areas={areas}
            rangos={rangos}
            onSave={handleSaveEdit}
            onCancel={() => setIsModalOpen(false)}
            disableAdminRole={!canManageAdminRole}
          />
        </Modal>
      )}
    </div>
  );
};

export default GestionUsuariosPage;
