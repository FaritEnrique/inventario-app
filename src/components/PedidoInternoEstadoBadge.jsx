const statusStyles = {
  PENDIENTE_APROBACION: "bg-amber-100 text-amber-800",
  APROBADO: "bg-blue-100 text-blue-800",
  RECHAZADO: "bg-red-100 text-red-800",
  EN_ATENCION: "bg-indigo-100 text-indigo-800",
  PARCIALMENTE_ATENDIDO: "bg-purple-100 text-purple-800",
  COMPLETAMENTE_ATENDIDO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-200 text-slate-700",
  BORRADOR: "bg-slate-200 text-slate-700",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  ATENDIDO: "bg-emerald-100 text-emerald-800",
  ANULADO: "bg-red-100 text-red-800",
};

const formatStatus = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const shouldShowDocumentStatus = (estadoFlujo, estadoDocumento) => {
  if (!estadoDocumento) return false;

  const flujo = String(estadoFlujo || "");
  const documento = String(estadoDocumento || "");

  if (
    (flujo === "PENDIENTE_APROBACION" && documento === "CONFIRMADO") ||
    (flujo === "APROBADO" && documento === "CONFIRMADO") ||
    (flujo === "PARCIALMENTE_ATENDIDO" && documento === "CONFIRMADO") ||
    (flujo === "COMPLETAMENTE_ATENDIDO" && documento === "ATENDIDO") ||
    (flujo === "RECHAZADO" && documento === "ANULADO")
  ) {
    return false;
  }

  return true;
};

const PedidoInternoEstadoBadge = ({
  estadoFlujo,
  estadoDocumento = null,
  showDocument = false,
}) => {
  const flujoClass = statusStyles[estadoFlujo] || "bg-slate-100 text-slate-700";
  const documentoClass =
    statusStyles[estadoDocumento] || "bg-slate-100 text-slate-700";
  const showSecondary = showDocument && shouldShowDocumentStatus(estadoFlujo, estadoDocumento);

  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${flujoClass}`}
      >
        Estado: {formatStatus(estadoFlujo)}
      </span>
      {showSecondary && (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${documentoClass}`}
        >
          Registro: {formatStatus(estadoDocumento)}
        </span>
      )}
    </div>
  );
};

export default PedidoInternoEstadoBadge;
