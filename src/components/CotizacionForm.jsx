import React, { useEffect, useMemo, useState } from "react";

const cotizacionStates = ["Pendiente", "Rechazada"];
const formasPago = ["", "ContraEntrega", "Adelanto", "Credito"];
const itemResponseOptions = [
  { value: "COTIZADO", label: "Cotiza" },
  { value: "NO_COTIZA", label: "No cotiza" },
];

const formatNumberInput = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? ""
    : String(value);

const buildDraftItem = (solicitudItem, existing = null) => {
  const itemId =
    solicitudItem.itemRequerimientoId || solicitudItem.itemRequerimiento?.id;
  const requiredQuantity = Number(
    solicitudItem.itemRequerimiento?.cantidadRequerida || 0
  );
  const estadoRespuesta =
    String(existing?.estadoRespuesta || "COTIZADO").toUpperCase() === "NO_COTIZA"
      ? "NO_COTIZA"
      : "COTIZADO";

  return {
    itemRequerimientoId: Number(itemId),
    estadoRespuesta,
    cantidadOfrecida:
      estadoRespuesta === "NO_COTIZA"
        ? ""
        : formatNumberInput(existing?.cantidadOfrecida ?? requiredQuantity),
    precioUnidad:
      estadoRespuesta === "NO_COTIZA"
        ? ""
        : formatNumberInput(existing?.precioUnidad),
    precioTotal:
      estadoRespuesta === "NO_COTIZA"
        ? null
        : Number(existing?.precioTotal ?? 0),
    descripcionTecnicaOfertada: existing?.descripcionTecnicaOfertada || "",
  };
};

const buildItemsFromSolicitud = (solicitud, sourceItems = []) => {
  const solicitudItems = Array.isArray(solicitud?.items) ? solicitud.items : [];

  return solicitudItems.map((solicitudItem) => {
    const itemId =
      solicitudItem.itemRequerimientoId || solicitudItem.itemRequerimiento?.id;
    const existing = sourceItems.find(
      (item) => Number(item.itemRequerimientoId) === Number(itemId)
    );
    return buildDraftItem(solicitudItem, existing);
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
    initialData?.tiempoEntregaDias === null ||
    initialData?.tiempoEntregaDias === undefined
      ? ""
      : String(initialData.tiempoEntregaDias),
  vigenciaOfertaDias:
    initialData?.vigenciaOfertaDias === null ||
    initialData?.vigenciaOfertaDias === undefined
      ? ""
      : String(initialData.vigenciaOfertaDias),
  lugarEntrega: initialData?.lugarEntrega || "",
  formaPago: initialData?.formaPago || "",
  observaciones: initialData?.observaciones || "",
  items: Array.isArray(initialData?.items)
    ? initialData.items.map((item) => ({
        itemRequerimientoId: Number(item.itemRequerimientoId),
        estadoRespuesta:
          String(item.estadoRespuesta || "COTIZADO").toUpperCase() ===
          "NO_COTIZA"
            ? "NO_COTIZA"
            : "COTIZADO",
        cantidadOfrecida: formatNumberInput(item.cantidadOfrecida),
        precioUnidad: formatNumberInput(item.precioUnidad),
        precioTotal:
          item.precioTotal === null || item.precioTotal === undefined
            ? null
            : Number(item.precioTotal),
        descripcionTecnicaOfertada: item.descripcionTecnicaOfertada || "",
      }))
    : [],
});

const CotizacionForm = ({
  initialData,
  solicitudes,
  lockedSolicitudId = null,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const [formData, setFormData] = useState(() => normalizeInitialData(initialData));

  useEffect(() => {
    const nextData = normalizeInitialData(initialData);
    setFormData({
      ...nextData,
      solicitudId: lockedSolicitudId
        ? String(lockedSolicitudId)
        : nextData.solicitudId,
    });
  }, [initialData, lockedSolicitudId]);

  const solicitudSelectionLocked = Boolean(lockedSolicitudId || formData.id);

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

  const updateItemField = (itemRequerimientoId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (Number(item.itemRequerimientoId) !== Number(itemRequerimientoId)) {
          return item;
        }

        const nextItem = {
          ...item,
          [field]: value,
        };

        if (field === "estadoRespuesta" && value === "NO_COTIZA") {
          return {
            ...nextItem,
            cantidadOfrecida: "",
            precioUnidad: "",
            precioTotal: null,
          };
        }

        if (nextItem.estadoRespuesta === "NO_COTIZA") {
          return {
            ...nextItem,
            precioTotal: null,
          };
        }

        const cantidad = Number(nextItem.cantidadOfrecida || 0);
        const precioUnidad = Number(nextItem.precioUnidad || 0);

        return {
          ...nextItem,
          precioTotal:
            Number.isFinite(cantidad) && Number.isFinite(precioUnidad)
              ? cantidad * precioUnidad
              : 0,
        };
      }),
    }));
  };

  const totalOferta = useMemo(
    () =>
      formData.items.reduce(
        (acc, item) =>
          item.estadoRespuesta === "COTIZADO"
            ? acc + Number(item.precioTotal || 0)
            : acc,
        0
      ),
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
      tiempoEntregaDias:
        formData.tiempoEntregaDias === "" ? null : Number(formData.tiempoEntregaDias),
      vigenciaOfertaDias:
        formData.vigenciaOfertaDias === "" ? null : Number(formData.vigenciaOfertaDias),
      lugarEntrega: formData.lugarEntrega.trim() || null,
      formaPago: formData.formaPago || null,
      observaciones: formData.observaciones.trim() || null,
      items: formData.items.map((item) => ({
        itemRequerimientoId: Number(item.itemRequerimientoId),
        estadoRespuesta: item.estadoRespuesta,
        cantidadOfrecida:
          item.estadoRespuesta === "NO_COTIZA"
            ? null
            : Number(item.cantidadOfrecida),
        precioUnidad:
          item.estadoRespuesta === "NO_COTIZA"
            ? null
            : Number(item.precioUnidad),
        precioTotal:
          item.estadoRespuesta === "NO_COTIZA"
            ? null
            : Number(item.precioTotal || 0),
        descripcionTecnicaOfertada:
          item.descripcionTecnicaOfertada?.trim() || null,
      })),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.id ? "Editar cotizacion" : "Nueva cotizacion"}
          </h2>
          <p className="text-sm text-gray-600">
            Registra una sola respuesta activa del proveedor y resuelve cada item
            de la solicitud como cotizado o no cotizado.
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
            name="cotizacion-form-input-codigo"
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
            name="cotizacion-form-select-solicitud"
            disabled={solicitudSelectionLocked}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                solicitudId: event.target.value,
                items: [],
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600"
            required
          >
            <option value="">Selecciona solicitud</option>
            {solicitudes.map((solicitud) => (
              <option key={solicitud.id} value={solicitud.id}>
                {solicitud.codigo} · {solicitud.proveedor?.razonSocial}
              </option>
            ))}
          </select>
          {solicitudSelectionLocked ? (
            <span className="text-xs text-gray-500">
              La cotizacion queda vinculada a esta solicitud y a su proveedor.
            </span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Fecha</span>
          <input
            type="date"
            value={formData.fechaEmision}
            name="cotizacion-form-input-fecha"
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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Proveedor
            </p>
            <p className="font-medium text-gray-900">
              {selectedSolicitud.proveedor?.razonSocial || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Requerimiento
            </p>
            <p className="font-medium text-gray-900">
              {selectedSolicitud.requerimiento?.codigo || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Estado solicitud
            </p>
            <p className="font-medium text-gray-900">
              {selectedSolicitud.estado || "-"}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Estado</span>
          <select
            value={formData.estado}
            name="cotizacion-form-select-estado"
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
            name="cotizacion-form-input-garantia"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, garantia: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Ej. Carta fianza"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Tiempo de entrega (dias)</span>
          <input
            type="number"
            min="0"
            value={formData.tiempoEntregaDias}
            name="cotizacion-form-input-entrega"
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                tiempoEntregaDias: event.target.value,
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Vigencia de oferta (dias)</span>
          <input
            type="number"
            min="0"
            value={formData.vigenciaOfertaDias}
            name="cotizacion-form-input-vigencia"
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                vigenciaOfertaDias: event.target.value,
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Lugar de entrega</span>
          <input
            type="text"
            value={formData.lugarEntrega}
            name="cotizacion-form-input-lugar"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, lugarEntrega: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Forma de pago</span>
          <select
            value={formData.formaPago}
            name="cotizacion-form-select-forma-pago"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, formaPago: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {formasPago.map((formaPago) => (
              <option key={formaPago || "empty"} value={formaPago}>
                {formaPago || "Seleccionar"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm text-gray-700">
        <span className="font-medium">Observaciones</span>
        <textarea
          value={formData.observaciones}
          name="cotizacion-form-textarea-observaciones"
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, observaciones: event.target.value }))
          }
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Notas comerciales o condiciones particulares."
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Respuesta por item
            </h3>
            <p className="text-sm text-gray-600">
              Cada item invitado debe quedar resuelto como oferta cotizada o no
              cotizada.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Total oferta
            </p>
            <p className="text-lg font-semibold text-emerald-900">
              S/ {totalOferta.toFixed(2)}
            </p>
          </div>
        </div>

        {selectedSolicitud ? (
          <div className="space-y-3">
            {formData.items.map((item) => {
              const solicitudItem = selectedSolicitud.items?.find(
                (entry) =>
                  Number(entry.itemRequerimientoId || entry.itemRequerimiento?.id) ===
                  Number(item.itemRequerimientoId)
              );
              const itemSolicitado = solicitudItem?.itemRequerimiento || {};
              const descripcionSolicitada =
                itemSolicitado.producto?.descripcion ||
                itemSolicitado.productoTemporal?.descripcion ||
                "";

              return (
                <div
                  key={item.itemRequerimientoId}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {itemSolicitado.descripcionVisible ||
                          `Item ${item.itemRequerimientoId}`}
                      </p>
                      {descripcionSolicitada &&
                      descripcionSolicitada !== itemSolicitado.descripcionVisible ? (
                        <p className="mt-1 whitespace-pre-line text-xs text-gray-500">
                          {descripcionSolicitada}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-gray-500">
                        Cantidad requerida:{" "}
                        {Number(
                          itemSolicitado.cantidadRequerida || 0
                        )}{" "}
                        {itemSolicitado.unidadMedida || ""}
                      </p>
                    </div>

                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">Respuesta</span>
                      <select
                        value={item.estadoRespuesta}
                        name={`cotizacion-form-select-respuesta-${item.itemRequerimientoId}`}
                        onChange={(event) =>
                          updateItemField(
                            item.itemRequerimientoId,
                            "estadoRespuesta",
                            event.target.value
                          )
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      >
                        {itemResponseOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">Cantidad ofrecida</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cantidadOfrecida}
                        disabled={item.estadoRespuesta === "NO_COTIZA"}
                        name={`cotizacion-form-input-cantidad-${item.itemRequerimientoId}`}
                        onChange={(event) =>
                          updateItemField(
                            item.itemRequerimientoId,
                            "cantidadOfrecida",
                            event.target.value
                          )
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                        required={item.estadoRespuesta === "COTIZADO"}
                      />
                    </label>

                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">Precio unitario</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precioUnidad}
                        disabled={item.estadoRespuesta === "NO_COTIZA"}
                        name={`cotizacion-form-input-precio-${item.itemRequerimientoId}`}
                        onChange={(event) =>
                          updateItemField(
                            item.itemRequerimientoId,
                            "precioUnidad",
                            event.target.value
                          )
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                        required={item.estadoRespuesta === "COTIZADO"}
                      />
                    </label>
                  </div>

                  <label className="mt-3 block space-y-1 text-sm text-gray-700">
                    <span className="font-medium">
                      Descripcion tecnica ofertada
                    </span>
                    <textarea
                      rows="3"
                      maxLength={1000}
                      value={item.descripcionTecnicaOfertada}
                      name={`cotizacion-form-textarea-descripcion-ofertada-${item.itemRequerimientoId}`}
                      onChange={(event) =>
                        updateItemField(
                          item.itemRequerimientoId,
                          "descripcionTecnicaOfertada",
                          event.target.value
                        )
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Opcional. Registra marca, modelo, caracteristicas o mejoras si la oferta precisa algo distinto a lo solicitado."
                    />
                    <span className="block text-right text-xs text-gray-500">
                      {String(item.descripcionTecnicaOfertada || "").length}/1000
                    </span>
                  </label>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 font-medium ${
                        item.estadoRespuesta === "NO_COTIZA"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.estadoRespuesta === "NO_COTIZA"
                        ? "Proveedor no cotiza este item"
                        : "Item cotizado"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {item.estadoRespuesta === "NO_COTIZA"
                        ? "Sin oferta"
                        : `Subtotal: S/ ${Number(item.precioTotal || 0).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Selecciona una solicitud para registrar la respuesta del proveedor.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting
            ? "Guardando..."
            : formData.id
              ? "Actualizar cotizacion"
              : "Registrar cotizacion"}
        </button>
      </div>
    </form>
  );
};

export default CotizacionForm;
