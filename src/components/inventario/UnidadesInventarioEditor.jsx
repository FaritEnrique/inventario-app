import { useMemo } from "react";
import {
  esProductoIndividual,
  getUnidadInventarioDuplicateFields,
} from "../../utils/bienesInventarioRecepcion";

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100";

const UnidadesInventarioEditor = ({
  producto,
  cantidad,
  unidades = [],
  onChange,
  disabled = false,
}) => {
  const duplicateFields = useMemo(
    () => getUnidadInventarioDuplicateFields(unidades),
    [unidades],
  );

  if (!esProductoIndividual(producto)) return null;

  const requiredCount = Number(cantidad);
  const validIntegerQuantity =
    Number.isInteger(requiredCount) && requiredCount >= 0;

  const handleUnidadChange = (index, field, value) => {
    onChange(
      unidades.map((unidad, unidadIndex) =>
        unidadIndex === index ? { ...unidad, [field]: value } : unidad,
      ),
    );
  };

  return (
    <section className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-cyan-950">
            Unidades individualizadas
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-cyan-800">
            Registra una fila por cada unidad aceptada. Los identificadores se
            validarán también contra el inventario existente.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-800 shadow-sm">
          {unidades.length} / {validIntegerQuantity ? requiredCount : "-"}
        </span>
      </div>

      {!validIntegerQuantity ? (
        <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          La cantidad aceptada debe ser un número entero para registrar bienes
          individualizados.
        </div>
      ) : requiredCount === 0 ? (
        <div className="mt-3 rounded border border-dashed border-cyan-300 bg-white p-3 text-sm text-cyan-800">
          Indica una cantidad aceptada mayor que cero para habilitar las filas.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {unidades.map((unidad, index) => (
            <article
              key={unidad.id || index}
              className="rounded-lg border border-cyan-100 bg-white p-3 shadow-sm"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cyan-900">
                Unidad {index + 1}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs font-medium text-slate-700">
                  Número de serie
                  {producto.requiereNumeroSerie ? " *" : " (opcional)"}
                  <input
                    type="text"
                    value={unidad.numeroSerie}
                    onChange={(event) =>
                      handleUnidadChange(index, "numeroSerie", event.target.value)
                    }
                    disabled={disabled}
                    className={`${inputClass} mt-1 ${
                      duplicateFields[index]?.numeroSerie
                        ? "border-rose-400"
                        : ""
                    }`}
                    placeholder="Ejemplo: ABC123"
                  />
                  {duplicateFields[index]?.numeroSerie ? (
                    <span className="mt-1 block text-rose-600">
                      Número de serie repetido.
                    </span>
                  ) : null}
                </label>

                <label className="text-xs font-medium text-slate-700">
                  Código patrimonial
                  {producto.requiereCodigoPatrimonial
                    ? " *"
                    : " (opcional)"}
                  <input
                    type="text"
                    value={unidad.codigoPatrimonial}
                    onChange={(event) =>
                      handleUnidadChange(
                        index,
                        "codigoPatrimonial",
                        event.target.value,
                      )
                    }
                    disabled={disabled}
                    className={`${inputClass} mt-1 ${
                      duplicateFields[index]?.codigoPatrimonial
                        ? "border-rose-400"
                        : ""
                    }`}
                    placeholder="Ejemplo: PAT-001"
                  />
                  {duplicateFields[index]?.codigoPatrimonial ? (
                    <span className="mt-1 block text-rose-600">
                      Código patrimonial repetido.
                    </span>
                  ) : null}
                </label>

                <label className="text-xs font-medium text-slate-700 sm:col-span-2 xl:col-span-1">
                  Observaciones (opcional)
                  <input
                    type="text"
                    value={unidad.observaciones}
                    onChange={(event) =>
                      handleUnidadChange(
                        index,
                        "observaciones",
                        event.target.value,
                      )
                    }
                    disabled={disabled}
                    className={`${inputClass} mt-1`}
                    placeholder="Condición o referencia adicional"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default UnidadesInventarioEditor;
