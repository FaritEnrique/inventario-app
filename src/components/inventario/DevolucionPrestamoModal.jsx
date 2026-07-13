import { useEffect, useMemo, useState } from "react";
import { getBienInventarioLabel } from "../../utils/bienesInventarioDespacho";
import {
  buildDevolucionDraft,
  buildFechaDevolucionIso,
  getLimaDateInput,
  isLineaIndividual,
  normalizeDevolucionItems,
  validateDevolucionDraft,
} from "../../utils/prestamosInventario";

const DevolucionPrestamoModal = ({
  open,
  salida,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const [personaEntrega, setPersonaEntrega] = useState("");
  const [fechaRecepcion, setFechaRecepcion] = useState(() => getLimaDateInput());
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPersonaEntrega("");
    setFechaRecepcion(getLimaDateInput());
    setObservaciones("");
    setLineas(buildDevolucionDraft(salida));
    setError(null);
  }, [open, salida]);

  const totalSeleccionado = useMemo(
    () =>
      normalizeDevolucionItems(lineas).reduce(
        (total, item) => total + Number(item.cantidadDevuelta || 0),
        0,
      ),
    [lineas],
  );

  if (!open) return null;

  const updateLinea = (id, patch) => {
    setLineas((current) =>
      current.map((linea) =>
        linea.notaSalidaDetalleId === id ? { ...linea, ...patch } : linea,
      ),
    );
    setError(null);
  };

  const toggleBien = (linea, bienId) => {
    const current = new Set(linea.bienInventarioIds || []);
    if (current.has(bienId)) current.delete(bienId);
    else current.add(bienId);
    updateLinea(linea.notaSalidaDetalleId, {
      bienInventarioIds: [...current],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (personaEntrega.trim().length < 3) {
      setError("Registra el nombre de la persona que entrega los bienes.");
      return;
    }
    const validation = validateDevolucionDraft(lineas);
    if (validation) {
      setError(validation);
      return;
    }

    await onSubmit({
      personaEntrega: personaEntrega.trim(),
      fechaRecepcion: buildFechaDevolucionIso(fechaRecepcion),
      observaciones: observaciones.trim() || undefined,
      items: normalizeDevolucionItems(lineas),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Registrar ingreso por devolución de préstamo
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Nota de Salida origen: {salida?.codigo || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Esta operación creará una Nota de Ingreso vinculada a la Nota de
            Salida temporal. El stock solo aumentará por lo físicamente recibido
            y aceptado por Almacén.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Persona que entrega *
              </label>
              <input
                value={personaEntrega}
                onChange={(event) => setPersonaEntrega(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Nombre completo"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha de devolución *
              </label>
              <input
                type="date"
                value={fechaRecepcion}
                max={getLimaDateInput()}
                onChange={(event) => setFechaRecepcion(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            {lineas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                Esta salida no tiene bienes pendientes de devolución.
              </div>
            ) : (
              lineas.map((linea) => {
                const individual = isLineaIndividual(linea);
                const selectedBienIds = new Set(linea.bienInventarioIds || []);

                return (
                  <section
                    key={linea.notaSalidaDetalleId}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {linea.producto?.codigo} - {linea.producto?.nombre}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Pendiente de devolución: {linea.cantidadPendiente}
                        </p>
                      </div>
                      {individual ? (
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                          Selección por serie
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={linea.cantidadPendiente}
                          step="0.01"
                          value={linea.cantidadDevuelta}
                          onChange={(event) =>
                            updateLinea(linea.notaSalidaDetalleId, {
                              cantidadDevuelta: event.target.value,
                            })
                          }
                          className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-right"
                          placeholder="Cantidad"
                        />
                      )}
                    </div>

                    {individual ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {linea.bienesPendientes.map((bien) => {
                          const checked = selectedBienIds.has(bien.id);
                          return (
                            <label
                              key={bien.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                                checked
                                  ? "border-violet-400 bg-violet-50"
                                  : "border-slate-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleBien(linea, bien.id)}
                                className="mt-1"
                              />
                              <span>{getBienInventarioLabel(bien)}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}

                    <textarea
                      value={linea.observaciones}
                      onChange={(event) =>
                        updateLinea(linea.notaSalidaDetalleId, {
                          observaciones: event.target.value,
                        })
                      }
                      className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      rows={2}
                      placeholder="Observación de esta devolución (opcional)"
                    />
                  </section>
                );
              })
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Observaciones generales
            </label>
            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={3}
              maxLength={1000}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Total a recibir: <strong>{totalSeleccionado}</strong>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || lineas.length === 0}
                className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting ? "Registrando..." : "Crear Nota de Ingreso"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevolucionPrestamoModal;
