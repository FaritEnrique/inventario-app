import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { toast } from "react-toastify";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import UsuarioForm from "../components/UsuarioForm";
import { useAuth } from "../context/authContext";
import useDebounce from "../hooks/useDebounce";
import useUsers from "../hooks/useUsers";
import areasApi from "../api/areasApi";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setSearch(debouncedSearchTerm);
    setPage(1);
  }, [debouncedSearchTerm, setSearch, setPage]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await areasApi.getAreas();
        setAreas(response || []);
      } catch (error) {
        console.error("Error al cargar areas:", error);
        toast.error("No se pudieron cargar las areas.");
      }
    };

    fetchAreas();
  }, []);

  const canManageAdminRole =
    currentUser?.rol === "GERENTE_GENERAL" ||
    currentUser?.rol === "ADMINISTRADOR_SISTEMA";

  const handleCrear = async (usuario) => {
    try {
      await crearUsuario(usuario);
      toast.success("Usuario creado con exito.");
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
      toast.success("Usuario actualizado con exito.");
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
        message={`Estas seguro de que quieres desactivar a ${userName}? El usuario no podra acceder al sistema.`}
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
      <h1 className="mb-4 text-2xl font-bold">Gestion de Usuarios</h1>

      <div className="mb-6">
        <UsuarioForm
          areas={areas}
          onSave={handleCrear}
          onCancel={() => {}}
          disableAdminRole={!canManageAdminRole}
        />
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, codigo o email..."
          className="w-full rounded border px-3 py-2"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
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
                className="flex flex-col items-start justify-between rounded border bg-white p-4 shadow-sm md:flex-row md:items-center"
              >
                <div>
                  <p>
                    <strong>{user.name || user.nombre}</strong> - {user.email}
                  </p>
                  <p className="text-sm">
                    Codigo:{" "}
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
                    Area:{" "}
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
                <div className="mt-3 flex gap-2 md:mt-0">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="rounded bg-green-500 px-4 py-2 text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      handleDeactivate(user.id, user.name || user.nombre)
                    }
                    className="rounded bg-red-500 px-4 py-2 text-white"
                  >
                    Desactivar
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
            >
              Anterior
            </button>
            <span>
              Pagina {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
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
