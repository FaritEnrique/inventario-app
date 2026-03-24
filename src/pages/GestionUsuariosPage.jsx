import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { toast } from "react-toastify";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import UsuarioForm from "../components/UsuarioForm";
import { useAuth } from "../context/authContext";
import useDebounce from "../hooks/useDebounce";
import useUsers from "../hooks/useUsers";
import areasApi from "../api/areasApi";
import {
  canAssignSystemAdminRole,
  canCreateUsers,
  canEditUsers,
  canToggleUserStatus,
} from "../utils/userManagementPermissions";

Modal.setAppElement("#root");

const getUserErrorMessage = (error, fallbackMessage) => {
  if (Array.isArray(error?.validationErrors) && error.validationErrors.length) {
    return error.validationErrors.join(" ");
  }

  return error?.message || fallbackMessage;
};

const GestionUsuariosPage = () => {
  const {
    usuarios,
    cargando: cargandoUsuarios,
    crearUsuario,
    eliminarUsuario,
    actualizarUsuario,
    toggleActivo,
    page,
    totalPages,
    setPage,
    setSearch,
    includeInactive,
    setIncludeInactive,
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

  const canCreate = canCreateUsers(currentUser);
  const canEdit = canEditUsers(currentUser);
  const canToggleStatus = canToggleUserStatus(currentUser);
  const canAssignAdminRole = canAssignSystemAdminRole(currentUser);

  const handleCrear = async (usuario) => {
    try {
      await crearUsuario(usuario);
      toast.success("Usuario creado con exito.");
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      toast.error(getUserErrorMessage(error, "Error al crear usuario."));
      throw error;
    }
  };

  const handleEditClick = (user) => {
    if (!canEdit) return;
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
      toast.error(
        getUserErrorMessage(error, "No se pudieron guardar los cambios.")
      );
      throw error;
    }
  };

  const handleDeactivate = (userId, userName) => {
    if (!canToggleStatus) return;

    toast.info(
      <ConfirmDeleteToast2
        message={`Estas seguro de que quieres desactivar a ${userName}? El usuario no podra acceder al sistema.`}
        onConfirm={async () => {
          try {
            await eliminarUsuario(userId);
            toast.success("Usuario desactivado correctamente");
            cargarUsuarios();
          } catch (error) {
            toast.error(
              getUserErrorMessage(error, "Error al desactivar el usuario")
            );
          }
        }}
        closeToast={() => toast.dismiss()}
      />,
      { autoClose: false }
    );
  };

  const handleReactivate = async (userId, userName) => {
    if (!canToggleStatus) return;

    try {
      await toggleActivo(userId, true);
      toast.success(`${userName} fue reactivado correctamente`);
      cargarUsuarios();
    } catch (error) {
      toast.error(
        getUserErrorMessage(error, "Error al reactivar el usuario")
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Gestion de Usuarios</h1>
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Solo `ADMINISTRADOR_SISTEMA` y `GERENTE_ADMINISTRACION` pueden crear, editar y cambiar el estado de usuarios.
      </div>

      {canCreate ? (
        <div className="mb-6">
          <UsuarioForm
            areas={areas}
            onSave={handleCrear}
            onCancel={() => {}}
            disableAdminRole={!canAssignAdminRole}
          />
        </div>
      ) : null}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, codigo o email..."
          className="w-full rounded border px-3 py-2"
          value={searchTerm}
          name="gestion-usuarios-page-input-135"
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          id="includeInactive"
          type="checkbox"
          checked={includeInactive}
          onChange={(event) => {
            setIncludeInactive(event.target.checked);
            setPage(1);
          }}
        />
        <label htmlFor="includeInactive" className="text-sm text-gray-700">
          Mostrar usuarios inactivos
        </label>
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
                  {Array.isArray(user.userRangos) &&
                  user.userRangos.some((rango) => rango.activo !== false) ? (
                    <p className="text-sm">
                      Rangos adicionales:{" "}
                      <span className="font-semibold text-slate-700">
                        {user.userRangos
                          .filter((rango) => rango.activo !== false)
                          .map((rango) => {
                            const areaNombre =
                              areas.find(
                                (area) =>
                                  String(area.id) === String(rango.areaId)
                              )?.nombre || `Area ${rango.areaId}`;
                            return `${rango.rol} (${areaNombre})`;
                          })
                          .join(" | ")}
                      </span>
                    </p>
                  ) : null}
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
                {canEdit || canToggleStatus ? (
                  <div className="mt-3 flex gap-2 md:mt-0">
                    {canEdit ? (
                      <button
                        onClick={() => handleEditClick(user)}
                        className="rounded bg-green-500 px-4 py-2 text-white"
                      >
                        Editar
                      </button>
                    ) : null}
                    {canToggleStatus ? (
                      user.activo ? (
                        <button
                          onClick={() =>
                            handleDeactivate(user.id, user.name || user.nombre)
                          }
                          className="rounded bg-red-500 px-4 py-2 text-white"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleReactivate(user.id, user.name || user.nombre)
                          }
                          className="rounded bg-blue-600 px-4 py-2 text-white"
                        >
                          Reactivar
                        </button>
                      )
                    ) : null}
                  </div>
                ) : null}
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

      {usuarioAEditar && canEdit ? (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          style={{ content: { width: "720px", maxWidth: "95vw", margin: "auto" } }}
        >
          <h3 className="mb-4 text-xl font-bold">Editar Usuario</h3>
          <UsuarioForm
            initialValues={{
              name: usuarioAEditar.name ?? usuarioAEditar.nombre,
              email: usuarioAEditar.email,
              cargo: usuarioAEditar.cargo,
              areaId: usuarioAEditar.areaId,
              activo: usuarioAEditar.activo,
              rol: usuarioAEditar.rol,
              rangos: (usuarioAEditar.userRangos || []).filter(
                (rango) => rango.activo !== false
              ),
            }}
            areas={areas}
            onSave={handleSaveEdit}
            onCancel={() => setIsModalOpen(false)}
            disableAdminRole={!canAssignAdminRole}
          />
        </Modal>
      ) : null}
    </div>
  );
};

export default GestionUsuariosPage;
