import { useEffect, useMemo, useState } from "react";
import {
  CAUSALES_ANULACION_ORDEN_COMPRA,
  validateOrdenCompraAnulacionPayload,
} from "../utils/ordenCompraAnulacionUi";

const AnularOrdenCompraModal = ({
  open,
  ordenCompra,
  submitting = false,
  onCancel,
  onConfirm,
}) => {
  const [causalAnulacion, setCausalAnulacion] = useState("");
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCausalAnulacion("");
    setMotivoAnulacion("");
    setError("");
  }, [open]);

  const validation = useMemo(
    () =>
      validateOrdenCompraAnulacionPayload({
        causalAnulacion,
        motivoAnulacion,
      }),
    [causalAnulacion, motivoAnulacion],
  );

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setError("");
    onConfirm?.({
      causalAnulacion,
      motivoAnulacion: motivoAnulacion.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Anular Orden de Compra
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {ordenCompra?.codigo || "Orden de Compra"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Esta acción anulará lógicamente la Orden de Compra y sus ítems
          asociados. No habrá borrado físico de registros.
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-gray-800">
            Causal de anulación
          </span>
          <select
            value={causalAnulacion}
            onChange={(event) => {
              setCausalAnulacion(event.target.value);
              setError("");
            }}
            disabled={submitting}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          >
            <option value="">Selecciona una causal</option>
            {CAUSALES_ANULACION_ORDEN_COMPRA.map((causal) => (
              <option key={causal.value} value={causal.value}>
                {causal.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-gray-800">
            Motivo de anulación
          </span>
          <textarea
            value={motivoAnulacion}
            onChange={(event) => {
              setMotivoAnulacion(event.target.value);
              setError("");
            }}
            disabled={submitting}
            rows={4}
            placeholder="Describe el sustento de la anulación lógica."
            className="mt-1 w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <p className="mt-4 text-sm text-gray-600">
          ¿Desea continuar con la anulación lógica de esta Orden de Compra?
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !validation.valid}
            className="rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {submitting ? "Anulando..." : "Confirmar anulación"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnularOrdenCompraModal;
