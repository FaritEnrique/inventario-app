import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import RequerimientoEstadoBadge from "../components/RequerimientoEstadoBadge";
import { useAuth } from "../context/authContext";
import useAreas from "../hooks/useAreas";
import useRequerimientos from "../hooks/useRequerimientos";
import {
  canViewAllRequerimientosEffective,
  getTrayEmptyStateEffective,
  getTrayGuidanceEffective,
} from "../accessRules";

const titles = {
  jefatura: "Bandeja de Jefatura",
  "gerencia-area": "Bandeja de Gerencia de Area",
  "gerencia-administracion": "Bandeja de Gerencia de Administracion",
  "gerencia-general": "Bandeja de Gerencia General",
};

const RequerimientosBandejaPage = ({ nivel }) => {
  const { user } = useAuth();
  const { areas } = useAreas();
  const { fetchTray, procesarAprobacion, cargando } = useRequerimientos();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [itemDecisions, setItemDecisions] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    areaId: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchTray(nivel, { page: 1, limit: 50, ...filters });
        setItems(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        toast.error(error.message || "No se pudo cargar la bandeja.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchTray, nivel, filters]);

  const title = useMemo(() => titles[nivel] || "Bandeja de aprobacion", [nivel]);
  const canFilterArea = canViewAllRequerimientosEffective(user);
  const filtersApplied = useMemo(
    () => Object.values(filters).some((value) => String(value || "").trim() !== ""),
    [filters]
  );
  const trayGuidance = useMemo(() => getTrayGuidanceEffective(user, nivel), [nivel, user]);
  const emptyState = useMemo(
    () => getTrayEmptyStateEffective(user, nivel, filtersApplied),
    [filtersApplied, nivel, user]
  );

  const clearFilters = () =>
    setFilters({
      search: "",
      areaId: "",
      fechaDesde: "",
      fechaHasta: "",
    });

  const handleDecision = async (reqId, accion) => {
    try {
      const itemPayload = Object.entries(itemDecisions[reqId] || {})
        .map(([itemId, decision]) => ({
          itemId: Number(itemId),
          decision,
        }))
        .filter((entry) => entry.decision && entry.decision !== "MANTENER");

      const updated = await procesarAprobacion(reqId, {
        accion,
        comentario: comments[reqId] || null,
        items: itemPayload,
      });
      toast.success(
        `Requerimiento ${accion === "APROBAR" ? "aprobado" : "rechazado"} correctamente.`
      );
      setItems((prev) => prev.filter((item) => item.id !== updated.id));
    } catch (error) {
      toast.error(error.message || "No se pudo procesar la aprobacion.");
    }
  };

  if (loading || cargando) return <Loader />;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">Usuario actual: {user?.nombre || "-"}</p>
        </div>
        <Link
          to="/requerimientos"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Volver al listado
        </Link>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 md:col-span-4">
          {trayGuidance}
        </div>
        <input
          value={filters.search}
          name="requerimientos-bandeja-page-input-117" onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
          placeholder="Buscar por codigo, solicitante o item"
        />
        {canFilterArea ? (
          <select
            value={filters.areaId}
            name="requerimientos-bandeja-page-select-124" onChange={(event) => setFilters((prev) => ({ ...prev, areaId: event.target.value }))}
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Todas las areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.branchDescription ? `${area.nombre} - ${area.branchDescription}` : area.nombre}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Area visible: {user?.areaNombre || "-"}
          </div>
        )}
        <input
          type="date"
          value={filters.fechaDesde}
          name="requerimientos-bandeja-page-input-141" onChange={(event) => setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }))}
          className="rounded border border-gray-300 px-3 py-2"
        />
        <input
          type="date"
          value={filters.fechaHasta}
          name="requerimientos-bandeja-page-input-147" onChange={(event) => setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }))}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((req) => (
            <div key={req.id} className="rounded-xl bg-white p-5 shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{req.codigo}</p>
                  <p className="text-sm text-gray-600">
                    {req.areaNombreSnapshot} · {req.solicitante?.nombre || "-"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">Uso: {req.usoFinalidad}</p>
                </div>
                <div className="text-right">
                  <RequerimientoEstadoBadge
                    estadoFlujo={req.estadoFlujo}
                    estadoDocumento={req.estadoDocumento}
                    nivelPendiente={req.nivelPendiente}
                    compact
                  />
                  <p className="mt-2 text-sm font-medium text-gray-700">S/ {(req.totalReferencial || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Subtotal</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Decision item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {req.items
                      .filter((item) => item.activo !== false)
                      .map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-700">{item.descripcionVisible}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {item.cantidadRequerida} {item.unidadMedida}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            S/ {(item.subtotalReferencial || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            <select
                              value={itemDecisions[req.id]?.[item.id] || "MANTENER"}
                              name="requerimientos-bandeja-page-select-201"
                              onChange={(event) =>
                                setItemDecisions((prev) => ({
                                  ...prev,
                                  [req.id]: {
                                    ...(prev[req.id] || {}),
                                    [item.id]: event.target.value,
                                  },
                                }))
                              }
                              className="rounded border border-gray-300 px-2 py-1"
                            >
                              <option value="MANTENER">Mantener</option>
                              <option value="APROBAR">Aprobar</option>
                              <option value="RECHAZAR">Rechazar</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <textarea
                value={comments[req.id] || ""}
                name="requerimientos-bandeja-page-textarea-225"
                onChange={(event) =>
                  setComments((prev) => ({ ...prev, [req.id]: event.target.value }))
                }
                rows="2"
                className="mt-4 w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Comentario de aprobacion o rechazo"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={`/requerimientos/${req.id}`}
                  className="text-sm font-medium text-indigo-700 hover:underline"
                >
                  Ver detalle completo
                </Link>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, "RECHAZAR")}
                    className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, "APROBAR")}
                    className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-gray-700">{emptyState.title}</p>
            <p className="mt-2 text-sm text-gray-500">{emptyState.description}</p>
            {filtersApplied ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequerimientosBandejaPage;

