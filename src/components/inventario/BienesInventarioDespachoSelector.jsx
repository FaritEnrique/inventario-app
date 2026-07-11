import { getBienInventarioLabel } from "../../utils/bienesInventarioDespacho";

const BienesInventarioDespachoSelector = ({
  linea,
  seleccion = [],
  maximo = 0,
  onToggle,
  disabled = false,
}) => {
  const candidatos = Array.isArray(linea?.bienesDisponibles)
    ? linea.bienesDisponibles
    : [];

  if (!linea) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Carga las unidades disponibles antes de registrar el despacho.
      </div>
    );
  }

  if (candidatos.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        No hay unidades individualizadas disponibles para esta línea.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        La reserva es temporal y solo garantiza cantidad. La serie o código
        patrimonial se asigna recién ahora por decisión de Almacén.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          Seleccionadas: <strong>{seleccion.length}</strong> / {maximo}
        </span>
        <span>
          Atendible ahora: <strong>{linea.capacidadAtencionActual}</strong> ·
          unidades físicas disponibles: {linea.totalBienesDisponibles}
          {linea.cantidadReservadaVigente > 0
            ? ` · reserva vigente por ${linea.cantidadReservadaVigente}`
            : ` · sin reserva vigente; stock libre ${linea.stockDisponibleActual}`}
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {candidatos.map((bien) => {
          const checked = seleccion.includes(bien.id);

          return (
            <label
              key={bien.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                checked
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200 bg-white"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle?.(bien.id)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block font-medium text-slate-900">
                  {getBienInventarioLabel(bien)}
                </span>
                <span className="mt-1 block text-xs text-slate-600">
                  Disponible en el almacén para ser asignada en este despacho.
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default BienesInventarioDespachoSelector;
