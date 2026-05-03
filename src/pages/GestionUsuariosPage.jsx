import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import Modal from "../components/Modal";
import UsuarioForm from "../components/UsuarioForm";
import { useAuth } from "../context/authContext";
import useDebounce from "../hooks/useDebounce";
import useUsers from "../hooks/useUsers";
import areasApi from "../api/areasApi";
import {
  canAssignSystemAdminRoleEffective,
  canCreateUsersEffective,
  canEditUsersEffective,
  canToggleUserStatusEffective,
} from "../accessRules";

const getUserErrorMessage = (error, fallbackMessage) => {
  if (Array.isArray(error?.validationErrors) && error.validationErrors.length) {
    return error.validationErrors.join(" ");
  }

  return error?.message || fallbackMessage;
};

const getAreaNombre = (areas, areaId, fallbackArea = null) => {
  const foundArea = areas.find((area) => String(area.id) === String(areaId));
  if (foundArea?.nombre) {
    return foundArea.nombre;
  }

  return fallbackArea?.nombre || `Area ${areaId}`;
};

const formatUserRangos = (user, areas) =>
  Array.isArray(user.userRangos)
    ? user.userRangos
        .filter((rango) => rango.activo !== false)
        .map((rango) => {
          const areaNombre = getAreaNombre(areas, rango.areaId, rango.area);
          return `${rango.rol} (${areaNombre})`;
        })
        .join(" | ")
    : "";

const formatOperationalAssignments = (user, areas) =>
  Array.isArray(user.asignacionesOperativas)
    ? user.asignacionesOperativas
        .filter((assignment) => assignment.activo !== false)
        .map((assignment) => {
          const areaNombre = getAreaNombre(
            areas,
            assignment.areaId,
            assignment.area,
          );
          const tipo = assignment.tipoAsignacion || "RESPONSABILIDAD_OPERATIVA";
          return `${assignment.rol} (${areaNombre}) [${tipo}]`;
        })
        .join(" | ")
    : "";

const USER_CREATION_TOAST_CONTAINER_ID = "gestion-usuarios-creation";
const userCreationToastOptions = {
  containerId: USER_CREATION_TOAST_CONTAINER_ID,
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
        const normalizedAreas = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        setAreas(normalizedAreas);
      } catch (error) {
        console.error("Error al cargar areas:", error);
        toast.error("No se pudieron cargar las áreas.");
      }
    };

    fetchAreas();
  }, []);

  const canCreate = canCreateUsersEffective(currentUser);
  const canEdit = canEditUsersEffective(currentUser);
  const canToggleStatus = canToggleUserStatusEffective(currentUser);
  const canAssignAdminRole = canAssignSystemAdminRoleEffective(currentUser);

  const handleCrear = async (usuario) => {
    try {
      await crearUsuario(usuario);
      toast.success("Usuario creado con éxito.", userCreationToastOptions);
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      toast.error(
        getUserErrorMessage(error, "Error al crear usuario."),
        userCreationToastOptions,
      );
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
      toast.success("Usuario actualizado con éxito.");
      setIsModalOpen(false);
      setUsuarioAEditar(null);
      cargarUsuarios();
    } catch (error) {
      toast.error(
        getUserErrorMessage(error, "No se pudieron guardar los cambios."),
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
            toast.success("Usuario desactivado correctamente.");
            cargarUsuarios();
          } catch (error) {
            toast.error(
              getUserErrorMessage(error, "Error al desactivar el usuario."),
            );
          }
        }}
        closeToast={() => toast.dismiss()}
      />,
      { autoClose: false },
    );
  };

  const handleReactivate = async (userId, userName) => {
    if (!canToggleStatus) return;

    try {
      await toggleActivo(userId, true);
      toast.success(`${userName} fue reactivado correctamente.`);
      cargarUsuarios();
    } catch (error) {
      toast.error(getUserErrorMessage(error, "Error al reactivar el usuario."));
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Gestión de Usuarios</h1>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Solo <code>ADMINISTRADOR_SISTEMA</code> y{" "}
        <code>GERENTE_ADMINISTRACION</code> pueden crear, editar y cambiar el
        estado de usuarios.
      </div>
      <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        Esta vista distingue entre <strong>rol principal</strong>,{" "}
        <strong>rangos adicionales</strong> y{" "}
        <strong>asignaciones operativas explícitas</strong>. Las asignaciones
        operativas ya no deben inferirse desde la estructura de áreas.
      </div>

      <Link
        to="/gestion-areas"
        className="mb-6 flex w-full flex-col gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v6" />
              <path d="M5 21v-4a2 2 0 0 1 2-2h3" />
              <path d="M19 21v-4a2 2 0 0 0-2-2h-3" />
              <path d="M7 7h10" />
              <path d="M12 13v8" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900">
              Configurar areas para usuarios
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Si el usuario que vas a crear o editar todavía no tiene un área
              definida, crea o ajusta primero la unidad organizacional para
              poder asignarla correctamente.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 md:self-center">
          Ir a Gestión de Áreas
          <span aria-hidden="true">→</span>
        </div>
      </Link>

      {canCreate ? (
        <div className="mb-6">
          <UsuarioForm
            areas={areas}
            onSave={handleCrear}
            onCancel={() => {}}
            disableAdminRole={!canAssignAdminRole}
            toastOptions={userCreationToastOptions}
          />
        </div>
      ) : null}

      <div className="mb-4">
        <label
          htmlFor="gestion-usuarios-search"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Buscar usuarios
        </label>
        <input
          id="gestion-usuarios-search"
          type="text"
          placeholder="Buscar por nombre, código o correo electrónico..."
          className="w-full rounded border px-3 py-2"
          value={searchTerm}
          name="search"
          autoComplete="off"
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
            {usuarios.map((user) => {
              const rangosAdicionales = formatUserRangos(user, areas);
              const asignacionesOperativas = formatOperationalAssignments(
                user,
                areas,
              );

              return (
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
                    {rangosAdicionales ? (
                      <p className="text-sm">
                        Rangos adicionales:{" "}
                        <span className="font-semibold text-slate-700">
                          {rangosAdicionales}
                        </span>
                      </p>
                    ) : null}
                    {asignacionesOperativas ? (
                      <p className="text-sm">
                        Asignaciones operativas explicitas:{" "}
                        <span className="font-semibold text-cyan-700">
                          {asignacionesOperativas}
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
                              handleDeactivate(
                                user.id,
                                user.name || user.nombre,
                              )
                            }
                            className="rounded bg-red-500 px-4 py-2 text-white"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleReactivate(
                                user.id,
                                user.name || user.nombre,
                              )
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
              );
            })}
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
          onClose={() => setIsModalOpen(false)}
          title="Editar Usuario"
          maxWidth="max-w-[720px]"
        >
          <div className="mb-4 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            Este formulario sigue administrando el rol principal y los rangos
            adicionales. Las asignaciones operativas explicitas quedaron
            separadas de la estructura y se gestionaran en un paso posterior.
          </div>
          <UsuarioForm
            initialValues={{
              name: usuarioAEditar.name ?? usuarioAEditar.nombre,
              email: usuarioAEditar.email,
              cargo: usuarioAEditar.cargo,
              areaId: usuarioAEditar.areaId,
              activo: usuarioAEditar.activo,
              rol: usuarioAEditar.rol,
              rangos: (usuarioAEditar.userRangos || []).filter(
                (rango) => rango.activo !== false,
              ),
            }}
            areas={areas}
            onSave={handleSaveEdit}
            onCancel={() => setIsModalOpen(false)}
            disableAdminRole={!canAssignAdminRole}
            toastOptions={userCreationToastOptions}
          />
        </Modal>
      ) : null}
      <ToastContainer
        containerId={USER_CREATION_TOAST_CONTAINER_ID}
        position="top-right"
        autoClose={3000}
      />
    </div>
  );
};

export default GestionUsuariosPage;
