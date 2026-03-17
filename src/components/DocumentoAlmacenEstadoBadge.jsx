const stylesByEstado = {
  BORRADOR: "border border-slate-300 bg-slate-100 text-slate-700",
  CONFIRMADO: "border border-emerald-300 bg-emerald-100 text-emerald-800",
  ATENDIDO: "border border-blue-300 bg-blue-100 text-blue-800",
  ANULADO: "border border-rose-300 bg-rose-100 text-rose-800",
};

const labelsByEstado = {
  BORRADOR: "Borrador",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  ANULADO: "Anulado",
};

const DocumentoAlmacenEstadoBadge = ({ estado }) => {
  const normalizedEstado = String(estado || "SIN_ESTADO").toUpperCase();
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

export default DocumentoAlmacenEstadoBadge;
