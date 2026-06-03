import { useState } from "react";
import ValidarProductoTemporalModal from "../components/ValidarProductoTemporalModal";
import SkeletonSection from "../components/ui/skeletons/SkeletonSection";
import useProductosTemporales from "../hooks/useProductosTemporales";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-PE");
};

const estadoStyles = {
  PROPUESTO: "bg-amber-100 text-amber-800",
  VALIDADO: "bg-blue-100 text-blue-800",
  VINCULADO: "bg-emerald-100 text-emerald-800",
  DESCARTADO: "bg-slate-100 text-slate-700",
};

const ProductosTemporalesAlmacenPage = () => {
  const {
    productosTemporales,
    loading,
    listarProductosTemporales,
  } = useProductosTemporales({ estado: "PENDIENTE" });
  const [estado, setEstado] = useState("PENDIENTE");
  const [modalTemporal, setModalTemporal] = useState(null);

  const handleEstadoChange = async (nextEstado) => {
    setEstado(nextEstado);
    await listarProductosTemporales({ estado: nextEstado });
  };

  const handleResolved = async () => {
    setModalTemporal(null);
    await listarProductosTemporales({ estado });
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Validar productos temporales
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Resuelve productos propuestos en requerimientos antes de su ingreso a
            almacen.
          </p>
        </div>
        <select
          value={estado}
          onChange={(event) => handleEstadoChange(event.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm md:w-56"
        >
          <option value="PENDIENTE">Pendientes</option>
          <option value="PROPUESTO">Propuestos</option>
          <option value="VALIDADO">Validados</option>
          <option value="VINCULADO">Vinculados</option>
          <option value="TODOS">Todos activos</option>
        </select>
      </div>

      {loading ? (
        <SkeletonSection rows={5} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Producto temporal</th>
                  <th className="px-4 py-3">Requerimiento</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3 text-right">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosTemporales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No hay productos temporales para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  productosTemporales.map((temporal) => (
                    <tr key={temporal.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {temporal.nombre}
                        </p>
                        <p className="mt-1 max-w-xl text-xs text-slate-500">
                          {temporal.descripcion || temporal.observaciones || "-"}
                        </p>
                        {temporal.productoVinculado ? (
                          <p className="mt-1 text-xs text-emerald-700">
                            Vinculado a {temporal.productoVinculado.codigo} -{" "}
                            {temporal.productoVinculado.nombre}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{temporal.requerimiento?.codigo || "-"}</p>
                        <p className="text-xs text-slate-500">
                          {temporal.areaSolicitante?.nombre || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {temporal.unidadMedida || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            estadoStyles[temporal.estado] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {temporal.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(temporal.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {temporal.estado === "VINCULADO" ? (
                          <span className="text-xs text-slate-500">
                            Resuelto
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setModalTemporal(temporal)}
                            className="rounded bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            Validar producto
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ValidarProductoTemporalModal
        open={Boolean(modalTemporal)}
        productoTemporal={modalTemporal}
        onClose={() => setModalTemporal(null)}
        onResolved={handleResolved}
      />
    </div>
  );
};

export default ProductosTemporalesAlmacenPage;
