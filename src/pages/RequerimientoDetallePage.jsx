import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import RequerimientoEstadoBadge from "../components/RequerimientoEstadoBadge";
import { useAuth } from "../context/authContext";
import useRequerimientos from "../hooks/useRequerimientos";
import {
  canEditRequerimiento,
  getAvailableApprovalTrays,
} from "../utils/requerimientoPermissions";

const eventLabels = {
  CREACION: "Creacion",
  MODIFICACION_CABECERA: "Modificacion de cabecera",
  AGREGAR_ITEM: "Alta de item",
  MODIFICAR_ITEM: "Modificacion de item",
  RETIRAR_ITEM: "Retiro de item",
  APROBACION: "Aprobacion",
  RECHAZO: "Rechazo",
  PROPUESTA_PRODUCTO_TEMPORAL: "Producto temporal propuesto",
  TOMA_CONOCIMIENTO: "Toma de conocimiento",
  ANULACION: "Anulacion",
};

const levelLabels = {
  JEFATURA: "Jefatura",
  GERENCIA_AREA: "Gerencia de Area",
  GERENCIA_ADMINISTRACION: "Gerencia de Administracion",
  GERENCIA_GENERAL: "Gerencia General",
};

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "Si" : "No";
  return String(value);
};

const buildDetailLines = (entry) => {
  const detail = entry?.detalle;
  if (!detail) return [];

  switch (entry.tipoEvento) {
    case "MODIFICACION_CABECERA":
      return Object.entries(detail).map(([field, values]) =>
        `${field}: ${renderValue(values?.anterior)} -> ${renderValue(values?.nuevo)}`
      );
    case "MODIFICAR_ITEM":
      return [
        detail.descripcionVisible ? `Item: ${detail.descripcionVisible}` : null,
        ...Object.entries(detail.cambios || {}).map(
          ([field, values]) =>
            `${field}: ${renderValue(values?.anterior)} -> ${renderValue(values?.nuevo)}`
        ),
      ].filter(Boolean);
    case "AGREGAR_ITEM":
      return [
        detail.descripcionVisible ? `Item: ${detail.descripcionVisible}` : null,
        detail.cantidadRequerida != null
          ? `Cantidad: ${detail.cantidadRequerida}`
          : null,
      ].filter(Boolean);
    case "RETIRAR_ITEM":
      return [detail.descripcionVisible ? `Item: ${detail.descripcionVisible}` : null].filter(
        Boolean
      );
    case "PROPUESTA_PRODUCTO_TEMPORAL":
      return [
        detail.nombre ? `Nombre: ${detail.nombre}` : null,
        detail.unidadMedida ? `Unidad: ${detail.unidadMedida}` : null,
        detail.valorReferencialUnitario != null
          ? `Valor referencial: S/ ${Number(detail.valorReferencialUnitario || 0).toFixed(2)}`
          : null,
      ].filter(Boolean);
    case "APROBACION":
    case "RECHAZO":
      return Array.isArray(detail?.items)
        ? detail.items.map(
            (item) =>
              `${item.descripcionVisible || `Item ${item.itemId}`}: ${item.decision}`
          )
        : [];
    default:
      return [];
  }
};

const RequerimientoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRequerimientoById, eliminarRequerimiento } = useRequerimientos();
  const [loading, setLoading] = useState(true);
  const [requerimiento, setRequerimiento] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRequerimientoById(id);
        setRequerimiento(data);
      } catch (error) {
        toast.error(error.message || "No se pudo cargar el requerimiento.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getRequerimientoById, id]);

  const trays = useMemo(() => getAvailableApprovalTrays(user), [user]);
  const canEdit = useMemo(
    () => canEditRequerimiento(user, requerimiento),
    [requerimiento, user]
  );
  const requiresGG = Number(requerimiento?.totalReferencial || 0) > 20000;

  const signatureLevels = useMemo(
    () =>
      Array.isArray(requerimiento?.rutaAprobacion) &&
      requerimiento.rutaAprobacion.length
        ? requerimiento.rutaAprobacion
        : [
            "JEFATURA",
            "GERENCIA_AREA",
            "GERENCIA_ADMINISTRACION",
            ...(requiresGG ? ["GERENCIA_GENERAL"] : []),
          ],
    [requerimiento?.rutaAprobacion, requiresGG]
  );

  const signatures = useMemo(() => {
    const entries = Array.isArray(requerimiento?.historial)
      ? requerimiento.historial
      : [];

    return signatureLevels.map((level) => {
      const approval = [...entries]
        .reverse()
        .find(
          (entry) =>
            entry.tipoEvento === "APROBACION" &&
            entry.nivelAprobacion === level &&
            entry.aprobado === true
        );

      return {
        level,
        approval,
      };
    });
  }, [requerimiento?.historial, signatureLevels]);

  const handleAnular = async () => {
    if (!window.confirm("Se anulara logicamente el requerimiento. Deseas continuar?")) {
      return;
    }

    try {
      await eliminarRequerimiento(id);
      toast.success("Requerimiento anulado correctamente.");
      navigate("/requerimientos");
    } catch (error) {
      toast.error(error.message || "No se pudo anular el requerimiento.");
    }
  };

  if (loading) return <Loader />;
  if (!requerimiento)
    return <div className="p-6 text-sm text-red-600">No se encontro el requerimiento.</div>;

  return (
    <div className="mx-auto max-w-7xl p-6 print:p-0">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalle de requerimiento</h1>
          <p className="mt-1 text-sm text-gray-600">
            Documento de adquisicion con trazabilidad de aprobaciones y modificaciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {trays.map((tray) => (
            <Link
              key={tray.key}
              to={tray.path}
              className="rounded border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              {tray.label}
            </Link>
          ))}
          {canEdit && (
            <Link
              to={`/requerimientos/${id}/editar`}
              className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Editar
            </Link>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handleAnular}
              className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Anular
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Imprimir
          </button>
          <Link
            to="/requerimientos"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Listado
          </Link>
        </div>
      </div>

      <div className="space-y-6 rounded-xl bg-white p-6 shadow print:shadow-none">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Codigo</p>
            <p className="text-lg font-semibold text-gray-900">{requerimiento.codigo}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</p>
            <p className="text-sm text-gray-700">{formatDateTime(requerimiento.fechaCreacion)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Solicitante</p>
            <p className="text-sm text-gray-700">{requerimiento.solicitante?.nombre || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total referencial</p>
            <p className="text-lg font-semibold text-gray-900">
              S/ {(requerimiento.totalReferencial || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <RequerimientoEstadoBadge
          estadoFlujo={requerimiento.estadoFlujo}
          estadoDocumento={requerimiento.estadoDocumento}
          nivelPendiente={requerimiento.nivelPendiente}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area</p>
            <p className="text-sm text-gray-700">{requerimiento.areaNombreSnapshot}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gerencia derivada</p>
            <p className="text-sm text-gray-700">
              {requerimiento.gerencia?.nombre} ({requerimiento.gerencia?.abreviatura})
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Uso / finalidad</p>
            <p className="text-sm text-gray-700">{requerimiento.usoFinalidad}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ubicacion</p>
            <p className="text-sm text-gray-700">{requerimiento.ubicacionUso}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Version actual</p>
            <p className="text-sm text-gray-700">{requerimiento.versionActual || 1}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modificaciones</p>
            <p className="text-sm text-gray-700">{requerimiento.tieneModificaciones ? "Si" : "No"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requiere GG</p>
            <p className="text-sm text-gray-700">{requiresGG ? "Si" : "No"}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observaciones generales</p>
          <p className="mt-1 text-sm text-gray-700">
            {requerimiento.observacionesGenerales || requerimiento.descripcion || "-"}
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Items</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Descripcion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Subtotal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {requerimiento.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">{item.descripcionVisible}</p>
                      <p className="text-xs text-gray-500">
                        {item.producto?.codigo || item.productoTemporal?.nombre || "Producto temporal"}
                      </p>
                      {item.esTemporal && (
                        <div className="mt-1 space-y-1 text-xs text-amber-700">
                          <p>Producto temporal pendiente de catalogacion.</p>
                          <p>
                            Propuesto por: {item.productoTemporal?.propuestoPor?.nombre || "-"}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.esTemporal ? "Temporal" : "Catalogado"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.cantidadRequerida} {item.unidadMedida}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      S/ {(item.valorReferencialUnitario || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      S/ {(item.subtotalReferencial || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Historial y aprobaciones</h2>
          <div className="space-y-3">
            {requerimiento.historial.length > 0 ? (
              requerimiento.historial.map((entry) => {
                const detailLines = buildDetailLines(entry);
                return (
                  <div key={entry.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="font-semibold text-gray-900">
                        {eventLabels[entry.tipoEvento] || entry.tipoEvento}
                      </p>
                      <p className="text-gray-500">{formatDateTime(entry.fechaAccion)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      Usuario: {entry.aprobador?.nombre || "-"}
                    </p>
                    {entry.nivelAprobacion && (
                      <p className="text-sm text-gray-700">
                        Nivel: {levelLabels[entry.nivelAprobacion] || entry.nivelAprobacion}
                      </p>
                    )}
                    {entry.comentario && (
                      <p className="mt-1 text-sm text-gray-700">{entry.comentario}</p>
                    )}
                    {detailLines.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {detailLines.map((line, index) => (
                          <li key={`${entry.id}-${index}`}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                Sin historial registrado.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 xl:grid-cols-4">
          {signatures.map(({ level, approval }) => (
            <div key={level} className="rounded border border-gray-300 p-4 text-center text-sm text-gray-600">
              <p className="font-semibold text-gray-800">{levelLabels[level] || level}</p>
              <p className="mt-3 min-h-[20px]">
                {approval?.aprobador?.nombre || "Pendiente"}
              </p>
              <p className="text-xs text-gray-500">
                {approval ? formatDateTime(approval.fechaAccion) : "Sin firma registrada"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RequerimientoDetallePage;



