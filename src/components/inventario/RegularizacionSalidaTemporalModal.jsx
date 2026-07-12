import { useEffect, useMemo, useState } from "react";
import { getBienInventarioLabel } from "../../utils/bienesInventarioDespacho";
import {
  MOTIVOS_REGULARIZACION_SALIDA,
  buildRegularizacionDraft,
  isLineaIndividual,
  normalizeRegularizacionItems,
  validateRegularizacionDraft,
} from "../../utils/prestamosInventario";

const todayInput = () => new Date().toISOString().slice(0, 10);

const RegularizacionSalidaTemporalModal = ({
  open,
  salida,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const [motivo, setMotivo] = useState("ROBO");
  const [motivoOtro, setMotivoOtro] = useState("");
  const [descripcionHechos, setDescripcionHechos] = useState("");
  const [tipoDocumentoSustento, setTipoDocumentoSustento] = useState("");
  const [numeroDocumentoSustento, setNumeroDocumentoSustento] = useState("");
  const [fechaDocumentoSustento, setFechaDocumentoSustento] = useState(todayInput());
  const [documentoSustento, setDocumentoSustento] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMotivo("ROBO");
    setMotivoOtro("");
    setDescripcionHechos("");
    setTipoDocumentoSustento("");
    setNumeroDocumentoSustento("");
    setFechaDocumentoSustento(todayInput());
    setDocumentoSustento(null);
    setObservaciones("");
    setLineas(buildRegularizacionDraft(salida));
    setError(null);
  }, [open, salida]);

  const totalRegularizar = useMemo(
    () =>
      normalizeRegularizacionItems(lineas).reduce(
        (total, item) => total + Number(item.cantidadRegularizada || 0),
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
    const validation = validateRegularizacionDraft(lineas);
    if (validation) {
      setError(validation);
      return;
    }
    if (motivo === "OTRO" && motivoOtro.trim().length < 3) {
      setError("Debe especificar el motivo de la regularización.");
      return;
    }
    if (descripcionHechos.trim().length < 10) {
      setError("La descripción de los hechos debe tener al menos 10 caracteres.");
      return;
    }
    if (!tipoDocumentoSustento.trim()) {
      setError("Debe indicar el tipo de documento de sustento.");
      return;
    }
    if (!documentoSustento) {
      setError("Debe adjuntar el documento que sustenta la regularización.");
      return;
    }

    await onSubmit({
      motivo,
      motivoOtro: motivo === "OTRO" ? motivoOtro.trim() : undefined,
      descripcionHechos: descripcionHechos.trim(),
      tipoDocumentoSustento: tipoDocumentoSustento.trim(),
      numeroDocumentoSustento: numeroDocumentoSustento.trim() || undefined,
      fechaDocumentoSustento,
      observaciones: observaciones.trim() || undefined,
      detalles: normalizeRegularizacionItems(lineas),
      documentoSustento,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Acta de Regularización de Salida Temporal
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Nota de Salida temporal: {salida?.codigo || "-"}
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
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            El Acta documenta bienes que ya salieron en préstamo y no retornarán.
            El operador la elabora con sustento y la jefatura del almacén debe
            aprobarla para cerrar la obligación. No genera un segundo descuento
            de stock.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Motivo *
              </label>
              <select
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {MOTIVOS_REGULARIZACION_SALIDA.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {motivo === "OTRO" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Especifique el motivo *
                </label>
                <input
                  value={motivoOtro}
                  onChange={(event) => setMotivoOtro(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  maxLength={300}
                  required
                />
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descripción detallada de los hechos *
            </label>
            <textarea
              value={descripcionHechos}
              onChange={(event) => setDescripcionHechos(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={4}
              maxLength={2000}
              required
            />
          </div>

          <div className="space-y-4">
            {lineas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                Esta salida no tiene bienes pendientes de devolución.
              </div>
            ) : (
              lineas.map((linea) => {
                const individual = isLineaIndividual(linea);
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
                          Entregado: {linea.cantidadEntregada} · Devuelto: {linea.cantidadDevuelta} · Regularizado antes: {linea.cantidadRegularizadaAnterior} · Pendiente: {linea.cantidadPendiente}
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
                          value={linea.cantidadRegularizada}
                          onChange={(event) =>
                            updateLinea(linea.notaSalidaDetalleId, {
                              cantidadRegularizada: event.target.value,
                            })
                          }
                          className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-right"
                          placeholder="A regularizar"
                        />
                      )}
                    </div>

                    {individual ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {linea.bienesPendientes.map((bien) => {
                          const checked = (linea.bienInventarioIds || []).includes(
                            bien.id,
                          );
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
                      placeholder="Observación de esta línea (opcional)"
                    />
                  </section>
                );
              })
            )}
          </div>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Documento sustentatorio</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tipo de documento *
                </label>
                <input
                  value={tipoDocumentoSustento}
                  onChange={(event) => setTipoDocumentoSustento(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Denuncia, informe, resolución..."
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Número o código
                </label>
                <input
                  value={numeroDocumentoSustento}
                  onChange={(event) => setNumeroDocumentoSustento(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha del documento *
                </label>
                <input
                  type="date"
                  value={fechaDocumentoSustento}
                  onChange={(event) => setFechaDocumentoSustento(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Archivo de sustento *
              </label>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={(event) => setDocumentoSustento(event.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                PDF o imagen. El archivo quedará asociado al Acta emitida.
              </p>
            </div>
          </section>

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
              Total a regularizar: <strong>{totalRegularizar}</strong>
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
                className="rounded-lg bg-amber-700 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {submitting ? "Registrando..." : "Enviar a aprobación"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegularizacionSalidaTemporalModal;
