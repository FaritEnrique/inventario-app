import React, { useState } from "react";

const ConfirmDeactivateSolicitudToast = ({ closeToast, onConfirm }) => {
  const [motivo, setMotivo] = useState("");
  const motivoLimpio = motivo.trim();

  return (
    <div className="w-full max-w-md space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Desactivar solicitud
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Registra el motivo de la desactivacion. Esta accion conserva la
          trazabilidad.
        </p>
      </div>

      <textarea
        value={motivo}
        onChange={(event) => setMotivo(event.target.value)}
        rows={4}
        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        placeholder="Ej. Solicitud emitida por error, proveedor incorrecto, datos incompletos..."
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={closeToast}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={!motivoLimpio}
          onClick={async () => {
            await onConfirm(motivoLimpio);
            closeToast();
          }}
          className="rounded bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Desactivar
        </button>
      </div>
    </div>
  );
};

export default ConfirmDeactivateSolicitudToast;
