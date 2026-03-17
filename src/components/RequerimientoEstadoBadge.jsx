import React from "react";

const flowLabels = {
  GENERADO: "Generado",
  APROBADO_JEFATURA: "Aprobado Jefatura",
  APROBADO_GERENCIA_AREA: "Aprobado Gerencia Area",
  APROBADO_GERENCIA_ADMINISTRACION: "Aprobado Gerencia Administracion",
  APROBADO_GERENCIA_GENERAL: "Aprobado Gerencia General",
};

const pendingLabels = {
  JEFATURA: "Pendiente Jefatura",
  GERENCIA_AREA: "Pendiente Gerencia Area",
  GERENCIA_ADMINISTRACION: "Pendiente Gerencia Administracion",
  GERENCIA_GENERAL: "Pendiente Gerencia General",
};

const documentLabels = {
  GENERADO: "Generado",
  APROBADO_SIN_MODIFICACIONES: "Aprobado sin modificaciones",
  APROBADO_CON_MODIFICACIONES: "Aprobado con modificaciones",
  ANULADO: "Anulado",
};

const flowClasses = {
  GENERADO: "bg-yellow-100 text-yellow-800",
  APROBADO_JEFATURA: "bg-sky-100 text-sky-800",
  APROBADO_GERENCIA_AREA: "bg-blue-100 text-blue-800",
  APROBADO_GERENCIA_ADMINISTRACION: "bg-indigo-100 text-indigo-800",
  APROBADO_GERENCIA_GENERAL: "bg-green-100 text-green-800",
};

const documentClasses = {
  GENERADO: "bg-gray-100 text-gray-700",
  APROBADO_SIN_MODIFICACIONES: "bg-green-100 text-green-800",
  APROBADO_CON_MODIFICACIONES: "bg-amber-100 text-amber-800",
  ANULADO: "bg-red-100 text-red-800",
};

const pendingClasses = {
  JEFATURA: "bg-yellow-100 text-yellow-800",
  GERENCIA_AREA: "bg-blue-100 text-blue-800",
  GERENCIA_ADMINISTRACION: "bg-indigo-100 text-indigo-800",
  GERENCIA_GENERAL: "bg-fuchsia-100 text-fuchsia-800",
};

const chipClass = (variant) =>
  `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${variant}`;

const shouldShowDocumentStatus = (estadoFlujo, estadoDocumento) => {
  if (!estadoDocumento) return false;
  if (estadoDocumento === "ANULADO") return true;
  if (estadoDocumento === "APROBADO_CON_MODIFICACIONES") return true;
  if (estadoDocumento === "APROBADO_SIN_MODIFICACIONES") return true;
  return estadoFlujo === "GENERADO" && estadoDocumento !== "GENERADO";
};

const RequerimientoEstadoBadge = ({
  estadoFlujo,
  estadoDocumento,
  nivelPendiente = null,
  compact = false,
}) => {
  const flowClass = flowClasses[estadoFlujo] || "bg-gray-100 text-gray-700";
  const documentClass =
    documentClasses[estadoDocumento] || "bg-gray-100 text-gray-700";
  const pendingClass =
    pendingClasses[nivelPendiente] || "bg-gray-100 text-gray-700";
  const showDocument = shouldShowDocumentStatus(estadoFlujo, estadoDocumento);
  const showPending = estadoDocumento === "GENERADO" && Boolean(nivelPendiente);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {showPending ? (
          <span className={chipClass(pendingClass)}>
            {pendingLabels[nivelPendiente] || nivelPendiente}
          </span>
        ) : (
          <span className={chipClass(flowClass)}>
            {flowLabels[estadoFlujo] || estadoFlujo || "Sin estado"}
          </span>
        )}
        {showDocument && (
          <span className={chipClass(documentClass)}>
            {documentLabels[estadoDocumento] || estadoDocumento || "Sin estado"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span className={chipClass(flowClass)}>
        Flujo: {flowLabels[estadoFlujo] || estadoFlujo || "Sin estado"}
      </span>
      {showPending && (
        <span className={chipClass(pendingClass)}>
          {pendingLabels[nivelPendiente] || nivelPendiente}
        </span>
      )}
      <span className={chipClass(documentClass)}>
        Documento: {documentLabels[estadoDocumento] || estadoDocumento || "Sin estado"}
      </span>
    </div>
  );
};

export default RequerimientoEstadoBadge;
