import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canActOnNoteDocument,
  hasAdminOverrideEffective,
} from "../../accessRules";
import DocumentoAlmacenEstadoBadge from "../../components/DocumentoAlmacenEstadoBadge";
import DocumentoFormalEstadoBadge from "../../components/DocumentoFormalEstadoBadge";
import Loader from "../../components/Loader";
import SkeletonTable from "../../components/ui/skeletons/SkeletonTable";
import { useAuth } from "../../context/authContext";
import useInventario from "../../hooks/useInventario";

const ESTADO_PENDIENTE_ALMACEN = "PENDIENTE_APROBACION_ALMACEN";
const NIVEL_ALMACEN = "APROBACION_ALMACEN";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const buildPreviewProductos = (detalles = []) =>
  detalles
    .slice(0, 2)
    .flatMap((detalle) => {
      const label = detalle.producto?.nombre || detalle.producto?.codigo;
      return label ? [label] : [];
    });

const buildResumen = (nota = {}) => ({
  aceptado: nota.resumen?.totalAceptado || 0,
  rechazado: nota.resumen?.totalRechazado || 0,
  pendiente: nota.resumen?.totalPendiente || 0,
});

const BandejaConformidadNotasIngresoPage = () => {
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

  const isAdmin = useMemo(() => hasAdminOverrideEffective(user), [user]);
  const isInitialLoading = loading && result.data.length === 0;

  const cargarBandeja = useCallback(
    async (params = filters) => {
      try {
        const response = await obtenerNotasIngreso({
          ...params,
          estadoDocumentalFormal: ESTADO_PENDIENTE_ALMACEN,
          nivelPendiente: NIVEL_ALMACEN,
          soloPendientesUsuario: isAdmin ? undefined : true,
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
            "No se pudieron obtener las notas de ingreso pendientes de conformidad.",
        );
        setResult({
          data: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        });
      }
    },
    [filters, isAdmin, obtenerNotasIngreso],
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
      <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Bandeja de conformidad de almacén
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              Notas de ingreso pendientes
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Revisa las notas de ingreso registradas por recepción física que
              aún no deben impactar el stock disponible hasta que el jefe de
              almacén otorgue conformidad.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Stock diferido</p>
            <p className="mt-1">
              El ingreso a stock se postea recién cuando la ruta documental
              queda aprobada.
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
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="Buscar por código de NI, OC o proveedor"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
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
                Pendientes de conformidad
              </h2>
              <p className="text-sm text-slate-500">
                {result.totalItems} registro(s) encontrados.
              </p>
            </div>
            <Link
              to="/modulo-almacen/notas-ingreso"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Ver todas las notas
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Orden de compra</th>
                  <th className="px-4 py-3 text-left">Recepcionó</th>
                  <th className="px-4 py-3 text-left">Resumen</th>
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
                      No hay notas de ingreso pendientes de conformidad de
                      almacén.
                    </td>
                  </tr>
                ) : (
                  result.data.map((nota) => {
                    const resumen = buildResumen(nota);
                    const previewProductos = buildPreviewProductos(
                      nota.detalles,
                    );
                    const documentoFormal = nota.documentoFormal || {};
                    const puedeActuar = canActOnNoteDocument(
                      user,
                      documentoFormal,
                    );

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
                        <td className="px-4 py-3 text-slate-700">
                          <p>{nota.responsable?.nombre || "-"}</p>
                          <p className="text-xs text-slate-500">
                            {nota.almacen?.nombre || "Sin almacén"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <div>Aceptado: {resumen.aceptado}</div>
                          <div>Rechazado: {resumen.rechazado}</div>
                          <div>Pendiente: {resumen.pendiente}</div>
                          {previewProductos.length > 0 ? (
                            <div className="mt-1 text-slate-500">
                              {previewProductos.join(", ")}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <DocumentoFormalEstadoBadge
                            estado={documentoFormal.estadoDocumentalFormal}
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            Aprobador:{" "}
                            {documentoFormal.aprobadorAlmacenNombreSnapshot ||
                              "-"}
                          </p>
                          {documentoFormal.requiereConformidadGerenciaSnapshot ? (
                            <p className="mt-1 text-xs text-indigo-600">
                              Luego requiere gerencia usuaria
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/modulo-almacen/notas-ingreso/${nota.id}`}
                            className={`inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${
                              puedeActuar
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {puedeActuar ? "Dar conformidad" : "Ver detalle"}
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

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={loading || result.currentPage <= 1}
          onClick={() => handlePage(result.currentPage - 1)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-indigo-300"
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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-indigo-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default BandejaConformidadNotasIngresoPage;
