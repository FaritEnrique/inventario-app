import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, PackageCheck, ShieldAlert } from "lucide-react";
import Modal from "../Modal";
import {
  BIEN_INVENTARIO_NOVEDAD_TIPOS,
  CAUSALES_BAJA_BIEN,
  TIPOS_SUSTENTO_BIEN,
  buildBienInventarioNovedadPayload,
  formatDateTimeLocal,
} from "../../utils/bienInventarioNovedades";
import { getBienInventarioIdentificador } from "../../utils/bienInventarioTrazabilidad";

const META = Object.freeze({
  DEVOLUCION: {
    title: "Registrar devolución al almacén",
    description:
      "La unidad volverá a estar disponible en el almacén seleccionado.",
    submitLabel: "Confirmar devolución",
    Icon: PackageCheck,
    submitClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  TRANSFERENCIA: {
    title: "Transferir bien entre almacenes",
    description:
      "El stock se descontará del almacén actual y se incorporará al destino en una sola transacción.",
    submitLabel: "Confirmar transferencia",
    Icon: ArrowLeftRight,
    submitClass: "bg-indigo-600 hover:bg-indigo-700",
  },
  BAJA: {
    title: "Registrar baja del bien",
    description:
      "La baja retira la unidad del ciclo operativo y exige causal y sustento formal.",
    submitLabel: "Confirmar baja",
    Icon: ShieldAlert,
    submitClass: "bg-red-600 hover:bg-red-700",
  },
});

const buildInitialForm = (tipo, bien) => ({
  almacenDestinoId:
    tipo === BIEN_INVENTARIO_NOVEDAD_TIPOS.DEVOLUCION
      ? String(bien?.almacen?.id || "")
      : "",
  causalBaja: "",
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
  const [form, setForm] = useState(() => buildInitialForm(tipo, bien));
  const [formError, setFormError] = useState("");
  const meta = META[tipo] || META.TRANSFERENCIA;
  const { Icon } = meta;

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm(tipo, bien));
    setFormError("");
  }, [bien, isOpen, tipo]);

  const almacenesDisponibles = useMemo(() => {
    if (tipo !== BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA) {
      return almacenes;
    }

    return almacenes.filter(
      (almacen) => Number(almacen.id) !== Number(bien?.almacen?.id),
    );
  }, [almacenes, bien?.almacen?.id, tipo]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = buildBienInventarioNovedadPayload(tipo, form);
      setFormError("");
      await onSubmit?.(tipo, payload);
    } catch (error) {
      setFormError(error.message || "No se pudo validar la novedad.");
    }
  };

  const requiereAlmacen = [
    BIEN_INVENTARIO_NOVEDAD_TIPOS.DEVOLUCION,
    BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA,
  ].includes(tipo);

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={meta.title}
      maxWidth="max-w-2xl"
      closeOnBackdrop={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="rounded-lg bg-white p-2 text-indigo-700 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-indigo-950">
              {getBienInventarioIdentificador(bien)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-indigo-800">
              {meta.description}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {requiereAlmacen && (
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-gray-700">
                Almacén de destino <span className="text-red-600">*</span>
              </span>
              <select
                name="almacenDestinoId"
                value={form.almacenDestinoId}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
              >
                <option value="">Selecciona un almacén</option>
                {almacenesDisponibles.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.codigo} - {almacen.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          {tipo === BIEN_INVENTARIO_NOVEDAD_TIPOS.BAJA && (
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-gray-700">
                Causal de baja <span className="text-red-600">*</span>
              </span>
              <select
                name="causalBaja"
                value={form.causalBaja}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              >
                <option value="">Selecciona una causal</option>
                {CAUSALES_BAJA_BIEN.map((causal) => (
                  <option key={causal.value} value={causal.value}>
                    {causal.label}
                  </option>
                ))}
              </select>
            </label>
          )}

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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            >
              <option value="">Selecciona el documento</option>
              {TIPOS_SUSTENTO_BIEN.map((tipoSustento) => (
                <option key={tipoSustento.value} value={tipoSustento.value}>
                  {tipoSustento.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Código o número del sustento <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              name="referenciaCodigo"
              value={form.referenciaCodigo}
              onChange={handleChange}
              disabled={loading}
              maxLength={100}
              placeholder="Ej. ACTA-021-2026"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
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
              placeholder="Describe la razón y el contexto de la operación."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
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
              placeholder="Datos adicionales, estado físico, accesorios u otras precisiones."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />
          </label>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {formError}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${meta.submitClass}`}
          >
            {loading ? "Registrando..." : meta.submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BienInventarioNovedadModal;
