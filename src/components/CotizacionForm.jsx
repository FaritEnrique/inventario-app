import React, { useEffect, useMemo, useState } from "react";

const cotizacionStates = [
  "Pendiente",
  "Rechazada",
];

const formasPago = ["", "ContraEntrega", "Adelanto", "Credito"];

const buildItemsFromSolicitud = (solicitud, sourceItems = []) => {
  const solicitudItems = Array.isArray(solicitud?.items) ? solicitud.items : [];

  return solicitudItems.map((solicitudItem) => {
    const itemId = solicitudItem.itemRequerimientoId || solicitudItem.itemRequerimiento?.id;
    const existing = sourceItems.find(
      (item) => Number(item.itemRequerimientoId) === Number(itemId)
    );
    const cantidadBase = Number(
      existing?.cantidadOfrecida ?? solicitudItem.itemRequerimiento?.cantidadRequerida ?? 0
    );
    const precioUnidad = Number(existing?.precioUnidad ?? 0);
    const precioTotal = Number(existing?.precioTotal ?? cantidadBase * precioUnidad);

    return {
      itemRequerimientoId: Number(itemId),
      cantidadOfrecida: cantidadBase,
      precioUnidad,
      precioTotal,
    };
  });
};

const normalizeInitialData = (initialData) => ({
  id: initialData?.id || null,
  codigo: initialData?.codigo || "",
  solicitudId: initialData?.solicitudId ? String(initialData.solicitudId) : "",
  fechaEmision: initialData?.fechaEmision
    ? new Date(initialData.fechaEmision).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10),
  estado: initialData?.estado || "Pendiente",
  garantia: initialData?.garantia || "",
  tiempoEntregaDias:
    initialData?.tiempoEntregaDias === null || initialData?.tiempoEntregaDias === undefined
      ? ""
      : String(initialData.tiempoEntregaDias),
  lugarEntrega: initialData?.lugarEntrega || "",
  formaPago: initialData?.formaPago || "",
  items: Array.isArray(initialData?.items)
    ? initialData.items.map((item) => ({
        itemRequerimientoId: Number(item.itemRequerimientoId),
        cantidadOfrecida: Number(item.cantidadOfrecida || 0),
        precioUnidad: Number(item.precioUnidad || 0),
        precioTotal: Number(item.precioTotal || 0),
      }))
    : [],
});

const CotizacionForm = ({
  initialData,
  solicitudes,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const [formData, setFormData] = useState(() => normalizeInitialData(initialData));

  useEffect(() => {
    setFormData(normalizeInitialData(initialData));
  }, [initialData]);

  const selectedSolicitud = useMemo(
    () =>
      solicitudes.find(
        (solicitud) => String(solicitud.id) === String(formData.solicitudId)
      ) || null,
    [formData.solicitudId, solicitudes]
  );

  useEffect(() => {
    if (!selectedSolicitud) return;

    setFormData((prev) => ({
      ...prev,
      items: buildItemsFromSolicitud(selectedSolicitud, prev.items),
    }));
  }, [selectedSolicitud]);

  const updateItem = (itemRequerimientoId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.itemRequerimientoId !== itemRequerimientoId) {
          return item;
        }

        const nextItem = {
          ...item,
          [field]: Number(value),
        };

        return {
          ...nextItem,
          precioTotal: Number(nextItem.cantidadOfrecida || 0) * Number(nextItem.precioUnidad || 0),
        };
      }),
    }));
  };

  const totalOferta = useMemo(
    () => formData.items.reduce((acc, item) => acc + Number(item.precioTotal || 0), 0),
    [formData.items]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onSubmit({
      codigo: formData.codigo.trim(),
      solicitudId: Number(formData.solicitudId),
      proveedorId: selectedSolicitud?.proveedorId || selectedSolicitud?.proveedor?.id,
      fechaEmision: formData.fechaEmision,
      estado: formData.estado,
      garantia: formData.garantia.trim() || null,
      tiempoEntregaDias: formData.tiempoEntregaDias === "" ? null : Number(formData.tiempoEntregaDias),
      lugarEntrega: formData.lugarEntrega.trim() || null,
      formaPago: formData.formaPago || null,
      items: formData.items.map((item) => ({
        itemRequerimientoId: Number(item.itemRequerimientoId),
        cantidadOfrecida: Number(item.cantidadOfrecida || 0),
        precioUnidad: Number(item.precioUnidad || 0),
        precioTotal: Number(item.precioTotal || 0),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.id ? "Editar cotizacion" : "Nueva cotizacion"}
          </h2>
          <p className="text-sm text-gray-600">
            Propuesta economica y comercial registrada contra una solicitud concreta. La adjudicacion final la define la jefatura desde el cuadro comparativo.
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
          <span className="font-medium">Codigo</span>
          <input
            type="text"
            value={formData.codigo}
            name="cotizacion-form-input-161"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, codigo: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="COT-001"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700 xl:col-span-2">
          <span className="font-medium">Solicitud de cotizacion</span>
          <select
            value={formData.solicitudId}
            name="cotizacion-form-select-175"
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                solicitudId: event.target.value,
                items: [],
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Selecciona solicitud</option>
            {solicitudes.map((solicitud) => (
              <option key={solicitud.id} value={solicitud.id}>
                {solicitud.codigo} · {solicitud.proveedor?.razonSocial}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Fecha</span>
          <input
            type="date"
            value={formData.fechaEmision}
            name="cotizacion-form-input-198"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, fechaEmision: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </label>
      </div>

      {selectedSolicitud && (
        <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Proveedor</p>
            <p className="font-medium text-gray-900">{selectedSolicitud.proveedor?.razonSocial || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requerimiento</p>
            <p className="font-medium text-gray-900">{selectedSolicitud.requerimiento?.codigo || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado solicitud</p>
            <p className="font-medium text-gray-900">{selectedSolicitud.estado || "-"}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Estado</span>
          <select
            value={formData.estado}
            name="cotizacion-form-select-230"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, estado: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {cotizacionStates.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Garantia</span>
          <input
            type="text"
            value={formData.garantia}
            name="cotizacion-form-input-247"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, garantia: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="12 meses"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Entrega (dias)</span>
          <input
            type="number"
            min="0"
            value={formData.tiempoEntregaDias}
            name="cotizacion-form-input-260"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, tiempoEntregaDias: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Forma de pago</span>
          <select
            value={formData.formaPago}
            name="cotizacion-form-select-273"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, formaPago: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {formasPago.map((formaPago) => (
              <option key={formaPago || "vacio"} value={formaPago}>
                {formaPago || "Sin definir"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm text-gray-700">
        <span className="font-medium">Lugar de entrega</span>
        <input
          type="text"
          value={formData.lugarEntrega}
          name="cotizacion-form-input-291"
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, lugarEntrega: event.target.value }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Oficina central"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Detalle economico</p>
            <p className="text-xs text-gray-500">Carga cantidades y precio unitario por item solicitado.</p>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            Total oferta: S/ {totalOferta.toFixed(2)}
          </p>
        </div>

        {selectedSolicitud?.items?.length ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Cantidad</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">P. unitario</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">P. total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {selectedSolicitud.items.map((solicitudItem) => {
                  const itemId = solicitudItem.itemRequerimientoId || solicitudItem.itemRequerimiento?.id;
                  const currentItem = formData.items.find(
                    (item) => item.itemRequerimientoId === Number(itemId)
                  );

                  return (
                    <tr key={itemId}>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">
                          {solicitudItem.itemRequerimiento?.descripcionVisible || "Item"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {solicitudItem.itemRequerimiento?.cantidadRequerida || 0} {solicitudItem.itemRequerimiento?.unidadMedida || ""}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentItem?.cantidadOfrecida ?? 0}
                          name="cotizacion-form-input-342"
                          onChange={(event) =>
                            updateItem(Number(itemId), "cantidadOfrecida", event.target.value)
                          }
                          className="w-24 rounded border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentItem?.precioUnidad ?? 0}
                          name="cotizacion-form-input-354"
                          onChange={(event) =>
                            updateItem(Number(itemId), "precioUnidad", event.target.value)
                          }
                          className="w-28 rounded border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">
                        S/ {Number(currentItem?.precioTotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
            Selecciona una solicitud para cargar sus items.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting || !formData.codigo.trim() || !formData.solicitudId || formData.items.length === 0}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : formData.id ? "Actualizar cotizacion" : "Crear cotizacion"}
        </button>
      </div>
    </form>
  );
};

export default CotizacionForm;


