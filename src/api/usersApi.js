// src/api/usersApi.js
import apiFetch from "./apiFetch";

const normalizeRangosPayload = (rangos = []) =>
  (Array.isArray(rangos) ? rangos : [])
    .filter(
      (rango) =>
        rango &&
        rango.rol &&
        rango.areaId !== "" &&
        rango.areaId !== null &&
        rango.areaId !== undefined,
    )
    .map((rango) => ({
      rol: rango.rol,
      areaId: Number(rango.areaId),
      activo: rango.activo !== false,
      branchDescription: rango.branchDescription?.trim() || undefined,
    }));

const normalizeUsersResponse = (response, fallbackPage = 1) =>
  Array.isArray(response)
    ? { usuarios: response, totalPages: 1, currentPage: 1 }
    : {
        usuarios: response?.usuarios || response?.data || response || [],
        totalPages:
          response?.totalPages ||
          Math.max(
            1,
            Math.ceil(
              (response?.totalItems ||
                (Array.isArray(response)
                  ? response.length
                  : response?.data?.length || 0)) / 10
            )
          ),
        currentPage: response?.currentPage || response?.page || fallbackPage,
      };

const serializeUserPayload = (usuario = {}) => {
  const payload = { ...usuario };

  if ("name" in payload && !("nombre" in payload)) {
    payload.nombre = payload.name;
  }

  if ("areaId" in payload && payload.areaId !== "") {
    payload.areaId = Number(payload.areaId);
  }

  if (typeof payload.password === "string" && !payload.password.trim()) {
    delete payload.password;
  }

  if ("rangos" in payload) {
    payload.rangos = normalizeRangosPayload(payload.rangos);
  }

  delete payload.name;
  delete payload.rangoId;
  delete payload.userRangos;

  return payload;
};

const usersApi = {
  // obtenerTodos acepta un objeto opcional { page, search }
  obtenerTodos: async ({
    page = 1,
    search = "",
    includeInactive = false,
  } = {}) => {
    const q = [];
    if (page) q.push(`page=${page}`);
    if (search) q.push(`search=${encodeURIComponent(search)}`);
    if (includeInactive) q.push("includeInactive=true");
    const query = q.length ? `?${q.join("&")}` : "";
    // backend puede devolver array o { usuarios, totalPages, currentPage, totalItems }
    return apiFetch(`usuarios${query}`, { sessionActivity: "interactive" });
  },

  obtenerTodosPaginados: async ({
    search = "",
    includeInactive = false,
  } = {}) => {
    const firstPage = await usersApi.obtenerTodos({
      page: 1,
      search,
      includeInactive,
    });
    const normalizedFirstPage = normalizeUsersResponse(firstPage, 1);
    const totalPages = Number(normalizedFirstPage.totalPages || 1);
    let usuarios = Array.isArray(normalizedFirstPage.usuarios)
      ? normalizedFirstPage.usuarios
      : [];

    if (totalPages <= 1) {
      return usuarios;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        usersApi.obtenerTodos({
          page: index + 2,
          search,
          includeInactive,
        })
      )
    );

    remainingPages.forEach((pageResponse, index) => {
      const normalizedPage = normalizeUsersResponse(pageResponse, index + 2);
      usuarios = usuarios.concat(
        Array.isArray(normalizedPage.usuarios) ? normalizedPage.usuarios : []
      );
    });

    return usuarios;
  },

  obtenerPorId: async (id) => {
    return apiFetch(`usuarios/${id}`, { sessionActivity: "interactive" });
  },

  crear: async (usuario) => {
    return apiFetch("usuarios", {
      method: "POST",
      body: JSON.stringify(serializeUserPayload(usuario)),
      sessionActivity: "interactive",
    });
  },

  actualizar: async (id, usuario) => {
    return apiFetch(`usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(serializeUserPayload(usuario)),
      sessionActivity: "interactive",
    });
  },

  eliminar: async (id) => {
    return apiFetch(`usuarios/${id}`, {
      method: "DELETE",
      sessionActivity: "interactive",
    });
  },

  // patch para cambiar solo estado activo/inactivo
  toggleActivo: async (id, activo) => {
    return apiFetch(`usuarios/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ activo }),
      sessionActivity: "interactive",
    });
  },
};

export default usersApi;
