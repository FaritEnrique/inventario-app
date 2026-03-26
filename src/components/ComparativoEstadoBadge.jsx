const stylesByEstado = {
  BORRADOR: "border border-slate-300 bg-slate-100 text-slate-700",
  OBSERVADO: "border border-amber-300 bg-amber-100 text-amber-800",
  APROBADO: "border border-emerald-300 bg-emerald-100 text-emerald-800",
  RECHAZADO: "border border-rose-300 bg-rose-100 text-rose-800",
};

const labelsByEstado = {
  BORRADOR: "Borrador",
  OBSERVADO: "Observado",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

const ComparativoEstadoBadge = ({ estado }) => {
  const normalizedEstado = String(estado || "BORRADOR").toUpperCase();
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

export default ComparativoEstadoBadge;
