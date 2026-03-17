import React from "react";

const solicitudLabels = {
  Creada: "Creada",
  Enviada: "Enviada",
  Respondida: "Respondida",
  Rechazada: "Rechazada",
};

const cotizacionLabels = {
  Pendiente: "Pendiente",
  Rechazada: "Rechazada",
  Adjudicada: "Adjudicada",
  Descartada: "Descartada",
};

const logisticaLabels = {
  PENDIENTE_APROBACION: "Pendiente aprobacion",
  PENDIENTE_PROCESO: "Pendiente de proceso",
  ASIGNADO: "Asignado",
  EN_PROCESO: "En proceso",
  LISTO_PARA_ADJUDICACION: "Listo para adjudicacion",
  ADJUDICADO: "Adjudicado",
  OC_GENERADA: "OC generada",
};

const variants = {
  Creada: "bg-slate-100 text-slate-700",
  Enviada: "bg-sky-100 text-sky-700",
  Respondida: "bg-emerald-100 text-emerald-700",
  Rechazada: "bg-red-100 text-red-700",
  Pendiente: "bg-amber-100 text-amber-800",
  Adjudicada: "bg-green-100 text-green-800",
  Descartada: "bg-zinc-100 text-zinc-700",
  PENDIENTE_APROBACION: "bg-slate-100 text-slate-700",
  PENDIENTE_PROCESO: "bg-amber-100 text-amber-800",
  ASIGNADO: "bg-sky-100 text-sky-800",
  EN_PROCESO: "bg-indigo-100 text-indigo-800",
  LISTO_PARA_ADJUDICACION: "bg-fuchsia-100 text-fuchsia-800",
  ADJUDICADO: "bg-green-100 text-green-800",
  OC_GENERADA: "bg-emerald-100 text-emerald-700",
};

const CotizacionEstadoBadge = ({ estado, tipo = "cotizacion" }) => {
  const labels =
    tipo === "solicitud"
      ? solicitudLabels
      : tipo === "logistica"
        ? logisticaLabels
        : cotizacionLabels;
  const className = variants[estado] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {labels[estado] || estado || "Sin estado"}
    </span>
  );
};

export default CotizacionEstadoBadge;
