import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import DocumentoAlmacenEstadoBadge from "../components/DocumentoAlmacenEstadoBadge";
import DocumentoFormalEstadoBadge from "../components/DocumentoFormalEstadoBadge";
import Loader from "../components/Loader";
import ProductoSearchField from "../components/ProductoSearchField";
import useInventario from "../hooks/useInventario";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";

const buildInitialProducto = (searchParams) =>
  searchParams.get("productoId")
    ? {
        id: Number(searchParams.get("productoId")),
        nombre: "Producto seleccionado",
        codigo: `ID ${searchParams.get("productoId")}`,
      }
    : null;

const buildPreviewProductos = (detalles = []) =>
  detalles
    .slice(0, 2)
    .map((detalle) => detalle.producto?.nombre || detalle.producto?.codigo)
    .filter(Boolean);

const InventarioNotasIngresoPage = () => {
  const { loading, obtenerNotasIngreso } = useInventario();
  const [searchParams] = useSearchParams();
  const [producto, setProducto] = useState(buildInitialProducto(searchParams));
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    ordenCompraId: searchParams.get("ordenCompraId") || "",
    fechaDesde: searchParams.get("fechaDesde") || "",
    fechaHasta: searchParams.get("fechaHasta") || "",
    page: 1,
    limit: 12,
  });
  const [result, setResult] = useState({
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.ordenCompraId ||
      filters.fechaDesde ||
      filters.fechaHasta ||
      producto?.id
  );

  const cargarNotas = async (params = filters, selectedProducto = producto) => {
    try {
      const response = await obtenerNotasIngreso({
        ...params,
        productoId: selectedProducto?.id || undefined,
      });
      setResult(
        response || {
          data: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        }
      );
    } catch (error) {
      toast.error(error.message || "No se pudieron obtener las notas de ingreso.");
      setResult({
        data: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      });
    }
  };

  useEffect(() => {
    cargarNotas(
      {
        ...filters,
        page: 1,
      },
      producto
    );
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await cargarNotas(nextFilters, producto);
  };

  const handlePage = async (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await cargarNotas(nextFilters, producto);
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notas de ingreso</h1>
          <p className="mt-1 text-sm text-slate-600">
            Consulta documental de ingresos registrados por recepcion y compra.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventario-recepciones"
            className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Ir a recepciones
          </Link>
          <Link
            to="/dashboard"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-4"
      >
        <input
          type="text"
          value={filters.search}
          name="inventario-notas-ingreso-page-input-130"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2 md:col-span-2"
          placeholder="Buscar por codigo, referencia u OC"
        />
        <input
          type="number"
          min="1"
          value={filters.ordenCompraId}
          name="inventario-notas-ingreso-page-input-139"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, ordenCompraId: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="OC ID"
        />
        <div className="md:col-span-1">
          <ProductoSearchField
            selectedProduct={producto}
            onSelect={setProducto}
            label="Producto"
          />
        </div>
        <input
          type="date"
          value={filters.fechaDesde}
          name="inventario-notas-ingreso-page-input-156"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="date"
          value={filters.fechaHasta}
          name="inventario-notas-ingreso-page-input-164"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
        />
        <div className="md:col-span-2 flex items-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Consultando..." : "Filtrar"}
          </button>
          <button
            type="button"
            onClick={async () => {
              const resetFilters = {
                search: "",
                ordenCompraId: "",
                fechaDesde: "",
                fechaHasta: "",
                page: 1,
                limit: 12,
              };
              setProducto(null);
              setFilters(resetFilters);
              await cargarNotas(resetFilters, null);
            }}
            className="rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </form>

      {loading ? <Loader /> : null}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Documento</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Origen</th>
              <th className="px-4 py-3 text-left">Responsable</th>
              <th className="px-4 py-3 text-left">Resumen</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                  {hasActiveFilters
                    ? "No hay notas de ingreso para los filtros aplicados."
                    : "No hay notas de ingreso registradas por el momento."}
                </td>
              </tr>
            ) : (
              result.data.map((nota) => {
                const previewProductos = buildPreviewProductos(nota.detalles);
                return (
                  <tr key={nota.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="font-medium text-slate-900">{nota.codigo}</div>
                        <DocumentoAlmacenEstadoBadge estado={nota.estado} />
                        <DocumentoFormalEstadoBadge
                          estado={nota.documentoFormal?.estadoDocumentalFormal}

                        />
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
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {nota.ordenCompra.codigo}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {nota.ordenCompra.proveedor?.razonSocial || "Sin proveedor"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          {nota.referenciaCodigo || nota.referenciaTipo || "Sin origen"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{nota.almacen?.nombre || "-"}</div>
                      <div className="text-xs text-slate-500">
                        {nota.responsable?.nombre || "-"}
                      </div>
                      {nota.documentoFormal?.nivelPendienteActual ? (
                        <div className="text-xs text-indigo-600">
                          Pendiente: {nota.documentoFormal.nivelPendienteActual}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>Aceptado: {nota.resumen?.totalAceptado || 0}</div>
                      <div>Rechazado: {nota.resumen?.totalRechazado || 0}</div>
                      <div>Pendiente: {nota.resumen?.totalPendiente || 0}</div>
                      {previewProductos.length > 0 ? (
                        <div className="mt-1 text-slate-500">
                          {previewProductos.join(", ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/inventario-notas-ingreso/${nota.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          Ver detalle
                        </Link>
                        {nota.ordenCompra ? (
                          <Link
                            to={`/ordenes-compra/${nota.ordenCompra.id}`}
                            className="font-medium text-slate-600 hover:text-slate-700"
                          >
                            Ver OC
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          disabled={loading || result.currentPage <= 1}
          onClick={() => handlePage(result.currentPage - 1)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-blue-300"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">
          Pagina {result.currentPage} de {result.totalPages} - {result.totalItems} registros
        </span>
        <button
          type="button"
          disabled={loading || result.currentPage >= result.totalPages}
          onClick={() => handlePage(result.currentPage + 1)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-blue-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default InventarioNotasIngresoPage;




