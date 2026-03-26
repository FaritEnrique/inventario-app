import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import RequerimientoEstadoBadge from "../components/RequerimientoEstadoBadge";
import { useAuth } from "../context/authContext";
import useAreas from "../hooks/useAreas";
import useRequerimientos from "../hooks/useRequerimientos";
import {
  canSelectAreaRequerimientoEffective,
  getAvailableApprovalTraysEffective,
} from "../accessRules";

const initialFilters = {
  search: "",
  areaId: "",
  prioridad: "",
  estadoFlujo: "",
  estadoDocumento: "",
  fechaDesde: "",
  fechaHasta: "",
};

const RequerimientosPage = () => {
  const { user } = useAuth();
  const { areas } = useAreas();
  const {
    requerimientos,
    fetchRequerimientos,
    cargando,
    error,
    pagination,
    prioridades,
  } = useRequerimientos();
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchRequerimientos(filters).catch(() => {});
  }, [fetchRequerimientos, filters]);

  const trays = useMemo(() => getAvailableApprovalTraysEffective(user), [user]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Requerimientos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Documento que inicia el proceso de compra o abastecimiento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {trays.map((tray) => (
            <Link
              key={tray.key}
              to={tray.path}
              className="rounded border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              {tray.label}
            </Link>
          ))}
          <Link
            to="/requerimientos/nuevo"
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Nuevo requerimiento
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-6">
        <input
          value={filters.search}
          name="requerimientos-page-input-71"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          placeholder="Buscar por codigo, item o solicitante"
          className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
        />
        {canSelectAreaRequerimientoEffective(user) ? (
          <select
            value={filters.areaId}
            name="requerimientos-page-select-80"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, areaId: event.target.value }))
            }
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Todas las areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.branchDescription
                  ? `${area.nombre} - ${area.branchDescription}`
                  : area.nombre}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Area visible: {user?.areaNombre || "-"}
          </div>
        )}
        <select
          value={filters.prioridad}
          name="requerimientos-page-select-101"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, prioridad: event.target.value }))
          }
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Todas las prioridades</option>
          {prioridades.map((prioridad) => (
            <option key={prioridad} value={prioridad}>
              {prioridad}
            </option>
          ))}
        </select>
        <select
          value={filters.estadoFlujo}
          name="requerimientos-page-select-115"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, estadoFlujo: event.target.value }))
          }
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Todos los flujos</option>
          <option value="GENERADO">Generado</option>
          <option value="APROBADO_JEFATURA">Aprobado Jefatura</option>
          <option value="APROBADO_GERENCIA_AREA">Aprobado Gerencia Area</option>
          <option value="APROBADO_GERENCIA_ADMINISTRACION">Aprobado Gerencia Administracion</option>
          <option value="APROBADO_GERENCIA_GENERAL">Aprobado Gerencia General</option>
        </select>
        <select
          value={filters.estadoDocumento}
          name="requerimientos-page-select-129"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, estadoDocumento: event.target.value }))
          }
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Todos los documentos</option>
          <option value="GENERADO">Generado</option>
          <option value="APROBADO_SIN_MODIFICACIONES">Aprobado sin modificaciones</option>
          <option value="APROBADO_CON_MODIFICACIONES">Aprobado con modificaciones</option>
          <option value="ANULADO">Anulado</option>
        </select>
        <input
          type="date"
          value={filters.fechaDesde}
          name="requerimientos-page-input-142"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }))
          }
          className="rounded border border-gray-300 px-3 py-2"
        />
        <input
          type="date"
          value={filters.fechaHasta}
          name="requerimientos-page-input-150"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }))
          }
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {cargando && <Loader />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Codigo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Area</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Solicitante</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {requerimientos.length > 0 ? (
              requerimientos.map((req) => (
                <tr key={req.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{req.codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{req.areaNombreSnapshot}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{req.solicitante?.nombre || "-"}</td>
                  <td className="px-4 py-3">
                    <RequerimientoEstadoBadge
                      estadoFlujo={req.estadoFlujo}
                      estadoDocumento={req.estadoDocumento}
                      nivelPendiente={req.nivelPendiente}
                      compact
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">S/ {(req.totalReferencial || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {req.fechaCreacion ? new Date(req.fechaCreacion).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Link to={`/requerimientos/${req.id}`} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50">
                        Ver
                      </Link>
                      {req.estadoDocumento === "GENERADO" && (
                        <Link
                          to={`/requerimientos/${req.id}/editar`}
                          className="rounded border border-indigo-300 px-3 py-1 text-indigo-700 hover:bg-indigo-50"
                        >
                          Editar
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-sm text-gray-500">
                  No hay requerimientos visibles con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-gray-500">{pagination.totalItems} requerimientos encontrados.</p>
    </div>
  );
};

export default RequerimientosPage;


