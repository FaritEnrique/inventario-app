import React from "react";

const approvalLabels = {
  JEFATURA: "Aprobacion Jefatura",
  GERENCIA_AREA: "Aprobacion Gerencia",
  GERENCIA_ADMINISTRACION: "Aprobacion Gerencia Adm.",
};

const printApprovalLevels = [
  "JEFATURA",
  "GERENCIA_AREA",
  "GERENCIA_ADMINISTRACION",
];

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPrintDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("es-PE");
};

const normalizeText = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const joinUniqueSegments = (segments) => {
  const seen = new Set();
  return segments
    .map(normalizeText)
    .filter((segment) => {
      if (!segment) return false;
      const key = segment.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(" - ");
};

export const buildPrintedItemDescription = (item) => {
  if (!item) return "-";

  if (!item.esTemporal && item.producto) {
    const base = normalizeText(item.producto.nombre) || normalizeText(item.descripcionVisible);
    const description = normalizeText(item.producto.descripcion);
    const brand = normalizeText(item.producto.marca?.nombre)
      ? `Marca: ${normalizeText(item.producto.marca?.nombre)}`
      : null;

    return joinUniqueSegments([base, description, brand]) || "-";
  }

  const temporal = item.productoTemporal || {};
  const base =
    normalizeText(temporal.nombre) ||
    normalizeText(item.descripcionVisible) ||
    "Producto temporal";
  const description = normalizeText(temporal.descripcion);

  return joinUniqueSegments([base, description]) || "Producto temporal";
};

const renderValue = (value) => normalizeText(value) || "-";

const PrintRequerimientoDocument = ({
  requerimiento,
  signatures = [],
  applicableApprovalLevels = [],
}) => {
  const activeItems = Array.isArray(requerimiento?.items)
    ? requerimiento.items.filter((item) => item?.activo !== false)
    : [];
  const applicableLevels = new Set(
    Array.isArray(applicableApprovalLevels) ? applicableApprovalLevels : []
  );

  const approvalMap = new Map(
    (Array.isArray(signatures) ? signatures : []).map((signature) => [
      signature.level,
      signature.approval || null,
    ])
  );
  const observaciones = renderValue(
    requerimiento?.observacionesGenerales || requerimiento?.descripcion
  );

  return (
    <section className="print-document hidden print:block">
      <div className="print-document__page">
        <header className="print-avoid-break border border-slate-900">
          <div className="border-b border-slate-900 px-4 py-3 text-center">
            <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-slate-950">
              Requerimiento
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-sm text-slate-900">
            <div>
              <span className="font-semibold">Codigo:</span>{" "}
              <span>{renderValue(requerimiento?.codigo)}</span>
            </div>
            <div>
              <span className="font-semibold">Fecha:</span>{" "}
              <span>{formatPrintDate(requerimiento?.fechaCreacion)}</span>
            </div>
            <div>
              <span className="font-semibold">Area:</span>{" "}
              <span>{renderValue(requerimiento?.areaNombreSnapshot)}</span>
            </div>
            <div>
              <span className="font-semibold">Solicitante:</span>{" "}
              <span>{renderValue(requerimiento?.solicitante?.nombre)}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Uso:</span>{" "}
              <span>{renderValue(requerimiento?.usoFinalidad)}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Ubicacion:</span>{" "}
              <span>{renderValue(requerimiento?.ubicacionUso)}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Observaciones:</span>{" "}
              <span>{observaciones}</span>
            </div>
          </div>
        </header>

        <div className="mt-4 overflow-hidden border border-slate-900">
          <table className="w-full border-collapse text-sm text-slate-950">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-[8%] border border-slate-900 px-2 py-2 text-center font-semibold">
                  Item
                </th>
                <th className="w-[48%] border border-slate-900 px-3 py-2 text-left font-semibold">
                  Descripcion
                </th>
                <th className="w-[12%] border border-slate-900 px-2 py-2 text-center font-semibold">
                  Cant.
                </th>
                <th className="w-[16%] border border-slate-900 px-2 py-2 text-right font-semibold">
                  Valor ref. unitario
                </th>
                <th className="w-[16%] border border-slate-900 px-2 py-2 text-right font-semibold">
                  Total referencial
                </th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item, index) => (
                <tr key={item.id || `${item.descripcionVisible}-${index}`} className="print-avoid-break">
                  <td className="border border-slate-900 px-2 py-2 text-center align-top">
                    {index + 1}
                  </td>
                  <td className="border border-slate-900 px-3 py-2 align-top">
                    <span className="whitespace-pre-wrap break-words">
                      {buildPrintedItemDescription(item)}
                    </span>
                  </td>
                  <td className="border border-slate-900 px-2 py-2 text-center align-top">
                    {item.cantidadRequerida} {normalizeText(item.unidadMedida) || ""}
                  </td>
                  <td className="border border-slate-900 px-2 py-2 text-right align-top">
                    {moneyFormatter.format(Number(item.valorReferencialUnitario || 0))}
                  </td>
                  <td className="border border-slate-900 px-2 py-2 text-right align-top">
                    {moneyFormatter.format(Number(item.subtotalReferencial || 0))}
                  </td>
                </tr>
              ))}
              {!activeItems.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-slate-900 px-3 py-4 text-center text-slate-600"
                  >
                    Sin items registrados.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  className="border border-slate-900 px-3 py-3 text-right font-semibold uppercase"
                >
                  Total general
                </td>
                <td className="border border-slate-900 px-2 py-3 text-right font-semibold">
                  {moneyFormatter.format(Number(requerimiento?.totalReferencial || 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <section className="mt-5 grid grid-cols-3 items-stretch gap-3 text-[10px] leading-[1.35]">
          {printApprovalLevels.map((level) => {
            const approval = approvalMap.get(level);
            const appliesToRoute = applicableLevels.has(level);
            const fallbackLabel = appliesToRoute ? "Pendiente" : "No aplica";
            const approverName =
              normalizeText(approval?.aprobador?.nombre) || fallbackLabel;
            const approvalDate = approval
              ? formatPrintDate(approval.fechaAccion)
              : fallbackLabel;

            return (
              <div
                key={level}
                className="print-avoid-break flex min-h-[92px] flex-col justify-between border border-slate-900 px-3.5 py-3 text-slate-950"
              >
                <p className="border-b border-slate-300 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                  {approvalLabels[level]}
                </p>
                <div className="mt-2.5 space-y-2">
                  <p>
                    <span className="font-semibold">Nombre:</span>{" "}
                    <span>{approverName}</span>
                  </p>
                  <p>
                    <span className="font-semibold">Fecha:</span>{" "}
                    <span>{approvalDate}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </section>
  );
};

export default PrintRequerimientoDocument;
