import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ResumenProcesoLogisticoSkeleton from "../components/ui/skeletons/ResumenProcesoLogisticoSkeleton";
import useHistorialAprobacionesStore from "../stores/useHistorialAprobacionesStore";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "No disponible";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const ResumenProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading } = useOutletContext();
  const items = Array.isArray(detalleGlobal?.items) ? detalleGlobal.items : [];
  const requerimientoKey = String(id || "");
  const {
    historialPorRequerimiento,
    cargandoPorRequerimiento,
    errorPorRequerimiento,
    cargarHistorial,
  } = useHistorialAprobacionesStore();

  const historialAprobaciones =
    historialPorRequerimiento[requerimientoKey] || [];

  const cargandoHistorial = cargandoPorRequerimiento[requerimientoKey] || false;

  const errorHistorial = errorPorRequerimiento[requerimientoKey] || null;

  useEffect(() => {
    if (id) {
      cargarHistorial(id);
    }
  }, [id, cargarHistorial]);

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "No disponible";

  const formatApprovalResult = (entry) => {
    if (entry.aprobado === true) return "Aprobado";
    if (entry.aprobado === false) return "Rechazado";
    return entry.accion || "Registrado";
  };

  if (loading && !detalleGlobal) {
    return <ResumenProcesoLogisticoSkeleton />;
  }

  return (
    <>
      <section>
        <h1 className="mb-4 text-3xl font-bold text-indigo-500">
          Resumen Estado de Requerimiento
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 mb-4 bg-green-100 border border-green-500 rounded-lg lg:gap-4 lg:p-4">
          <div className="flex flex-wrap items-center gap-2 lg:gap-4 w-fit">
            <h3 className="text-xl font-bold text-gray-700">
              Requerimiento N°
            </h3>
            <h3 className="text-xl font-bold text-gray-700">
              {detalleGlobal?.codigo || `#${id}`}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
            <p className="gap-2 font-semibold lg:gap-4">
              Fecha de Emision Requerimiento:
            </p>
            <span>{formatDate(detalleGlobal?.fechaCreacion)}</span>
          </div>
        </div>

        <div>
          <div className="mb-2 lg:mb-4">
            <p className="mb-2 font-semibold lg:mb-4">Uso / Finalidad:</p>
            <div className="p-2 border border-indigo-500 rounded-lg bg-indigo-50">
              <p>{detalleGlobal?.usoFinalidad || "No disponible"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2 lg:mb-4 lg:gap-4">
            <p className="font-semibold">Ubicacion de uso:</p>
            <p className="p-2 border border-indigo-500 rounded-lg bg-indigo-50">
              {detalleGlobal?.ubicacionUso || "No disponible"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2 lg:mb-4 lg:gap-4">
            <p className="font-semibold">Fecha de paso a Logistica:</p>
            <p className="p-2 border border-indigo-500 rounded-lg bg-indigo-50">
              {formatDate(detalleGlobal?.fechaHabilitacionLogistica)}
            </p>
          </div>
        </div>
        <div className="p-4 mt-2 mb-2 border border-indigo-500 rounded-lg lg:mb-4 sm:mt-4 bg-indigo-50">
          <h2 className="mb-2 text-lg font-bold text-indigo-500 sm:mb-3">
            Asignación Logística
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Responsable Asignación
              </p>
              <p className="text-sm text-gray-900 break-words">
                {detalleGlobal?.responsableLogistica?.nombre || "No asignado"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Asignado por:
              </p>
              <p className="text-sm text-gray-900 break-words">
                {detalleGlobal?.asignadoPorLogistica?.nombre || "No disponible"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Fecha de Asignación
              </p>
              <p className="text-sm text-gray-900">
                {formatDate(detalleGlobal?.fechaAsignacionLogistica)}
              </p>
            </div>
          </div>
        </div>
        <div>
          <div>
            <h2 className="text-xl font-bold text-gray-700">
              Items del Requerimiento
            </h2>
          </div>
          <div className="w-full overflow-x-auto border-2 border-indigo-500 rounded-lg">
            <table className="min-w-[720px] w-full border-collapse text-sm">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-3 py-2 text-center">Item</th>
                  <th className="px-3 py-2 text-center">Descripción</th>
                  <th className="px-3 py-2 text-center">Unidad</th>
                  <th className="px-3 py-2 text-center">Cantidad</th>
                  <th className="px-3 py-2 text-center">Precio Unitario</th>
                  <th className="px-3 py-2 text-center">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center border border-gray-300">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300">
                        {item.descripcionVisible || "Sin descripcion"}
                      </td>
                      <td className="text-center border border-gray-300">
                        {item.unidadMedida || "-"}
                      </td>
                      <td className="text-center border border-gray-300">
                        {formatNumber(item.cantidadRequerida)}
                      </td>
                      <td className="text-right border border-gray-300">
                        {formatCurrency(item.valorReferencialUnitario)}
                      </td>
                      <td className="text-right border border-gray-300">
                        {formatCurrency(item.subtotalReferencial)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center border border-gray-300"
                    >
                      No hay items registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col mt-2 justify-self-end w-fit lg:mt-4">
          <p className="mb-2 text-lg font-bold text-center text-gray-700">
            Total
          </p>
          <div>
            <p className="p-2 mb-2 text-lg font-bold text-center text-gray-700 border border-indigo-500 rounded-lg bg-indigo-50">
              {formatCurrency(detalleGlobal?.totalReferencial)}
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-bold text-indigo-500">
          Historial de Aprobaciones
        </h2>
        {cargandoHistorial ? (
          <p className="p-4 text-sm text-gray-500 border border-gray-300 rounded-lg bg-indigo-50">
            Cargando aprobaciones...
          </p>
        ) : errorHistorial ? (
          <p className="p-4 text-sm text-red-600 border border-red-600 rounded-lg bg-red-50 ">
            {errorHistorial}
          </p>
        ) : historialAprobaciones.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {historialAprobaciones.map((entry) => (
              <article
                key={entry.id}
                className="min-w-0 p-3 border border-indigo-300 rounded-lg bg-gray-50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-semibold text-gray-700 break-words">
                    {entry.nivelAprobacion || entry.tipoEvento || "Evento"}
                  </p>
                  <span className="px-2 py-1 text-xs font-semibold text-indigo-700 rounded-full w-fit shrink-0 bg-indigo-50 ">
                    {formatApprovalResult(entry)}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Usuario:</span>
                    {""}
                    {entry.aprobador?.nombre || "No disponible"}
                  </p>
                  <p>
                    <span className="font-semibold">Fecha:</span>
                    {""}
                    {formatDateTime(entry.fechaAccion)}
                  </p>
                </div>
                {entry.comentario ? (
                  <p className="mt-3 text-sm text-gray-600 break-words">
                    {entry.comentario}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500 border border-indigo-300 rounded-lg bg-gray-50">
            No hay aprobaciones registradas.
          </div>
        )}
      </section>
    </>
  );
};

export default ResumenProcesoLogisticoPage;
