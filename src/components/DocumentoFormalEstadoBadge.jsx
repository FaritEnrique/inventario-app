const stylesByEstado = {
  PENDIENTE_APROBACION_ALMACEN:
    "border border-amber-300 bg-amber-100 text-amber-800",
  PENDIENTE_CONFORMIDAD_GERENCIA:
    "border border-sky-300 bg-sky-100 text-sky-800",
  APROBADA: "border border-emerald-300 bg-emerald-100 text-emerald-800",
  RECHAZADA: "border border-rose-300 bg-rose-100 text-rose-800",
};

const labelsByEstado = {
  PENDIENTE_APROBACION_ALMACEN: "Pendiente almacen",
  PENDIENTE_CONFORMIDAD_GERENCIA: "Pendiente gerencia",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

const DocumentoFormalEstadoBadge = ({ estado }) => {
  const normalizedEstado = String(estado || "PENDIENTE_APROBACION_ALMACEN").toUpperCase();
  const label = labelsByEstado[normalizedEstado] || normalizedEstado;
  const classes =
    stylesByEstado[normalizedEstado] ||
    "border border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
};

export default DocumentoFormalEstadoBadge;
