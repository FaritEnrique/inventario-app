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

const ESTADO_PENDIENTE_GERENCIA = "PENDIENTE_CONFORMIDAD_GERENCIA";
const NIVEL_GERENCIA = "CONFORMIDAD_GERENCIA";

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

const BandejaConformidadNotasIngresoGerenciaPage = () => {
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
          estadoDocumentalFormal: ESTADO_PENDIENTE_GERENCIA,
          nivelPendiente: NIVEL_GERENCIA,
          soloPendientesUsuario: isAdmin ? undefined : true,
          inventarioPosteado: false,
          requiereConformidadGerencia: true,
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
            "No se pudieron obtener las notas de ingreso pendientes de conformidad gerencial.",
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
    // Se ejecuta solo al montar la bandeja para evitar recargas dobles por cambio de referencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              Bandeja de conformidad de área usuaria
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              Notas de ingreso pendientes de conformidad
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Revisa las notas de ingreso que almacén marcó con conformidad
              gerencial requerida. El stock disponible se actualizará recién
              cuando se apruebe esta etapa final.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Impacto en stock pendiente</p>
            <p className="mt-1">
              La aprobación de esta bandeja genera el ingreso definitivo al
              stock, siempre que sea la última conformidad pendiente.
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
        <SkeletonTable columns={8} rows={6} className="rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Pendientes de gerencia usuaria
              </h2>
              <p className="text-sm text-slate-500">
                {result.totalItems} registro(s) encontrados.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Volver al dashboard
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Orden / requerimiento</th>
                  <th className="px-4 py-3 text-left">Área usuaria</th>
                  <th className="px-4 py-3 text-left">Recepción</th>
                  <th className="px-4 py-3 text-left">Resumen</th>
                  <th className="px-4 py-3 text-left">Documental</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {result.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No hay notas de ingreso pendientes de conformidad de área
                      usuaria.
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
                    const requerimiento = nota.ordenCompra?.requerimiento;
                    const areaUsuaria = requerimiento?.area;

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
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900">
                              {nota.ordenCompra?.codigo || "Sin OC"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Req.: {requerimiento?.codigo || "No vinculado"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {nota.ordenCompra?.proveedor?.razonSocial ||
                                "Sin proveedor"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p>{areaUsuaria?.nombre || "No registrada"}</p>
                          <p className="text-xs text-slate-500">
                            {areaUsuaria?.abreviatura || "-"}
                          </p>
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
                            Gerente: {" "}
                            {documentoFormal.gerenteConformidadNombreSnapshot ||
                              "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/notas-ingreso/conformidad-gerencia/${nota.id}`}
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

export default BandejaConformidadNotasIngresoGerenciaPage;
