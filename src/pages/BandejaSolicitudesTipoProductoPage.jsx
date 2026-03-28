import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import useSolicitudesTipoProducto from "../hooks/useSolicitudesTipoProducto";
import useTipoProductos from "../hooks/useTipoProductos";

const ESTADO_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "OBSERVADO", label: "Observadas" },
  { value: "HOMOLOGADO", label: "Homologadas" },
  { value: "CREADO", label: "Creadas" },
  { value: "RECHAZADO", label: "Rechazadas" },
];

const FRECUENCIA_OPTIONS = [
  { value: "diaria", label: "Diaria" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
];

const isEditable = (estado) => estado === "PENDIENTE" || estado === "OBSERVADO";

const formatDateTime = (value) => {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BandejaSolicitudesTipoProductoPage = () => {
  const {
    solicitudes,
    loading,
    fetchSolicitudes,
    observarSolicitud,
    homologarSolicitud,
    crearTipoDesdeSolicitud,
    rechazarSolicitud,
  } = useSolicitudesTipoProducto();
  const { tiposProducto, cargando: loadingTiposProducto, fetchTiposProducto } =
    useTipoProductos();

  const [filters, setFilters] = useState({
    estado: "",
    search: "",
  });
  const [acciones, setAcciones] = useState({});

  const tiposProductoActivos = tiposProducto.filter(
    (tipoProducto) => tipoProducto.activo !== false
  );

  const loadData = async (currentFilters = filters) => {
    await fetchSolicitudes(currentFilters);
  };

  useEffect(() => {
    loadData(filters);
  }, [filters.estado, filters.search]);

  useEffect(() => {
    fetchTiposProducto();
  }, []);

  const updateAccion = (solicitudId, changes) => {
    setAcciones((prev) => ({
      ...prev,
      [solicitudId]: {
        comentarioRevision: "",
        tipoProductoId: "",
        prefijo: "",
        frecuenciaReposicion: "mensual",
        ...(prev[solicitudId] || {}),
        ...changes,
      },
    }));
  };

  const getAccion = (solicitudId) => ({
    comentarioRevision: "",
    tipoProductoId: "",
    prefijo: "",
    frecuenciaReposicion: "mensual",
    ...(acciones[solicitudId] || {}),
  });

  const handleResolver = async (callback) => {
    await callback();
    await fetchTiposProducto();
    await loadData(filters);
  };

  return (
    <>
      <Helmet>
        <title>Solicitudes de Tipos de Producto | Sistema de Inventario</title>
      </Helmet>

      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Bandeja de Solicitudes de Tipos
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Revisa, observa, homologa, crea o rechaza solicitudes pendientes
              sin afectar el catalogo maestro oficial.
            </p>
          </div>
          <Link
            to="/gestion-proveedores"
            className="inline-flex rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Volver a proveedores
          </Link>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr,auto]">
            <div>
              <label
                htmlFor="filtro-estado-solicitud"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Estado
              </label>
              <select
                id="filtro-estado-solicitud"
                value={filters.estado}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, estado: event.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ESTADO_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-busqueda-solicitud"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Buscar
              </label>
              <input
                id="filtro-busqueda-solicitud"
                type="text"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder="Buscar por nombre propuesto o proveedor..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => loadData(filters)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Recargar
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow-md">
              Cargando solicitudes...
            </div>
          ) : solicitudes.length > 0 ? (
            solicitudes.map((solicitud) => {
              const accion = getAccion(solicitud.id);

              return (
                <div
                  key={solicitud.id}
                  className="rounded-lg bg-white p-5 shadow-md"
                >
                  <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {solicitud.nombrePropuesto}
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {solicitud.estado}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Proveedor:{" "}
                        {solicitud.proveedor?.razonSocial ||
                          solicitud.proveedorRazonSocialSnapshot ||
                          "Sin proveedor asociado"}
                      </p>
                      <p className="text-sm text-gray-600">
                        RUC:{" "}
                        {solicitud.proveedor?.ruc ||
                          solicitud.proveedorRucSnapshot ||
                          "Sin RUC"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Solicitado por:{" "}
                        {solicitud.solicitadoPor?.nombre || "No registrado"}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>Creado: {formatDateTime(solicitud.createdAt)}</p>
                      <p>Actualizado: {formatDateTime(solicitud.updatedAt)}</p>
                    </div>
                  </div>

                  {solicitud.descripcion ? (
                    <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      {solicitud.descripcion}
                    </div>
                  ) : null}

                  {solicitud.comentarioRevision ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Comentario de revision: {solicitud.comentarioRevision}
                    </div>
                  ) : null}

                  {solicitud.tipoProductoHomologado ? (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      Tipo homologado: {solicitud.tipoProductoHomologado.nombre}
                    </div>
                  ) : null}

                  {solicitud.tipoProductoCreado ? (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      Tipo oficial creado: {solicitud.tipoProductoCreado.nombre}
                    </div>
                  ) : null}

                  {isEditable(solicitud.estado) ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr,1fr]">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Comentario de resolucion
                        </h3>
                        <textarea
                          rows="4"
                          value={accion.comentarioRevision}
                          onChange={(event) =>
                            updateAccion(solicitud.id, {
                              comentarioRevision: event.target.value,
                            })
                          }
                          placeholder="Escribe una observacion, criterio de homologacion o motivo de rechazo."
                          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="mt-3 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleResolver(() =>
                                observarSolicitud(solicitud.id, {
                                  comentarioRevision: accion.comentarioRevision,
                                })
                              )
                            }
                            disabled={loading || !accion.comentarioRevision.trim()}
                            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Observar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleResolver(() =>
                                rechazarSolicitud(solicitud.id, {
                                  comentarioRevision: accion.comentarioRevision,
                                })
                              )
                            }
                            disabled={loading || !accion.comentarioRevision.trim()}
                            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 p-4">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Homologar con tipo existente
                          </h3>
                          <select
                            value={accion.tipoProductoId}
                            onChange={(event) =>
                              updateAccion(solicitud.id, {
                                tipoProductoId: event.target.value,
                              })
                            }
                            disabled={loadingTiposProducto}
                            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecciona un tipo oficial</option>
                            {tiposProductoActivos.map((tipoProducto) => (
                              <option key={tipoProducto.id} value={tipoProducto.id}>
                                {tipoProducto.nombre} ({tipoProducto.prefijo})
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              handleResolver(() =>
                                homologarSolicitud(solicitud.id, {
                                  tipoProductoId: Number(accion.tipoProductoId),
                                  comentarioRevision:
                                    accion.comentarioRevision || undefined,
                                })
                              )
                            }
                            disabled={loading || !accion.tipoProductoId}
                            className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Homologar
                          </button>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-4">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Crear tipo oficial
                          </h3>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">
                                Prefijo
                              </label>
                              <input
                                type="text"
                                maxLength="2"
                                value={accion.prefijo}
                                onChange={(event) =>
                                  updateAccion(solicitud.id, {
                                    prefijo: event.target.value.toUpperCase(),
                                  })
                                }
                                placeholder="Ej. RL"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">
                                Frecuencia
                              </label>
                              <select
                                value={accion.frecuenciaReposicion}
                                onChange={(event) =>
                                  updateAccion(solicitud.id, {
                                    frecuenciaReposicion: event.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {FRECUENCIA_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleResolver(() =>
                                crearTipoDesdeSolicitud(solicitud.id, {
                                  prefijo: accion.prefijo,
                                  frecuenciaReposicion: accion.frecuenciaReposicion,
                                  comentarioRevision:
                                    accion.comentarioRevision || undefined,
                                })
                              )
                            }
                            disabled={loading || accion.prefijo.trim().length !== 2}
                            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Crear tipo oficial
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow-md">
              No hay solicitudes que coincidan con los filtros actuales.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BandejaSolicitudesTipoProductoPage;
