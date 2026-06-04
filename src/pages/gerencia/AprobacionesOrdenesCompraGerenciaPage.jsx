import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { hasRole } from "../../utils/userRoles";
import gerenciaApi from "../../api/gerenciaApi";
import OrdenCompraEstadoBadge from "../../components/OrdenCompraEstadoBadge";

const normalizeListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.ordenesCompra)) return response.ordenesCompra;
  return [];
};

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

const resolveNivel = (user) => {
  if (hasRole(user, "GERENTE_GENERAL")) return "GERENCIA_GENERAL";
  return "GERENCIA_ADMINISTRACION";
};

const niveles = [
  { value: "GERENCIA_ADMINISTRACION", label: "Gerencia de Administración" },
  { value: "GERENCIA_GENERAL", label: "Gerencia General" },
];

const AprobacionesOrdenesCompraGerenciaPage = () => {
  const { user } = useAuth();
  const isAdmin = hasRole(user, "ADMINISTRADOR_SISTEMA");
  const [nivel, setNivel] = useState(resolveNivel(user));
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarOrdenes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await gerenciaApi.listarOrdenesCompraAprobaciones({
        nivel,
      });
      setOrdenes(normalizeListResponse(response));
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo cargar la bandeja gerencial de aprobación de Órdenes de Compra.",
      );
    } finally {
      setLoading(false);
    }
  }, [nivel]);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

  const titulo = useMemo(
    () =>
      nivel === "GERENCIA_GENERAL"
        ? "Aprobación de O/C - Gerencia General"
        : "Aprobación de O/C - Gerencia de Administración",
    [nivel],
  );

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Módulo Gerencia
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {titulo}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Bandeja de Órdenes de Compra pendientes según el nivel gerencial.
              La aprobación debe realizarse desde el detalle, respetando la ruta
              snapshot de aprobación.
            </p>
          </div>
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
        </div>

        {isAdmin ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {niveles.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setNivel(item.value)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  nivel === item.value
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {error ? (
          <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Código</th>
                <th className="px-3 py-3 text-left">Proveedor</th>
                <th className="px-3 py-3 text-left">Requerimiento</th>
                <th className="px-3 py-3 text-right">Monto</th>
                <th className="px-3 py-3 text-center">Nivel pendiente</th>
                <th className="px-3 py-3 text-center">Estado</th>
                <th className="px-3 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-slate-500">
                    Cargando aprobaciones pendientes...
                  </td>
                </tr>
              ) : ordenes.length > 0 ? (
                ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {orden.codigo || "-"}
                    </td>
                    <td className="px-3 py-3">
                      {orden.proveedor?.razonSocial || orden.proveedorRazonSocial || "-"}
                    </td>
                    <td className="px-3 py-3">
                      {orden.requerimiento?.codigo || orden.requerimientoCodigo || "-"}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {formatMoney(orden.montoTotal, orden.moneda)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {orden.nivelPendienteActual || nivel}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <OrdenCompraEstadoBadge
                        estado={orden.estadoAprobacion}
                        tipo="aprobacion"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        to={`/ordenes-compra/${orden.id}`}
                        className="rounded border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        Ver / aprobar
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-slate-500">
                    No hay Órdenes de Compra pendientes para este nivel.
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

export default AprobacionesOrdenesCompraGerenciaPage;