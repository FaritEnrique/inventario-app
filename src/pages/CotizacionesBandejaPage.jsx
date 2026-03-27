import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import SolicitudCotizacionForm from "../components/SolicitudCotizacionForm";
import { canAssignCotizacionesLogisticaEffective } from "../accessRules";
import { useAuth } from "../context/authContext";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import useProveedores from "../hooks/useProveedores";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";

const titles = {
  jefatura: "Bandeja de Jefatura de Logistica",
  operador: "Bandeja de Operador de Logistica",
};

const subtitles = {
  jefatura:
    "Supervisa requerimientos aprobados, asigna responsables, define el flujo logistico y emite solicitudes de cotizacion.",
  operador:
    "Trabaja solo los expedientes logisticos que tienes asignados y dejalos listos para decision de jefatura.",
};

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";

const createFlowDraft = (item) => ({
  modalidadFlujoLogistico: item?.modalidadFlujoLogistico || "",
  causalFlujoExcepcional: item?.causalFlujoExcepcional || "",
  justificacionFlujoExcepcional: item?.justificacionFlujoExcepcional || "",
});

const createSolicitudDraft = (requerimientoId, elaboradorId) => ({
  requerimientoId,
  elaboradorId,
  proveedorId: "",
  cuerpoSolicitud: "",
  estado: "Creada",
  items: [],
});

const CotizacionesBandejaPage = ({ tipo }) => {
  const { user } = useAuth();
  const {
    cargando,
    error,
    obtenerBandeja,
    definirFlujo,
    obtenerOperadores,
    asignar,
    iniciar,
  } = useLogisticaCotizaciones();
  const { proveedores } = useProveedores();
  const { crearSolicitud } = useSolicitudesCotizacion({ autoLoad: false });

  const [items, setItems] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [search, setSearch] = useState("");
  const [estadoLogistica, setEstadoLogistica] = useState("");
  const [seleccionOperadores, setSeleccionOperadores] = useState({});
  const [flowDrafts, setFlowDrafts] = useState({});
  const [expandedFlowId, setExpandedFlowId] = useState(null);
  const [expandedSolicitudId, setExpandedSolicitudId] = useState(null);
  const [submittingFlowId, setSubmittingFlowId] = useState(null);
  const [submittingSolicitudId, setSubmittingSolicitudId] = useState(null);

  const canAssign =
    canAssignCotizacionesLogisticaEffective(user) && tipo === "jefatura";

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
        next[item.id] =
          next[item.id] || String(item.responsableLogisticaId || "");
      });
      return next;
    });
    setFlowDrafts((prev) => {
      const next = { ...prev };
      data.forEach((item) => {
        next[item.id] = next[item.id] || createFlowDraft(item);
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
      pendientes: items.filter(
        (item) => item.estadoLogistica === "PENDIENTE_PROCESO"
      ).length,
      enProceso: items.filter((item) => item.estadoLogistica === "EN_PROCESO")
        .length,
      listos: items.filter(
        (item) => item.estadoLogistica === "LISTO_PARA_ADJUDICACION"
      ).length,
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

  const updateFlowDraft = (itemId, nextPartial) => {
    setFlowDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        ...nextPartial,
      },
    }));
  };

  const handleGuardarFlujo = async (item) => {
    const draft = flowDrafts[item.id] || createFlowDraft(item);
    const modalidad = draft.modalidadFlujoLogistico;

    if (!modalidad) {
      toast.error("Debes seleccionar una modalidad de flujo logistico.");
      return;
    }

    if (modalidad === "EXCEPCIONAL" && !draft.causalFlujoExcepcional) {
      toast.error("Debes seleccionar una causal para el flujo excepcional.");
      return;
    }

    if (
      modalidad === "EXCEPCIONAL" &&
      ["URGENCIA", "EMERGENCIA"].includes(draft.causalFlujoExcepcional) &&
      !String(draft.justificacionFlujoExcepcional || "").trim()
    ) {
      toast.error(
        "La justificacion es obligatoria para URGENCIA o EMERGENCIA."
      );
      return;
    }

    setSubmittingFlowId(item.id);
    try {
      await definirFlujo(item.id, {
        modalidadFlujoLogistico: modalidad,
        causalFlujoExcepcional:
          modalidad === "EXCEPCIONAL" ? draft.causalFlujoExcepcional : null,
        justificacionFlujoExcepcional:
          modalidad === "EXCEPCIONAL"
            ? String(draft.justificacionFlujoExcepcional || "").trim() || null
            : null,
      });
      await load();
      setExpandedFlowId(null);
    } finally {
      setSubmittingFlowId(null);
    }
  };

  const handleCreateSolicitud = async (item, payload) => {
    setSubmittingSolicitudId(item.id);
    try {
      await crearSolicitud(payload);
      await load();
      setExpandedSolicitudId(null);
    } finally {
      setSubmittingSolicitudId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{titles[tipo]}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            {subtitles[tipo]}
          </p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total expedientes
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {resumen.total}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pendientes
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {resumen.pendientes}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            En proceso
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {resumen.enProceso}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Listos para decidir
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {resumen.listos}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          value={search}
          name="cotizaciones-bandeja-page-input-134"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por codigo, solicitante o finalidad"
          className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
        />
        <select
          value={estadoLogistica}
          name="cotizaciones-bandeja-page-select-140"
          onChange={(event) => setEstadoLogistica(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Todos los estados logisticos</option>
          <option value="PENDIENTE_PROCESO">Pendiente de proceso</option>
          <option value="ASIGNADO">Asignado</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="LISTO_PARA_ADJUDICACION">
            Listo para adjudicacion
          </option>
          <option value="ADJUDICADO">Adjudicado</option>
          <option value="OC_GENERADA">OC generada</option>
        </select>
      </div>

      {cargando && <Loader />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => {
            const flowDraft = flowDrafts[item.id] || createFlowDraft(item);
            const blocked = ["ADJUDICADO", "OC_GENERADA"].includes(
              item.estadoLogistica
            );
            const hasArtifacts =
              Number(item.resumenComparativo?.totalSolicitudes || 0) > 0 ||
              Number(item.resumenComparativo?.totalCotizaciones || 0) > 0;
            const canQuickDefineFlow = canAssign && !blocked && !hasArtifacts;
            const canQuickCreateSolicitud =
              canAssign &&
              !blocked &&
              item.modalidadFlujoLogistico === "REGULAR";
            const canRegisterCotizaciones =
              item.modalidadFlujoLogistico === "REGULAR" &&
              Number(item.resumenComparativo?.totalSolicitudes || 0) > 0;
            const canOpenComparativo =
              item.modalidadFlujoLogistico === "REGULAR" &&
              Number(item.resumenComparativo?.totalCotizaciones || 0) > 0;

            return (
              <div key={item.id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {item.codigo}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.area?.nombre || item.areaNombreSnapshot} ·{" "}
                      {item.solicitante?.nombre || "-"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.usoFinalidad}
                    </p>
                  </div>
                  <div className="text-right">
                    <CotizacionEstadoBadge
                      estado={item.estadoLogistica}
                      tipo="logistica"
                    />
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {formatCurrency(item.totalReferencial)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Responsable
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.responsableLogistica?.nombre || "Sin asignar"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Asignado por
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.asignadoPorLogistica?.nombre || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Solicitudes / cotizaciones
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.resumenComparativo?.totalSolicitudes || 0} /{" "}
                      {item.resumenComparativo?.totalCotizaciones || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Ultima asignacion
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatDate(item.fechaAsignacionLogistica)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Flujo logistico
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {item.modalidadFlujoLogistico || "Aun no definido"}
                    </p>
                    {item.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                      <p className="mt-1 text-xs text-slate-600">
                        {item.causalFlujoExcepcional || "-"}
                        {item.justificacionFlujoExcepcional
                          ? ` · ${item.justificacionFlujoExcepcional}`
                          : ""}
                      </p>
                    ) : item.modalidadFlujoLogistico === "REGULAR" ? (
                      <p className="mt-1 text-xs text-slate-600">
                        Camino ordinario con solicitudes, cotizaciones y
                        comparativo.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-700">
                        Define si el expediente ira por flujo ordinario o
                        excepcional.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Emision de solicitudes
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {item.resumenComparativo?.totalSolicitudes || 0}{" "}
                      solicitud(es)
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.modalidadFlujoLogistico === "REGULAR"
                        ? "Puedes emitir solicitudes de cotizacion desde esta bandeja."
                        : item.modalidadFlujoLogistico === "EXCEPCIONAL"
                          ? "El flujo excepcional no usa solicitudes ordinarias de cotizacion."
                          : "Primero debes definir el flujo logistico."}
                    </p>
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
                    {canRegisterCotizaciones ? (
                      <Link
                        to={`/cotizaciones/proceso/${item.id}#cotizaciones`}
                        className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Registrar cotizaciones
                      </Link>
                    ) : null}
                    {canOpenComparativo ? (
                      <Link
                        to={`/cotizaciones/proceso/${item.id}#comparativo`}
                        className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                      >
                        Ir a comparativo
                      </Link>
                    ) : null}
                    {tipo === "operador" && item.estadoLogistica === "ASIGNADO" ? (
                      <button
                        type="button"
                        onClick={() => handleStart(item.id)}
                        className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Tomar expediente
                      </button>
                    ) : null}
                    {canAssign ? (
                      <button
                        type="button"
                        onClick={() => handleDirect(item.id)}
                        className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Procesar directamente
                      </button>
                    ) : null}
                    {canQuickDefineFlow ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFlowId((prev) =>
                            prev === item.id ? null : item.id
                          )
                        }
                        className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {expandedFlowId === item.id
                          ? "Ocultar flujo"
                          : item.modalidadFlujoLogistico
                            ? "Editar flujo"
                            : "Definir flujo"}
                      </button>
                    ) : null}
                    {canQuickCreateSolicitud ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSolicitudId((prev) =>
                            prev === item.id ? null : item.id
                          )
                        }
                        className="rounded border border-fuchsia-300 px-4 py-2 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-50"
                      >
                        {expandedSolicitudId === item.id
                          ? "Ocultar solicitud"
                          : "Emitir solicitud"}
                      </button>
                    ) : null}
                  </div>

                  {canAssign ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={seleccionOperadores[item.id] || ""}
                        name="cotizaciones-bandeja-page-select-operator"
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
                  ) : null}
                </div>

                {expandedFlowId === item.id ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Definicion rapida del flujo
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Elige si el expediente seguira el flujo regular o el
                        flujo excepcional.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        value={flowDraft.modalidadFlujoLogistico}
                        onChange={(event) =>
                          updateFlowDraft(item.id, {
                            modalidadFlujoLogistico: event.target.value,
                            causalFlujoExcepcional:
                              event.target.value === "EXCEPCIONAL"
                                ? flowDraft.causalFlujoExcepcional
                                : "",
                            justificacionFlujoExcepcional:
                              event.target.value === "EXCEPCIONAL"
                                ? flowDraft.justificacionFlujoExcepcional
                                : "",
                          })
                        }
                        className="rounded border border-gray-300 px-3 py-2"
                      >
                        <option value="">Selecciona modalidad</option>
                        <option value="REGULAR">REGULAR</option>
                        <option value="EXCEPCIONAL">EXCEPCIONAL</option>
                      </select>

                      {flowDraft.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                        <select
                          value={flowDraft.causalFlujoExcepcional}
                          onChange={(event) =>
                            updateFlowDraft(item.id, {
                              causalFlujoExcepcional: event.target.value,
                            })
                          }
                          className="rounded border border-gray-300 px-3 py-2"
                        >
                          <option value="">Selecciona causal</option>
                          <option value="MENOR_CUANTIA">MENOR_CUANTIA</option>
                          <option value="URGENCIA">URGENCIA</option>
                          <option value="EMERGENCIA">EMERGENCIA</option>
                        </select>
                      ) : null}
                    </div>

                    {flowDraft.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                      <textarea
                        rows="3"
                        value={flowDraft.justificacionFlujoExcepcional}
                        onChange={(event) =>
                          updateFlowDraft(item.id, {
                            justificacionFlujoExcepcional: event.target.value,
                          })
                        }
                        placeholder="Justificacion obligatoria para urgencia o emergencia."
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleGuardarFlujo(item)}
                        disabled={submittingFlowId === item.id}
                        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingFlowId === item.id
                          ? "Guardando..."
                          : "Guardar flujo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedFlowId(null)}
                        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}

                {expandedSolicitudId === item.id ? (
                  <div className="mt-4">
                    <SolicitudCotizacionForm
                      initialData={createSolicitudDraft(
                        item.id,
                        user?.id || null
                      )}
                      proveedores={proveedores.filter(
                        (proveedor) => proveedor.activo !== false
                      )}
                      requerimientos={[
                        {
                          id: item.id,
                          codigo: item.codigo,
                          areaNombreSnapshot:
                            item.area?.nombre || item.areaNombreSnapshot,
                        },
                      ]}
                      requerimientoDetalle={item}
                      onRequerimientoChange={() => {}}
                      onSubmit={(payload) =>
                        handleCreateSolicitud(item, payload)
                      }
                      onCancel={() => setExpandedSolicitudId(null)}
                      submitting={submittingSolicitudId === item.id}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
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
