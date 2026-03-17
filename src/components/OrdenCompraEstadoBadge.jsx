const approvalStyles = {
  BORRADOR: "bg-slate-100 text-slate-700",
  PENDIENTE_APROBACION: "bg-amber-100 text-amber-800",
  APROBADA: "bg-emerald-100 text-emerald-800",
  RECHAZADA: "bg-rose-100 text-rose-800",
};

const receptionStyles = {
  PENDIENTE_RECEPCION: "bg-slate-100 text-slate-700",
  PARCIALMENTE_RECIBIDA: "bg-sky-100 text-sky-800",
  COMPLETAMENTE_RECIBIDA: "bg-emerald-100 text-emerald-800",
  CERRADA: "bg-indigo-100 text-indigo-800",
  INCUMPLIDA: "bg-orange-100 text-orange-800",
  CANCELADA: "bg-rose-100 text-rose-800",
};

const labels = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente aprobacion",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  PENDIENTE_RECEPCION: "Pendiente recepcion",
  PARCIALMENTE_RECIBIDA: "Parcialmente recibida",
  COMPLETAMENTE_RECIBIDA: "Completamente recibida",
  CERRADA: "Cerrada",
  INCUMPLIDA: "Incumplida",
  CANCELADA: "Cancelada",
};

const OrdenCompraEstadoBadge = ({ estado, tipo = "recepcion" }) => {
  const normalized = String(estado || "").toUpperCase();
  const styles =
    tipo === "aprobacion"
      ? approvalStyles[normalized]
      : receptionStyles[normalized];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[normalized] || estado || "-"}
    </span>
  );
};

export default OrdenCompraEstadoBadge;
