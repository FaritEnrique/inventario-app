import React, { useEffect, useId, useMemo, useState } from "react";
import CatalogoSelectorModal from "./CatalogoSelectorModal";
import useTipoProductos from "../hooks/useTipoProductos";

const solicitudStates = ["Creada", "Enviada", "Respondida", "Rechazada"];
const solicitudCurrencies = [
  { value: "PEN", label: "PEN (S/)" },
  { value: "USD", label: "USD (US$)" },
];
const medioRecepcionOptions = [
  { value: "CORREO", label: "Correo" },
  { value: "SISTEMA", label: "Sistema" },
  { value: "CORREO_Y_SISTEMA", label: "Correo y sistema" },
];

const formatDateTimeLocalInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const normalizeInitialData = (initialData) => ({
  id: initialData?.id || null,
  proveedorId: initialData?.proveedorId ? String(initialData.proveedorId) : "",
  requerimientoId: initialData?.requerimientoId
    ? String(initialData.requerimientoId)
    : "",
  cuerpoSolicitud: initialData?.cuerpoSolicitud || "",
  estado: initialData?.estado || "Creada",
  itemIds: Array.isArray(initialData?.items)
    ? initialData.items.map((item) => String(item.itemRequerimientoId))
    : [],
  vigenciaOfertaDias:
    initialData?.vigenciaOfertaDias != null
      ? String(initialData.vigenciaOfertaDias)
      : "",
  moneda: initialData?.moneda || "PEN",
  incluyeIgv:
    typeof initialData?.incluyeIgv === "boolean"
      ? String(initialData.incluyeIgv)
      : "true",
  tiempoEntregaDias:
    initialData?.tiempoEntregaDias != null
      ? String(initialData.tiempoEntregaDias)
      : "",
  lugarEntrega: initialData?.lugarEntrega || "",
  formaPago: initialData?.formaPago || "",
  garantia: initialData?.garantia || "",
  fechaLimiteRecepcion: formatDateTimeLocalInput(
    initialData?.fechaLimiteRecepcion,
  ),
  medioRecepcion: initialData?.medioRecepcion || "CORREO",
});

const getProveedorTipoProductoIds = (proveedor) => {
  if (!proveedor || !Array.isArray(proveedor.especialidades)) {
    return [];
  }

  return proveedor.especialidades
    .map((item) => item?.tipoProductoId || item?.tipoProducto?.id)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
};

const getProveedorEspecialidades = (proveedor) => {
  if (!proveedor || !Array.isArray(proveedor.especialidades)) {
    return [];
  }

  return proveedor.especialidades
    .map((especialidad) => String(especialidad?.tipoProducto?.nombre || "").trim())
    .filter(Boolean);
};

const getProveedorNombre = (proveedor) =>
  String(proveedor?.razonSocial || "").trim() || "Proveedor sin razon social";

const buildProveedorOptionDescription = (proveedor) => {
  const especialidades = getProveedorEspecialidades(proveedor);
  const especialidadesPreview =
    especialidades.length > 2
      ? `${especialidades.slice(0, 2).join(", ")} +${especialidades.length - 2}`
      : especialidades.join(", ");

  return [
    proveedor?.ruc ? `RUC: ${proveedor.ruc}` : null,
    proveedor?.correoElectronico ? `Correo: ${proveedor.correoElectronico}` : null,
    proveedor?.telefono ? `Tel: ${proveedor.telefono}` : null,
    especialidadesPreview ? `Tipos: ${especialidadesPreview}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
};

const ProveedorSummaryField = ({ label, value }) =>
  value ? (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-gray-700">{value}</p>
    </div>
  ) : null;

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
  const formIdPrefix = useId();
  const { tiposProducto, cargando: loadingTiposProducto } = useTipoProductos();
  const isEditing = Boolean(initialData?.id);
  const [formData, setFormData] = useState(() =>
    normalizeInitialData(initialData),
  );
  const [proveedorSearch, setProveedorSearch] = useState("");
  const [tipoProductoFiltroId, setTipoProductoFiltroId] = useState("");
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);

  useEffect(() => {
    setFormData(normalizeInitialData(initialData));
    setProveedorSearch("");
    setTipoProductoFiltroId("");
    setProveedorModalOpen(false);
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
    [requerimientoDetalle?.items],
  );

  const filteredProveedores = useMemo(() => {
    const normalizedSearch = proveedorSearch.trim().toLowerCase();
    const tipoProductoId = tipoProductoFiltroId
      ? Number(tipoProductoFiltroId)
      : null;

    return proveedores.filter((proveedor) => {
      const matchesSearch =
        !normalizedSearch ||
        String(proveedor.razonSocial || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(proveedor.ruc || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const proveedorTipoProductoIds = getProveedorTipoProductoIds(proveedor);
      const matchesTipoProducto =
        !tipoProductoId || proveedorTipoProductoIds.includes(tipoProductoId);

      return matchesSearch && matchesTipoProducto;
    });
  }, [proveedores, proveedorSearch, tipoProductoFiltroId]);

  const proveedorSeleccionado = useMemo(
    () =>
      proveedores.find(
        (proveedor) => String(proveedor.id) === String(formData.proveedorId),
      ) || null,
    [proveedores, formData.proveedorId],
  );

  const proveedorEspecialidades = useMemo(
    () => getProveedorEspecialidades(proveedorSeleccionado),
    [proveedorSeleccionado],
  );

  const tiposProductoActivos = tiposProducto.filter(
    (tipoProducto) => tipoProducto.activo !== false,
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
      cuerpoSolicitud: formData.cuerpoSolicitud.trim() || null,
      estado: formData.estado,
      moneda: formData.moneda,
      incluyeIgv: formData.incluyeIgv === "true",
      vigenciaOfertaDias:
        formData.vigenciaOfertaDias !== ""
          ? Number(formData.vigenciaOfertaDias)
          : null,
      tiempoEntregaDias:
        formData.tiempoEntregaDias !== ""
          ? Number(formData.tiempoEntregaDias)
          : null,
      lugarEntrega: formData.lugarEntrega.trim() || null,
      formaPago: formData.formaPago || null,
      garantia: formData.garantia.trim() || null,
      fechaLimiteRecepcion: formData.fechaLimiteRecepcion
        ? new Date(formData.fechaLimiteRecepcion).toISOString()
        : null,
      medioRecepcion: formData.medioRecepcion || null,
      items: formData.itemIds.map((itemId) => ({
        itemRequerimientoId: Number(itemId),
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
            {formData.id ? "Editar solicitud" : "Nueva solicitud de cotizacion"}
          </h2>
          <p className="text-sm text-gray-600">
            Documento emitido a un proveedor para cotizar items de un
            requerimiento aprobado.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:col-span-2 xl:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Proveedor</p>
              <p className="mt-1 text-xs text-gray-500">
                Busca por razon social o RUC y selecciona un proveedor para la
                solicitud.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProveedorModalOpen(true)}
              className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              {proveedorSeleccionado ? "Cambiar proveedor" : "Seleccionar proveedor"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Filtrar por tipo de producto</span>
              <select
                id={`${formIdPrefix}-tipo-producto-filtro`}
                name="tipoProductoFiltroId"
                value={tipoProductoFiltroId}
                onChange={(event) => setTipoProductoFiltroId(event.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2"
                disabled={loadingTiposProducto}
              >
                <option value="">Todos los tipos</option>
                {tiposProductoActivos.map((tipoProducto) => (
                  <option key={tipoProducto.id} value={tipoProducto.id}>
                    {tipoProducto.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded border border-dashed border-gray-300 bg-white px-3 py-2 text-xs text-gray-500">
              {filteredProveedores.length} proveedor(es) disponibles con el
              filtro actual.
            </div>
          </div>

          {proveedorSeleccionado ? (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
                    Proveedor seleccionado
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900">
                    {getProveedorNombre(proveedorSeleccionado)}
                  </h3>
                  {proveedorSeleccionado.ruc ? (
                    <p className="mt-1 text-xs text-gray-600">
                      RUC: {proveedorSeleccionado.ruc}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setProveedorModalOpen(true)}
                  className="rounded border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  Cambiar
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ProveedorSummaryField
                  label="Correo"
                  value={proveedorSeleccionado.correoElectronico}
                />
                <ProveedorSummaryField
                  label="Telefono"
                  value={proveedorSeleccionado.telefono}
                />
                <ProveedorSummaryField
                  label="Direccion"
                  value={proveedorSeleccionado.direccion}
                />
                <ProveedorSummaryField
                  label="Contacto"
                  value={proveedorSeleccionado.contacto}
                />
                <ProveedorSummaryField
                  label="Representante"
                  value={proveedorSeleccionado.representante}
                />
              </div>

              {proveedorEspecialidades.length > 0 ? (
                <div className="mt-4 border-t border-indigo-200 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Tipos de producto
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {proveedorEspecialidades.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
              Aun no se selecciono proveedor. Usa el selector para buscar por
              razon social o RUC.
            </div>
          )}
        </div>

        <label className="space-y-1 text-sm text-gray-700 md:col-span-2 xl:col-span-2">
          <span className="font-medium">Requerimiento aprobado</span>
          <select
            value={formData.requerimientoId}
            name="solicitud-cotizacion-form-select-requerimiento"
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
                {requerimiento.codigo} -{" "}
                {requerimiento.areaNombreSnapshot || requerimiento.usoFinalidad}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isEditing ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Estado</span>
            <select
              value={formData.estado}
              name="solicitud-cotizacion-form-select-estado"
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
      ) : null}

      <label className="block space-y-1 text-sm text-gray-700">
        <span className="font-medium">
          Cuerpo / observaciones de la solicitud
        </span>
        <textarea
          rows="3"
          value={formData.cuerpoSolicitud}
          name="solicitud-cotizacion-form-textarea"
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              cuerpoSolicitud: event.target.value,
            }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Detalle breve para el proveedor o notas internas."
        />
      </label>

      <div>
        <p className="text-sm font-medium text-gray-900">
          Condiciones documentarias
        </p>
        <p className="mb-3 text-xs text-gray-500">
          Estos campos alimentan el documento formal de la solicitud. El
          proveedor puede responder con valores distintos en su cotizacion.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Moneda</span>
            <select
              id={`${formIdPrefix}-moneda`}
              name="moneda"
              value={formData.moneda}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  moneda: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            >
              {solicitudCurrencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Incluye IGV</span>
            <select
              id={`${formIdPrefix}-incluye-igv`}
              name="incluyeIgv"
              value={formData.incluyeIgv}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  incluyeIgv: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            >
              <option value="true">Si</option>
              <option value="false">No</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Vigencia de oferta (dias)</span>
            <input
              id={`${formIdPrefix}-vigencia-oferta-dias`}
              name="vigenciaOfertaDias"
              type="number"
              min="1"
              value={formData.vigenciaOfertaDias}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  vigenciaOfertaDias: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Ej: 15"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Tiempo de entrega (dias)</span>
            <input
              id={`${formIdPrefix}-tiempo-entrega-dias`}
              name="tiempoEntregaDias"
              type="number"
              min="1"
              value={formData.tiempoEntregaDias}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  tiempoEntregaDias: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Ej: 7"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Fecha limite de recepcion</span>
            <input
              id={`${formIdPrefix}-fecha-limite-recepcion`}
              name="fechaLimiteRecepcion"
              type="datetime-local"
              value={formData.fechaLimiteRecepcion}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  fechaLimiteRecepcion: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Medio de recepcion</span>
            <select
              id={`${formIdPrefix}-medio-recepcion`}
              name="medioRecepcion"
              value={formData.medioRecepcion}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  medioRecepcion: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            >
              {medioRecepcionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Forma de pago</span>
            <select
              id={`${formIdPrefix}-forma-pago`}
              name="formaPago"
              value={formData.formaPago}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  formaPago: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Sin especificar</option>
              <option value="ContraEntrega">Contra entrega</option>
              <option value="Adelanto">Adelanto</option>
              <option value="Credito">Al credito</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Lugar de entrega</span>
            <input
              id={`${formIdPrefix}-lugar-entrega`}
              name="lugarEntrega"
              type="text"
              value={formData.lugarEntrega}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  lugarEntrega: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Ej: Almacen central"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Garantia</span>
            <input
              id={`${formIdPrefix}-garantia`}
              name="garantia"
              type="text"
              value={formData.garantia}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  garantia: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Ej: 6 meses contra defectos de fabrica"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-900">Items a cotizar</p>
          <p className="text-xs text-gray-500">
            Selecciona solo los items del requerimiento que iran en esta
            solicitud.
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
                    onChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">
                      {item.descripcionVisible}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {item.cantidadRequerida} {item.unidadMedida} - S/{" "}
                      {Number(item.subtotalReferencial || 0).toFixed(2)}
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
          disabled={
            submitting ||
            !formData.proveedorId ||
            !formData.requerimientoId ||
            formData.itemIds.length === 0
          }
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Guardando..."
            : formData.id
              ? "Actualizar solicitud"
              : "Crear solicitud"}
        </button>
      </div>

      <CatalogoSelectorModal
        isOpen={proveedorModalOpen}
        onClose={() => setProveedorModalOpen(false)}
        title="Seleccionar proveedor"
        searchValue={proveedorSearch}
        onSearchChange={setProveedorSearch}
        searchLabel="Buscar proveedor por razon social o RUC"
        searchPlaceholder="Escribe razon social o RUC"
        items={filteredProveedores}
        selectedId={formData.proveedorId}
        onSelect={(proveedor) =>
          setFormData((prev) => ({
            ...prev,
            proveedorId: String(proveedor.id),
          }))
        }
        onClearSelection={() =>
          setFormData((prev) => ({
            ...prev,
            proveedorId: "",
          }))
        }
        getOptionLabel={getProveedorNombre}
        getOptionDescription={buildProveedorOptionDescription}
        emptyMessage="No se encontraron proveedores con ese criterio."
        emptyStateHint={
          tipoProductoFiltroId
            ? "Prueba con otro termino de busqueda o limpia el filtro por tipo de producto."
            : "Prueba buscando por razon social o RUC."
        }
      />
    </form>
  );
};

export default SolicitudCotizacionForm;
