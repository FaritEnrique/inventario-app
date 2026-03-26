import React, { useEffect, useMemo, useState } from "react";

const solicitudStates = ["Creada", "Enviada", "Respondida", "Rechazada"];

const normalizeInitialData = (initialData) => ({
  id: initialData?.id || null,
  proveedorId: initialData?.proveedorId ? String(initialData.proveedorId) : "",
  requerimientoId: initialData?.requerimientoId
    ? String(initialData.requerimientoId)
    : "",
  elaboradorId: initialData?.elaboradorId || null,
  cuerpoSolicitud: initialData?.cuerpoSolicitud || "",
  estado: initialData?.estado || "Creada",
  itemIds: Array.isArray(initialData?.items)
    ? initialData.items.map((item) => String(item.itemRequerimientoId))
    : [],
});

const SolicitudCotizacionForm = ({
  initialData,
  proveedores,
  requerimientos,
  requerimientoDetalle,
  onRequerimientoChange,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const [formData, setFormData] = useState(() => normalizeInitialData(initialData));

  useEffect(() => {
    setFormData(normalizeInitialData(initialData));
  }, [initialData]);

  useEffect(() => {
    if (formData.requerimientoId) {
      onRequerimientoChange?.(Number(formData.requerimientoId));
    }
  }, [formData.requerimientoId, onRequerimientoChange]);

  const availableItems = useMemo(
    () =>
      Array.isArray(requerimientoDetalle?.items)
        ? requerimientoDetalle.items.filter((item) => item.activo !== false)
        : [],
    [requerimientoDetalle?.items]
  );

  const toggleItem = (itemId) => {
    const nextId = String(itemId);
    setFormData((prev) => ({
      ...prev,
      itemIds: prev.itemIds.includes(nextId)
        ? prev.itemIds.filter((currentId) => currentId !== nextId)
        : [...prev.itemIds, nextId],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onSubmit({
      proveedorId: Number(formData.proveedorId),
      requerimientoId: Number(formData.requerimientoId),
      elaboradorId: Number(formData.elaboradorId),
      cuerpoSolicitud: formData.cuerpoSolicitud.trim() || null,
      estado: formData.estado,
      items: formData.itemIds.map((itemId) => ({
        itemRequerimientoId: Number(itemId),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.id ? "Editar solicitud" : "Nueva solicitud de cotizacion"}
          </h2>
          <p className="text-sm text-gray-600">
            Documento emitido a un proveedor para cotizar items de un requerimiento aprobado.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Proveedor</span>
          <select
            value={formData.proveedorId}
            name="solicitud-cotizacion-form-select-99"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, proveedorId: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Selecciona proveedor</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.razonSocial}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700 md:col-span-2">
          <span className="font-medium">Requerimiento aprobado</span>
          <select
            value={formData.requerimientoId}
            name="solicitud-cotizacion-form-select-118"
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                requerimientoId: event.target.value,
                itemIds: [],
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Selecciona requerimiento</option>
            {requerimientos.map((requerimiento) => (
              <option key={requerimiento.id} value={requerimiento.id}>
                {requerimiento.codigo} � {requerimiento.areaNombreSnapshot || requerimiento.usoFinalidad}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Estado</span>
          <select
            value={formData.estado}
            name="solicitud-cotizacion-form-select-141"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, estado: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {solicitudStates.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm text-gray-700">
        <span className="font-medium">Cuerpo / observaciones de la solicitud</span>
        <textarea
          rows="3"
          value={formData.cuerpoSolicitud}
          name="solicitud-cotizacion-form-textarea-159"
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, cuerpoSolicitud: event.target.value }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Detalle breve para el proveedor o notas internas."
        />
      </label>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-900">Items a cotizar</p>
          <p className="text-xs text-gray-500">
            Selecciona solo los items del requerimiento que iran en esta solicitud.
          </p>
        </div>
        {availableItems.length > 0 ? (
          <div className="grid gap-2">
            {availableItems.map((item) => {
              const checked = formData.itemIds.includes(String(item.id));
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-3 text-sm ${
                    checked
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    name="solicitud-cotizacion-form-input-190" onChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">
                      {item.descripcionVisible}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {item.cantidadRequerida} {item.unidadMedida} � S/ {Number(
                        item.subtotalReferencial || 0
                      ).toFixed(2)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
            Selecciona un requerimiento para cargar sus items.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting || !formData.proveedorId || !formData.requerimientoId || formData.itemIds.length === 0}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : formData.id ? "Actualizar solicitud" : "Crear solicitud"}
        </button>
      </div>
    </form>
  );
};

export default SolicitudCotizacionForm;


