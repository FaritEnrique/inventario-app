import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import DocumentoAlmacenEstadoBadge from "../../components/DocumentoAlmacenEstadoBadge";
import DocumentoFormalEstadoBadge from "../../components/DocumentoFormalEstadoBadge";
import Loader from "../../components/Loader";
import SkeletonTable from "../../components/ui/skeletons/SkeletonTable";
import { useAuth } from "../../context/authContext";
import useInventario from "../../hooks/useInventario";

const ESTADO_PENDIENTE_SUBSANACION = "PENDIENTE_SUBSANACION";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const buildResumen = (nota = {}) => ({
  aceptado: nota.resumen?.totalAceptado || 0,
  rechazado: nota.resumen?.totalRechazado || 0,
  pendiente: nota.resumen?.totalPendiente || 0,
});

const getUltimaObservacion = (nota = {}) => {
  const historial = nota.documentoFormal?.historial || [];

  return [...historial]
    .reverse()
    .find((entry) => entry.tipoEvento === "OBSERVACION");
};

const BandejaSubsanacionNotasIngresoPage = () => {
  const { user } = useAuth();
  const { loading, obtenerNotasIngreso } = useInventario();
  const [result, setResult] = useState({
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 12,
  });

  const isInitialLoading = loading && result.data.length === 0;

  const cargarBandeja = useCallback(
    async (params = filters) => {
      try {
        const response = await obtenerNotasIngreso({
          ...params,
          estadoDocumentalFormal: ESTADO_PENDIENTE_SUBSANACION,
          responsableId: user?.id || undefined,
          inventarioPosteado: false,
        });

        setResult(
          response || {
            data: [],
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
          },
        );
      } catch (error) {
        toast.error(
          error.message ||
            "No se pudieron obtener las notas de ingreso pendientes de subsanación.",
        );
        setResult({
          data: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        });
      }
    },
    [filters, obtenerNotasIngreso, user?.id],
  );

  useEffect(() => {
    cargarBandeja({ ...filters, page: 1 });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await cargarBandeja(nextFilters);
  };

  const handlePage = async (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await cargarBandeja(nextFilters);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              Bandeja de subsanación de almacén
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              Notas de ingreso observadas
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Revisa las notas de ingreso observadas por jefatura de almacén o
              gerencia usuaria. Luego de corregir o adjuntar documentación
              complementaria, reenvíalas a la ruta de conformidad.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Stock aún no posteado</p>
            <p className="mt-1">
              Estas notas no impactan el stock disponible hasta que vuelvan a
              ser aprobadas.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto]"
      >
        <input
          type="text"
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="Buscar por código de NI, OC o proveedor"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {loading ? "Consultando…" : "Filtrar"}
        </button>
        <button
          type="button"
          onClick={async () => {
            const resetFilters = { search: "", page: 1, limit: 12 };
            setFilters(resetFilters);
            await cargarBandeja(resetFilters);
          }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </form>

      {loading && result.data.length > 0 ? <Loader size="sm" /> : null}

      {isInitialLoading ? (
        <SkeletonTable columns={7} rows={6} className="rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Pendientes de subsanación
              </h2>
              <p className="text-sm text-slate-500">
                {result.totalItems} registro(s) encontrados.
              </p>
            </div>
            <Link
              to="/modulo-almacen/notas-ingreso/conformidad"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Ver conformidades pendientes
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Orden de compra</th>
                  <th className="px-4 py-3 text-left">Resumen</th>
                  <th className="px-4 py-3 text-left">Última observación</th>
                  <th className="px-4 py-3 text-left">Documental</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {result.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No tienes notas de ingreso pendientes de subsanación.
                    </td>
                  </tr>
                ) : (
                  result.data.map((nota) => {
                    const resumen = buildResumen(nota);
                    const documentoFormal = nota.documentoFormal || {};
                    const ultimaObservacion = getUltimaObservacion(nota);

                    return (
                      <tr
                        key={nota.id}
                        className="border-t border-slate-200 align-top"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {nota.codigo}
                          </p>
                          <div className="mt-2">
                            <DocumentoAlmacenEstadoBadge estado={nota.estado} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatDate(nota.fechaRecepcion)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {nota.ordenCompra ? (
                            <div className="space-y-1">
                              <Link
                                to={`/ordenes-compra/${nota.ordenCompra.id}`}
                                className="font-semibold text-blue-600 hover:text-blue-700"
                              >
                                {nota.ordenCompra.codigo}
                              </Link>
                              <p className="text-xs text-slate-500">
                                {nota.ordenCompra.proveedor?.razonSocial ||
                                  "Sin proveedor"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-500">
                              Sin OC vinculada
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <div>Aceptado: {resumen.aceptado}</div>
                          <div>Rechazado: {resumen.rechazado}</div>
                          <div>Pendiente: {resumen.pendiente}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p className="font-medium text-slate-800">
                            {ultimaObservacion?.actor?.nombre ||
                              ultimaObservacion?.actorNombre ||
                              "Observador"}
                          </p>
                          <p className="mt-1 max-w-xs text-slate-600">
                            {ultimaObservacion?.comentario ||
                              "Sin comentario visible."}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <DocumentoFormalEstadoBadge
                            estado={documentoFormal.estadoDocumentalFormal}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/modulo-almacen/notas-ingreso/${nota.id}`}
                            className="inline-flex rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                          >
                            Subsanar
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={loading || result.currentPage <= 1}
          onClick={() => handlePage(result.currentPage - 1)}
          className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-amber-300 sm:w-auto"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">
          Página {result.currentPage} de {result.totalPages}
        </span>
        <button
          type="button"
          disabled={loading || result.currentPage >= result.totalPages}
          onClick={() => handlePage(result.currentPage + 1)}
          className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-amber-300 sm:w-auto"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default BandejaSubsanacionNotasIngresoPage;
