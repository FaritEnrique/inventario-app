// src/pages/GestionUsuariosPage.jsx
import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import useUsers from "../hooks/useUsers";
import apiFetch from "../api/apiFetch";
import areasApi from "../api/areasApi"; // 💡 Importación de areasApi
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import UsuarioForm from "../components/UsuarioForm";
import useDebounce from "../hooks/useDebounce";

Modal.setAppElement("#root");

const GestionUsuariosPage = () => {
  const {
    usuarios,
    cargando: cargandoUsuarios,
    crearUsuario,
    eliminarUsuario,
    actualizarUsuario,
    page,
    totalPages,
    setPage,
    setSearch,
    cargarUsuarios,
  } = useUsers();

  const { user: currentUser } = useAuth();

  const [areas, setAreas] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  const [cargandoRangos, setCargandoRangos] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setSearch(debouncedSearchTerm);
    setPage(1); // Reset page when searching
  }, [debouncedSearchTerm, setSearch, setPage]);

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [areasResponse, rangosResponse] = await Promise.all([
          areasApi.getAreas(), // 🎯 SOLUCIÓN: Usar la función específica
          apiFetch("rangos"),
        ]);
        setAreas(areasResponse || []);
        setRangos(rangosResponse || []);
      } catch (err) {
        // Mejor manejo del error en la consola
        console.error("Error al cargar áreas y/o rangos:", err);
        toast.error("❌ No se pudieron cargar las áreas y/o rangos.");
      } finally {
        setCargandoAreas(false);
        setCargandoRangos(false);
      }
    };
    fetchSelectData();
  }, []); // Dependencias: [] para cargar solo al montar el componente

  const canManageAdminRole =
    currentUser?.rol === "GERENTE_GENERAL" ||
    currentUser?.rol === "ADMINISTRADOR_SISTEMA";

  const handleCrear = async (usuario) => {
    try {
      await crearUsuario(usuario);
      toast.success("Usuario creado con éxito!");
      cargarUsuarios();
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
      cargarUsuarios();
    } catch (error) {
      toast.error(error.message || "No se pudieron guardar los cambios.");
      throw error;
    }
  };

  const handleDeactivate = (userId, userName) => {
    toast.info(
      <ConfirmDeleteToast2
        message={`¿Estás seguro de que quieres desactivar a ${userName}? El usuario no podrá acceder al sistema.`}
        onConfirm={async () => {
          try {
            await eliminarUsuario(userId);
            toast.success("Usuario desactivado correctamente");
            cargarUsuarios();
          } catch (error) {
            toast.error(error.message || "Error al desactivar el usuario");
          }
        }}
        closeToast={() => toast.dismiss()}
      />,
      { autoClose: false }
    );
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

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, código o email..."
          className="w-full px-3 py-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {cargandoUsuarios ? (
        <p>Cargando...</p>
      ) : (
        <>
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
                    Código:{" "}
                    <span className="font-semibold text-blue-700">
                      {user.codigoUsuario || "N/A"}
                    </span>
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
                      handleDeactivate(user.id, user.name || user.nombre)
                    }
                    className="px-4 py-2 text-white bg-red-500 rounded"
                  >
                    Desactivar
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-white bg-blue-500 rounded disabled:bg-gray-400"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 text-white bg-blue-500 rounded disabled:bg-gray-400"
            >
              Siguiente
            </button>
          </div>
        </>
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
