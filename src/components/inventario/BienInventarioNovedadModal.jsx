import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import Modal from "../Modal";
import {
  TIPOS_SUSTENTO_BIEN,
  buildBienInventarioNovedadPayload,
  formatDateTimeLocal,
} from "../../utils/bienInventarioNovedades";
import { getBienInventarioIdentificador } from "../../utils/bienInventarioTrazabilidad";

const buildInitialForm = () => ({
  almacenDestinoId: "",
  fechaEvento: formatDateTimeLocal(),
  motivo: "",
  referenciaTipo: "",
  referenciaCodigo: "",
  observaciones: "",
});

const BienInventarioNovedadModal = ({
  isOpen,
  tipo,
  bien,
  almacenes = [],
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState(buildInitialForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm());
    setFormError("");
  }, [isOpen]);

  const almacenesDisponibles = useMemo(
    () =>
      almacenes.filter(
        (almacen) => Number(almacen.id) !== Number(bien?.almacen?.id),
      ),
    [almacenes, bien?.almacen?.id],
  );

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit?.(tipo, buildBienInventarioNovedadPayload(tipo, form));
      setFormError("");
    } catch (error) {
      setFormError(error.message || "No se pudo validar la transferencia.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title="Transferir bien entre almacenes"
      maxWidth="max-w-2xl"
      closeOnBackdrop={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="rounded-lg bg-white p-2 text-indigo-700 shadow-sm">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-indigo-950">
              {getBienInventarioIdentificador(bien)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-indigo-800">
              Esta acción solo aplica a una unidad disponible bajo custodia de
              Almacén. El stock se traslada entre ubicaciones en una transacción.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Almacén de destino <span className="text-red-600">*</span>
            </span>
            <select
              name="almacenDestinoId"
              value={form.almacenDestinoId}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona un almacén</option>
              {almacenesDisponibles.map((almacen) => (
                <option key={almacen.id} value={almacen.id}>
                  {almacen.codigo} - {almacen.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Fecha del evento <span className="text-red-600">*</span>
            </span>
            <input
              type="datetime-local"
              name="fechaEvento"
              value={form.fechaEvento}
              max={formatDateTimeLocal()}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Tipo de sustento <span className="text-red-600">*</span>
            </span>
            <select
              name="referenciaTipo"
              value={form.referenciaTipo}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona el documento</option>
              {TIPOS_SUSTENTO_BIEN.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Código o número del sustento <span className="text-red-600">*</span>
            </span>
            <input
              name="referenciaCodigo"
              value={form.referenciaCodigo}
              onChange={handleChange}
              disabled={loading}
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Motivo <span className="text-red-600">*</span>
            </span>
            <textarea
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Observaciones
            </span>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              disabled={loading}
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {formError}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Confirmar transferencia"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BienInventarioNovedadModal;
