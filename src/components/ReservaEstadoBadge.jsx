const stylesByEstado = {
  ACTIVA: "border border-blue-300 bg-blue-100 text-blue-800",
  PARCIAL: "border border-amber-300 bg-amber-100 text-amber-800",
  CONSUMIDA: "border border-emerald-300 bg-emerald-100 text-emerald-800",
  LIBERADA: "border border-slate-300 bg-slate-100 text-slate-700",
  CANCELADA: "border border-rose-300 bg-rose-100 text-rose-800",
};

const labelsByEstado = {
  ACTIVA: "Activa",
  PARCIAL: "Parcial",
  CONSUMIDA: "Consumida",
  LIBERADA: "Liberada",
  CANCELADA: "Cancelada",
};

const ReservaEstadoBadge = ({ estado }) => {
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

export default ReservaEstadoBadge;
