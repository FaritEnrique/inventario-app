// src/pages/almacen/dashboard/DashboardNotasSalidaPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowUpCircle, FileText, Search, X } from "lucide-react";
import inventarioApi from "../../../api/inventarioApi";
import DashboardDetalleHeader from "../../../components/almacen/dashboard/DashboardDetalleHeader";
import DashboardEmptyState from "../../../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../../../components/almacen/dashboard/DashboardMetricCard";
import DashboardPagination from "../../../components/almacen/dashboard/DashboardPagination";
import DashboardReportActions from "../../../components/almacen/dashboard/DashboardReportActions";
import {
PAGE_SIZE,
buildSearchParams,
formatDate,
formatNumber,
getProductoLabel,
normalizePagedResponse,
normalizeText,
paginateRows,
} from "./dashboardDetalleUtils";

const buildPreviewProductos = (detalles = []) =>
detalles
.slice(0, 2)
.map((detalle) => getProductoLabel(detalle.producto))
.join("; ");

const getNotaCodigo = (nota) =>
nota.codigo || nota.codigoNotaSalida || "Salida #" + nota.id;

const getNotaFecha = (nota) =>
nota.fechaMovimiento || nota.fechaDocumento || nota.createdAt;

const getNotaReferencia = (nota) =>
nota.ordenCompra?.codigo || nota.referenciaCodigo || "-";

const getNotaEstado = (nota) => nota.estado || nota.estadoDocumento || "-";

const notasSalidaReportColumns = [
{
header: "Nota",
value: (row) => row.codigo || "-",
width: 20,
},
{
header: "Fecha",
value: (row) => row.fecha || "-",
align: "center",
headerAlign: "center",
width: 16,
},
{
header: "Referencia",
value: (row) => row.referencia || "-",
width: 24,
},
{
header: "Productos",
value: (row) => row.productos || "-",
width: 46,
},
{
header: "Estado",
value: (row) => row.estado || "-",
align: "center",
headerAlign: "center",
width: 18,
},
];

const DashboardNotasSalidaPage = () => {
const [searchParams, setSearchParams] = useSearchParams();
const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(false);
const [search, setSearch] = useState(() => searchParams.get("search") || "");
const [fechaDesde, setFechaDesde] = useState(
searchParams.get("fechaDesde") || "",
);
const [fechaHasta, setFechaHasta] = useState(
searchParams.get("fechaHasta") || "",
);
const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);

const cargarNotas = useCallback(async () => {
setLoading(true);

try {
  const response = await inventarioApi.obtenerNotasSalida({
    page: 1,
    limit: 100,
  });

  setRows(normalizePagedResponse(response).data);
} catch (error) {
  toast.error(
    error.message || "No se pudieron cargar las notas de salida.",
  );
  setRows([]);
} finally {
  setLoading(false);
}

}, []);

useEffect(() => {
cargarNotas();
}, [cargarNotas]);

const filteredRows = useMemo(() => {
const searchFilter = normalizeText(search);
const desde = fechaDesde ? Date.parse(fechaDesde) : null;
const hasta = fechaHasta ? Date.parse(fechaHasta) : null;

return rows.filter((nota) => {
  const fecha = Date.parse(getNotaFecha(nota));
  const productosPreview = buildPreviewProductos(
    nota.detalles || nota.items || [],
  );

  const text = normalizeText(
    [
      nota.codigo || "",
      nota.codigoNotaSalida || "",
      nota.referenciaCodigo || "",
      nota.ordenCompra?.codigo || "",
      productosPreview,
    ].join(" "),
  );

  if (searchFilter && !text.includes(searchFilter)) return false;
  if (desde && Number.isFinite(fecha) && fecha < desde) return false;
  if (hasta && Number.isFinite(fecha) && fecha > hasta + 86_399_999) {
    return false;
  }

  return true;
});

}, [fechaDesde, fechaHasta, rows, search]);

const reportRows = useMemo(
() =>
filteredRows.map((nota) => ({
codigo: getNotaCodigo(nota),
fecha: formatDate(getNotaFecha(nota)),
referencia: getNotaReferencia(nota),
productos: buildPreviewProductos(nota.detalles || nota.items || []),
estado: getNotaEstado(nota),
})),
[filteredRows],
);

const {
rows: paginatedRows,
totalPages,
currentPage,
} = paginateRows(filteredRows, page, PAGE_SIZE);

const syncParams = (nextPage = 1) => {
setSearchParams(
buildSearchParams({
search: search.trim(),
fechaDesde,
fechaHasta,
page: nextPage > 1 ? nextPage : "",
}),
{ replace: true },
);
};

const handleSubmit = (event) => {
event.preventDefault();
setPage(1);
syncParams(1);
};

const handleReset = () => {
setSearch("");
setFechaDesde("");
setFechaHasta("");
setPage(1);
setSearchParams({}, { replace: true });
};

const handlePageChange = (nextPage) => {
const safePage = Math.min(Math.max(nextPage, 1), totalPages);
setPage(safePage);
syncParams(safePage);
};

return (
  <section className="space-y-6">
    <DashboardDetalleHeader
      badge="Detalle del dashboard"
      title="Notas de salida"
      description="Consulta propia del dashboard para revisar documentos de salida antes de ingresar a la vista operativa o al detalle documental."
      icon={ArrowUpCircle}
      loading={loading}
      onRefresh={cargarNotas}
    >
      <DashboardReportActions
        title="Notas de salida"
        subtitle={
          "Documentos de salida filtrados. Registros: " + reportRows.length
        }
        rows={reportRows}
        columns={notasSalidaReportColumns}
        fileName="dashboard-notas-salida"
        sheetName="Notas de salida"
        disabled={loading}
      />
    </DashboardDetalleHeader>

    <div className="grid gap-4 sm:grid-cols-2">
    <DashboardMetricCard
      title="Notas cargadas"
      value={formatNumber(rows.length)}
      description="Total de notas de salida consultadas."
      icon={ArrowUpCircle}
      tone="rose"
    />

    <DashboardMetricCard
      title="Resultado filtrado"
      value={formatNumber(filteredRows.length)}
      description="Registros coincidentes con búsqueda y periodo."
      icon={FileText}
      tone="indigo"
    />
  </div>

  <form
    onSubmit={handleSubmit}
    className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.4fr_1fr_1fr_auto]"
  >
    <input
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      className="px-3 py-2 text-sm border outline-none rounded-xl border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
      placeholder="Código, nota de pedido, referencia o producto"
    />

    <input
      type="date"
      value={fechaDesde}
      onChange={(event) => setFechaDesde(event.target.value)}
      className="px-3 py-2 text-sm border outline-none rounded-xl border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
    />

    <input
      type="date"
      value={fechaHasta}
      onChange={(event) => setFechaHasta(event.target.value)}
      className="px-3 py-2 text-sm border outline-none rounded-xl border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
    />

    <div className="flex gap-2">
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
      >
        <Search className="w-4 h-4" />
        Buscar
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="px-3 border rounded-xl border-slate-300 text-slate-600 hover:bg-slate-50"
        aria-label="Limpiar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </form>

  {filteredRows.length === 0 ? (
    <DashboardEmptyState
      title="Sin notas de salida"
      description="No hay documentos que coincidan con los filtros aplicados."
    />
  ) : (
    <div className="space-y-4">
      <DashboardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredRows.length}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      <div className="overflow-x-auto bg-white border shadow-sm rounded-2xl border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="text-xs tracking-wide uppercase bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-center">Nota</th>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-center">Referencia</th>
              <th className="px-4 py-3 text-center">Productos</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((nota) => (
              <tr key={nota.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-black text-slate-800">
                  {getNotaCodigo(nota)}
                </td>

                <td className="px-4 py-3 text-center">
                  {formatDate(getNotaFecha(nota))}
                </td>

                <td className="px-4 py-3">{getNotaReferencia(nota)}</td>

                <td className="px-4 py-3">
                  {buildPreviewProductos(
                    nota.detalles || nota.items || [],
                  ) || "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 text-xs font-black rounded-full bg-rose-100 text-rose-700">
                    {getNotaEstado(nota)}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <Link
                    to={"/modulo-almacen/notas-salida/" + nota.id}
                    className="font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</section>

);
};

export default DashboardNotasSalidaPage;