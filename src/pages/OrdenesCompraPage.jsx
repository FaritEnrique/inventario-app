import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canViewOrdenesCompraEffective,
  canViewOrdenCompraApprovalTrayEffective,
} from "../accessRules";
import Loader from "../components/Loader";
import OrdenCompraEstadoBadge from "../components/OrdenCompraEstadoBadge";
import { useAuth } from "../context/authContext";
import useOrdenesCompra from "../hooks/useOrdenesCompra";

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";

const buildRequerimientoRefs = (ordenCompra) =>
  Array.isArray(ordenCompra?.requerimientos) ? ordenCompra.requerimientos : [];

const buildDefaultFilters = (view) => ({
  search: "",
  estadoAprobacion: "",
  estadoRecepcion: "",
  nivel: view === "aprobacion" ? "" : undefined,
});

const viewLabels = {
  listado: {
    title: "Ordenes de compra",
    description:
      "Consulta documental del tramo de compra, aprobacion y recepcion.",
  },
  aprobacion: {
    title: "Bandeja de aprobacion de OC",
    description:
      "Muestra solo las ordenes de compra que hoy puedes aprobar realmente segun el snapshot backend.",
  },
};

const OrdenesCompraPage = () => {
  const { user } = useAuth();
  const {
    loading,
    obtenerBandejaAprobacionOrdenCompra,
    obtenerOrdenesCompra,
  } = useOrdenesCompra();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView =
    searchParams.get("view") === "aprobacion" ? "aprobacion" : "listado";
  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [pageError, setPageError] = useState("");
  const [filters, setFilters] = useState(() => buildDefaultFilters(currentView));
  const filtersRef = useRef(filters);

  const canView = canViewOrdenesCompraEffective(user);
  const canViewApprovalTray = canViewOrdenCompraApprovalTrayEffective(user);

  useEffect(() => {
    setFilters(buildDefaultFilters(currentView));
  }, [currentView]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const load = useCallback(
    async (nextPage = 1, nextFilters = null) => {
      try {
        setPageError("");
        const resolvedFilters = nextFilters || filtersRef.current;
        const response =
          currentView === "aprobacion"
            ? await obtenerBandejaAprobacionOrdenCompra({
                page: nextPage,
                limit: 12,
                search: resolvedFilters.search,
                nivel: resolvedFilters.nivel || undefined,
              })
            : await obtenerOrdenesCompra({
                page: nextPage,
                limit: 12,
                search: resolvedFilters.search,
                estadoAprobacion: resolvedFilters.estadoAprobacion,
                estadoRecepcion: resolvedFilters.estadoRecepcion,
              });

        setRows(Array.isArray(response?.data) ? response.data : []);
        setPageInfo({
          currentPage: response?.currentPage || nextPage,
          totalPages: response?.totalPages || 1,
          totalItems: response?.totalItems || 0,
        });
      } catch (error) {
        const message =
          error.message || "No se pudieron cargar las ordenes de compra.";
        setPageError(message);
        setRows([]);
        setPageInfo({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        });
        toast.error(message);
      }
    },
    [currentView, obtenerBandejaAprobacionOrdenCompra, obtenerOrdenesCompra]
  );

  useEffect(() => {
    if (!canView) return;
    if (currentView === "aprobacion" && !canViewApprovalTray) return;
    load();
  }, [canView, canViewApprovalTray, currentView, load]);

  const resumen = useMemo(
    () => ({
      visibles: rows.length,
      pendientesAprobacion: rows.filter(
        (row) => row.estadoAprobacion === "PENDIENTE_APROBACION"
      ).length,
      pendientesRecepcion: rows.filter(
        (row) => Number(row?.resumen?.totalPendiente || 0) > 0
      ).length,
    }),
    [rows]
  );

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await load(1, filters);
  };

  const handlePage = async (nextPage) => {
    await load(nextPage);
  };

  const switchView = (view) => {
    const next = new URLSearchParams(searchParams);
    if (view === "aprobacion") {
      next.set("view", "aprobacion");
    } else {
      next.delete("view");
    }
    setSearchParams(next, { replace: true });
  };

  if (!canView) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Tu usuario no tiene acceso disponible para consultar ordenes de compra.
        </div>
      </div>
    );
  }

  if (currentView === "aprobacion" && !canViewApprovalTray) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Tu usuario no tiene bandeja de aprobacion de ordenes de compra.
        </div>
      </div>
    );
  }

  const labels = viewLabels[currentView];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{labels.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{labels.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => switchView("listado")}
            className={`rounded px-4 py-2 text-sm font-medium ${
              currentView === "listado"
                ? "bg-indigo-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Listado general
          </button>
          {canViewApprovalTray ? (
            <button
              type="button"
              onClick={() => switchView("aprobacion")}
              className={`rounded px-4 py-2 text-sm font-medium ${
                currentView === "aprobacion"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Mi bandeja de aprobacion
            </button>
          ) : null}
          <Link
            to="/inventario-recepciones"
            className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Recepciones
          </Link>
          <Link
            to="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Visibles en pagina
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{resumen.visibles}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pendientes de aprobacion
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {resumen.pendientesAprobacion}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Con saldo por recepcionar
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {resumen.pendientesRecepcion}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <input
          value={filters.search}
          onChange={(event) => handleFilterChange("search", event.target.value)}
          placeholder="Buscar por codigo, proveedor o RUC"
          className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
        />
        {currentView === "listado" ? (
          <>
            <select
              value={filters.estadoAprobacion}
              onChange={(event) =>
                handleFilterChange("estadoAprobacion", event.target.value)
              }
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Todos los estados de aprobacion</option>
              <option value="BORRADOR">Borrador</option>
              <option value="PENDIENTE_APROBACION">Pendiente aprobacion</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
            <select
              value={filters.estadoRecepcion}
              onChange={(event) =>
                handleFilterChange("estadoRecepcion", event.target.value)
              }
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Todos los estados de recepcion</option>
              <option value="PENDIENTE_RECEPCION">Pendiente recepcion</option>
              <option value="PARCIALMENTE_RECIBIDA">Parcialmente recibida</option>
              <option value="COMPLETAMENTE_RECIBIDA">Completamente recibida</option>
              <option value="CERRADA">Cerrada</option>
              <option value="INCUMPLIDA">Incumplida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </>
        ) : (
          <select
            value={filters.nivel || ""}
            onChange={(event) => handleFilterChange("nivel", event.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Todos los niveles</option>
            <option value="GERENCIA_ADMINISTRACION">Gerencia de administracion</option>
            <option value="GERENCIA_GENERAL">Gerencia general</option>
          </select>
        )}
        <div className="md:col-span-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {loading ? "Consultando..." : "Aplicar filtros"}
          </button>
        </div>
      </form>

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {loading ? <Loader /> : null}

      <div className="space-y-4 md:hidden">
        {rows.length > 0 ? (
          rows.map((ordenCompra) => (
            <div key={ordenCompra.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{ordenCompra.codigo}</p>
                  <p className="text-sm text-gray-600">
                    {ordenCompra.proveedor?.razonSocial || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(ordenCompra.montoTotal)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(ordenCompra.fechaEmision)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <OrdenCompraEstadoBadge
                  estado={ordenCompra.estadoAprobacion}
                  tipo="aprobacion"
                />
                <OrdenCompraEstadoBadge
                  estado={ordenCompra.estadoRecepcion}
                  tipo="recepcion"
                />
              </div>
              {ordenCompra.nivelPendienteActual ? (
                <p className="mt-3 text-sm text-gray-700">
                  Nivel pendiente: {ordenCompra.nivelPendienteActual}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/ordenes-compra/${ordenCompra.id}`}
                  className="rounded border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
                >
                  Abrir detalle
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
            No hay ordenes de compra para los filtros aplicados.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Orden
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Estados
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Nivel pendiente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Requerimientos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Totales
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.length > 0 ? (
                rows.map((ordenCompra) => {
                  const requerimientos = buildRequerimientoRefs(ordenCompra);
                  return (
                    <tr key={ordenCompra.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{ordenCompra.codigo}</p>
                        <p className="text-xs text-gray-500">
                          Emitida: {formatDate(ordenCompra.fechaEmision)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p>{ordenCompra.proveedor?.razonSocial || "-"}</p>
                        <p className="text-xs text-gray-500">
                          {ordenCompra.proveedor?.ruc || "Sin RUC"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-col gap-2">
                          <OrdenCompraEstadoBadge
                            estado={ordenCompra.estadoAprobacion}
                            tipo="aprobacion"
                          />
                          <OrdenCompraEstadoBadge
                            estado={ordenCompra.estadoRecepcion}
                            tipo="recepcion"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {ordenCompra.nivelPendienteActual || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {requerimientos.length > 0 ? (
                          <div className="space-y-1">
                            {requerimientos.slice(0, 3).map((requerimiento) => (
                              <Link
                                key={requerimiento.id}
                                to={`/requerimientos/${requerimiento.id}`}
                                className="block text-indigo-600 hover:text-indigo-700"
                              >
                                {requerimiento.codigo}
                              </Link>
                            ))}
                            {requerimientos.length > 3 ? (
                              <p className="text-xs text-gray-500">
                                +{requerimientos.length - 3} mas
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-gray-500">Sin referencia visible</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(ordenCompra.montoTotal)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pendiente: {Number(ordenCompra?.resumen?.totalPendiente || 0)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <Link
                          to={`/ordenes-compra/${ordenCompra.id}`}
                          className="rounded border border-indigo-300 px-3 py-1.5 text-indigo-700 hover:bg-indigo-50"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No hay ordenes de compra para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Total backend: {pageInfo.totalItems} registros
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePage(pageInfo.currentPage - 1)}
            disabled={loading || pageInfo.currentPage <= 1}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Pagina {pageInfo.currentPage} de {pageInfo.totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePage(pageInfo.currentPage + 1)}
            disabled={loading || pageInfo.currentPage >= pageInfo.totalPages}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdenesCompraPage;
