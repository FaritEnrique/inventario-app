import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import { useAuth } from "../context/authContext";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import {
  canAssignCotizacionesLogistica,
} from "../utils/cotizacionPermissions";

const titles = {
  jefatura: "Bandeja de Jefatura de Logistica",
  operador: "Bandeja de Operador de Logistica",
};

const subtitles = {
  jefatura:
    "Supervisa requerimientos aprobados, asigna responsables y revisa expedientes listos para adjudicacion.",
  operador:
    "Trabaja solo los expedientes logisticos que tienes asignados y dejalos listos para decision de jefatura.",
};

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

const CotizacionesBandejaPage = ({ tipo }) => {
  const { user } = useAuth();
  const {
    cargando,
    error,
    obtenerBandeja,
    obtenerOperadores,
    asignar,
    iniciar,
  } = useLogisticaCotizaciones();
  const [items, setItems] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [search, setSearch] = useState("");
  const [estadoLogistica, setEstadoLogistica] = useState("");
  const [seleccionOperadores, setSeleccionOperadores] = useState({});

  const canAssign = canAssignCotizacionesLogistica(user) && tipo === "jefatura";

  const load = async () => {
    const response = await obtenerBandeja(tipo, {
      search,
      estadoLogistica,
    });
    const data = Array.isArray(response?.data) ? response.data : [];
    setItems(data);
    setSeleccionOperadores((prev) => {
      const next = { ...prev };
      data.forEach((item) => {
        next[item.id] = next[item.id] || String(item.responsableLogisticaId || "");
      });
      return next;
    });
  };

  useEffect(() => {
    load().catch(() => {});
  }, [tipo, search, estadoLogistica]);

  useEffect(() => {
    if (!canAssign) return;

    obtenerOperadores()
      .then((data) => setOperadores(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [canAssign, obtenerOperadores]);

  const resumen = useMemo(
    () => ({
      total: items.length,
      pendientes: items.filter((item) => item.estadoLogistica === "PENDIENTE_PROCESO").length,
      enProceso: items.filter((item) => item.estadoLogistica === "EN_PROCESO").length,
      listos: items.filter((item) => item.estadoLogistica === "LISTO_PARA_ADJUDICACION").length,
    }),
    [items]
  );

  const handleAssign = async (requerimientoId) => {
    const responsableId = Number(seleccionOperadores[requerimientoId] || 0);
    if (!responsableId) return;
    await asignar(requerimientoId, { responsableId });
    await load();
  };

  const handleDirect = async (requerimientoId) => {
    await asignar(requerimientoId, { responsableId: Number(user.id) });
    await load();
  };

  const handleStart = async (requerimientoId) => {
    await iniciar(requerimientoId);
    await load();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{titles[tipo]}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">{subtitles[tipo]}</p>
        </div>
        <Link
          to="/dashboard"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Volver al dashboard
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total expedientes</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{resumen.total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{resumen.pendientes}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">En proceso</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{resumen.enProceso}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Listos para decidir</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{resumen.listos}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          value={search}
          name="cotizaciones-bandeja-page-input-134" onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por codigo, solicitante o finalidad"
          className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
        />
        <select
          value={estadoLogistica}
          name="cotizaciones-bandeja-page-select-140" onChange={(event) => setEstadoLogistica(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Todos los estados logisticos</option>
          <option value="PENDIENTE_PROCESO">Pendiente de proceso</option>
          <option value="ASIGNADO">Asignado</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="LISTO_PARA_ADJUDICACION">Listo para adjudicacion</option>
          <option value="ADJUDICADO">Adjudicado</option>
          <option value="OC_GENERADA">OC generada</option>
        </select>
      </div>

      {cargando && <Loader />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{item.codigo}</p>
                  <p className="text-sm text-gray-600">
                    {item.area?.nombre || item.areaNombreSnapshot} � {item.solicitante?.nombre || "-"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{item.usoFinalidad}</p>
                </div>
                <div className="text-right">
                  <CotizacionEstadoBadge estado={item.estadoLogistica} tipo="logistica" />
                  <p className="mt-2 text-sm font-medium text-gray-700">{formatCurrency(item.totalReferencial)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Responsable</p>
                  <p className="text-sm text-gray-700">{item.responsableLogistica?.nombre || "Sin asignar"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Asignado por</p>
                  <p className="text-sm text-gray-700">{item.asignadoPorLogistica?.nombre || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Solicitudes / cotizaciones</p>
                  <p className="text-sm text-gray-700">
                    {item.resumenComparativo?.totalSolicitudes || 0} / {item.resumenComparativo?.totalCotizaciones || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ultima asignacion</p>
                  <p className="text-sm text-gray-700">{formatDate(item.fechaAsignacionLogistica)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/cotizaciones/proceso/${item.id}`}
                    className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    Abrir expediente
                  </Link>
                  {tipo === "operador" && item.estadoLogistica === "ASIGNADO" && (
                    <button
                      type="button"
                      onClick={() => handleStart(item.id)}
                      className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                    >
                      Tomar expediente
                    </button>
                  )}
                  {canAssign && (
                    <button
                      type="button"
                      onClick={() => handleDirect(item.id)}
                      className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Procesar directamente
                    </button>
                  )}
                </div>

                {canAssign && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={seleccionOperadores[item.id] || ""}
                      name="cotizaciones-bandeja-page-select-227"
                      onChange={(event) =>
                        setSeleccionOperadores((prev) => ({
                          ...prev,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona operador</option>
                      {operadores.map((operador) => (
                        <option key={operador.id} value={operador.id}>
                          {operador.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAssign(item.id)}
                      disabled={!seleccionOperadores[item.id]}
                      className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item.responsableLogisticaId ? "Reasignar" : "Asignar"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
            No hay expedientes logisticos visibles en esta bandeja.
          </div>
        )}
      </div>
    </div>
  );
};

export default CotizacionesBandejaPage;
