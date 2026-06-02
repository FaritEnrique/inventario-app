import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertasSeguimientoCards,
  AlertasSeguimientoModal,
} from "../components/AlertasSeguimientoLogistico";
import {
  canViewAllCotizacionesLogisticaEffective,
  isLogisticaOperadorEffective,
} from "../accessRules";
import { useAuth } from "../context/authContext";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import {
  filterAlertasByCategory,
  getAlertasByCategoryCount,
  getAlertasSeguimientoCount,
} from "../utils/logisticaAlertasUi";
import { formatInteger } from "../utils/numberFormatters";

const filterOptions = [
  { value: "todas", label: "Todas" },
  { value: "cotizaciones", label: "Cotizaciones" },
  { value: "buenaPro", label: "Buena Pro" },
  { value: "ordenesCompra", label: "Órdenes de Compra" },
];

const resolveBandejaTipo = (user) => {
  if (canViewAllCotizacionesLogisticaEffective(user)) return "jefatura";
  if (isLogisticaOperadorEffective(user)) return "operador";
  return "operador";
};

const AlertasLogisticasPage = () => {
  const { user } = useAuth();
  const { obtenerBandeja, cargando, error } = useLogisticaCotizaciones();
  const [alertas, setAlertas] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [category, setCategory] = useState("todas");

  const bandejaTipo = useMemo(() => resolveBandejaTipo(user), [user]);

  useEffect(() => {
    let cancelled = false;

    obtenerBandeja(bandejaTipo, { page: 1, limit: 6 })
      .then((response) => {
        if (!cancelled) {
          setAlertas(response?.alertas || null);
        }
      })
      .catch(() => {
        if (!cancelled) setAlertas(null);
      });

    return () => {
      cancelled = true;
    };
  }, [bandejaTipo, obtenerBandeja]);

  const filteredAlertas = useMemo(
    () => filterAlertasByCategory(alertas, category),
    [alertas, category],
  );
  const totalAlertas = getAlertasSeguimientoCount(alertas);
  const filteredCount = getAlertasByCategoryCount(alertas, category);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Seguimiento logistico
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Alertas logísticas
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Alertas derivadas de cotizaciones, flujos, Buena Pro y Órdenes de
            Compra segun tu bandeja operativa.
          </p>
        </div>
        <Link
          to={
            bandejaTipo === "jefatura"
              ? "/cotizaciones/bandeja/jefatura"
              : "/cotizaciones/bandeja/operador"
          }
          className="inline-flex justify-center rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Volver a bandeja
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total alertas
          </p>
          <p className="mt-2 text-right text-3xl font-bold tabular-nums text-slate-900">
            {formatInteger(totalAlertas)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vista actual
          </p>
          <p className="mt-2 text-right text-3xl font-bold tabular-nums text-slate-900">
            {formatInteger(filteredCount)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow-sm">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setCategory(option.value);
              setSelectedTipo(null);
            }}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              category === option.value
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {cargando && !alertas ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Cargando alertas logísticas...
        </p>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : filteredCount > 0 ? (
        <AlertasSeguimientoCards
          alertas={filteredAlertas}
          onSelectTipo={setSelectedTipo}
          title="Alertas pendientes"
          description="Abre cada grupo para revisar expedientes y navegar al punto operativo correspondiente."
        />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No hay alertas logísticas pendientes.
        </p>
      )}

      <AlertasSeguimientoModal
        alertas={filteredAlertas}
        tipo={selectedTipo}
        onClose={() => setSelectedTipo(null)}
        buildExpedientePath={(expediente, tipoAlerta) =>
          tipoAlerta === "COBERTURA_INCOMPLETA"
            ? `/cotizaciones/proceso/${expediente.id}/cotizaciones`
            : `/cotizaciones/proceso/${expediente.id}/alertas`
        }
      />
    </div>
  );
};

export default AlertasLogisticasPage;
