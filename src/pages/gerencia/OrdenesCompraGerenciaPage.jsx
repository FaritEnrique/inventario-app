import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart } from "lucide-react";
import gerenciaApi from "../../api/gerenciaApi";
import OrdenCompraEstadoBadge from "../../components/OrdenCompraEstadoBadge";

const normalizeListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.ordenesCompra)) return response.ordenesCompra;
  return [];
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatMoney = (value, currency = "PEN") => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  const normalizedCurrency = String(currency || "PEN").toUpperCase();
  const prefix =
    normalizedCurrency === "USD"
      ? "US$"
      : normalizedCurrency === "PEN"
        ? "S/"
        : normalizedCurrency;

  return `${prefix} ${number.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const initialFilters = {
  search: "",
  estadoAprobacion: "",
  estadoRecepcion: "",
  fechaInicio: "",
  fechaFin: "",
};

const OrdenesCompraGerenciaPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarOrdenes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await gerenciaApi.listarOrdenesCompra(appliedFilters);
      setOrdenes(normalizeListResponse(response));
    } catch (err) {
      setError(
        err?.message || "No se pudo cargar la consulta gerencial de Órdenes de Compra.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Módulo Gerencia
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Consulta de Órdenes de Compra
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Consulta gerencial de Órdenes de Compra. Esta vista no permite
          recepcionar, anular ni modificar documentos.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-5">
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Buscar
            </span>
            <input
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Código O/C, proveedor, requerimiento..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase text-slate-500">
              Aprobación
            </span>
            <select
              name="estadoAprobacion"
              value={filters.estadoAprobacion}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="PENDIENTE_APROBACION">Pendiente</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase text-slate-500">
              Recepción
            </span>
            <select
              name="estadoRecepcion"
              value={filters.estadoRecepcion}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="PENDIENTE_RECEPCION">Pendiente</option>
              <option value="PARCIALMENTE_RECIBIDA">Parcial</option>
              <option value="COMPLETAMENTE_RECIBIDA">Completa</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Órdenes de Compra
            </h2>
            <p className="text-sm text-slate-500">
              {loading ? "Cargando..." : `${ordenes.length} orden(es).`}
            </p>
          </div>
          <ShoppingCart className="h-5 w-5 text-indigo-600" />
        </div>

        {error ? (
          <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Código</th>
                <th className="px-3 py-3 text-left">Proveedor</th>
                <th className="px-3 py-3 text-left">Requerimiento</th>
                <th className="px-3 py-3 text-center">Fecha</th>
                <th className="px-3 py-3 text-right">Monto</th>
                <th className="px-3 py-3 text-center">Aprobación</th>
                <th className="px-3 py-3 text-center">Recepción</th>
                <th className="px-3 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center text-slate-500">
                    Cargando Órdenes de Compra...
                  </td>
                </tr>
              ) : ordenes.length > 0 ? (
                ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {formatText(orden.codigo)}
                    </td>
                    <td className="px-3 py-3">
                      <p>{formatText(orden.proveedor?.razonSocial || orden.proveedorRazonSocial)}</p>
                      {orden.proveedor?.ruc || orden.proveedorRuc ? (
                        <p className="text-xs text-slate-500">
                          RUC {orden.proveedor?.ruc || orden.proveedorRuc}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {formatText(orden.requerimiento?.codigo || orden.requerimientoCodigo)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {formatDate(orden.fechaEmision)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {formatMoney(orden.montoTotal, orden.moneda)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <OrdenCompraEstadoBadge
                        estado={orden.estadoAprobacion}
                        tipo="aprobacion"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <OrdenCompraEstadoBadge
                        estado={orden.estadoRecepcion}
                        tipo="recepcion"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        to={`/ordenes-compra/${orden.id}`}
                        className="rounded border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center text-slate-500">
                    No hay Órdenes de Compra para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default OrdenesCompraGerenciaPage;