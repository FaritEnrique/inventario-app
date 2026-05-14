import React, { useEffect, useId, useMemo, useState } from "react";
import CatalogoSelectorModal from "./CatalogoSelectorModal";
import useTipoProductos from "../hooks/useTipoProductos";
import {
  buildSolicitudCotizacionPayload,
  buildImportPaymentInstrumentFormState,
  buildImportPaymentStructureFormState,
  buildLocalPaymentConditionFormState,
  buildTipoCompraFormState,
  clearTipoCompraRelatedErrors,
  resolveLocalPaymentFormValue,
} from "./solicitudCotizacionFormModel";
import {
  BANK_CHARGE_PARTY_OPTIONS,
  IMPORT_PAYMENT_INSTRUMENT_OPTIONS,
  IMPORT_PAYMENT_STRUCTURE_OPTIONS,
  IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS,
  IMPORT_PAYMENT_TRIGGER_OPTIONS,
  INCOTERM_GROUPS,
  INCOTERM_METADATA,
  INCOTERM_VERSION_2020,
  LOCAL_DELIVERY_PLACE_TYPE_OPTIONS,
  LOCAL_LOGISTICS_RESPONSIBLE_PARTY_OPTIONS,
  LOCAL_PAYMENT_FORM_OPTIONS,
  LOCAL_PURCHASE_SCOPE_OPTIONS,
  LOCAL_TAX_NOTICE,
  SOLICITUD_COTIZACION_CURRENCY_OPTIONS,
  SOLICITUD_COTIZACION_RECEPTION_CHANNEL_OPTIONS,
} from "../features/solicitud-cotizacion/solicitudCotizacionCatalog";

const solicitudStates = ["Creada", "Enviada", "Respondida", "Rechazada"];
const solicitudCurrencies = SOLICITUD_COTIZACION_CURRENCY_OPTIONS;
const medioRecepcionOptions = SOLICITUD_COTIZACION_RECEPTION_CHANNEL_OPTIONS;
const solicitudCurrencyValues = new Set(
  solicitudCurrencies.map((option) => option.value),
);
const medioRecepcionValues = new Set(
  medioRecepcionOptions.map((option) => option.value),
);

const PERCENTAGE_TOLERANCE = 0.0001;

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

const splitDateTimeLocal = (value) => {
  const formatted = formatDateTimeLocalInput(value);

  if (!formatted) {
    return { date: "", time: "" };
  }

  const [date = "", time = ""] = formatted.split("T");
  return { date, time };
};

const formatFechaLimiteDisplay = (value) => {
  if (!value) return "Sin fijar";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fijar";

  return parsed.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const clearFormErrorKeys = (prevErrors, keys) => {
  const nextErrors = { ...prevErrors };
  keys.forEach((key) => {
    nextErrors[key] = undefined;
  });
  return nextErrors;
};

const inferTipoCompra = (initialData = {}) => {
  if (initialData?.tipoCompra) {
    return String(initialData.tipoCompra);
  }

  if (
    initialData?.incoterm ||
    initialData?.estructuraPagoImportacion ||
    initialData?.instrumentoPagoImportacion ||
    initialData?.gatilloPagoImportacion ||
    initialData?.porcentajeAnticipoImportacion != null ||
    initialData?.porcentajeSaldoImportacion != null ||
    initialData?.diasCreditoImportacion != null ||
    initialData?.referenciaPlazoImportacion ||
    initialData?.gastosBancariosPor
  ) {
    return "IMPORTACION";
  }

  if (
    initialData?.condicionPagoLocal ||
    initialData?.hitoPagoLocal ||
    initialData?.porcentajeAnticipoLocal != null ||
    initialData?.porcentajeSaldoLocal != null ||
    initialData?.diasCreditoLocal != null ||
    initialData?.alcanceCompraLocal ||
    initialData?.lugarEntregaLocalTipo ||
    initialData?.lugarEntregaLocalDetalle ||
    initialData?.transporteAsumidoPor ||
    initialData?.cargaDescargaAsumidaPor ||
    initialData?.permiteEntregasParciales != null ||
    initialData?.condicionesLogisticasLocales
  ) {
    return "LOCAL";
  }

  return "";
};

const normalizeInitialData = (initialData = {}) => {
  const tipoCompra = inferTipoCompra(initialData);

  return {
    id: initialData?.id || null,
    proveedorId: initialData?.proveedorId
      ? String(initialData.proveedorId)
      : "",
    requerimientoId: initialData?.requerimientoId
      ? String(initialData.requerimientoId)
      : "",
    cuerpoSolicitud: initialData?.cuerpoSolicitud || "",
    estado: initialData?.estado || "Creada",
    itemIds: Array.isArray(initialData?.items)
      ? initialData.items
          .map((item) => item?.itemRequerimientoId ?? item?.id ?? item)
          .map((itemId) => String(itemId))
          .filter(Boolean)
      : [],
    vigenciaOfertaDias:
      initialData?.vigenciaOfertaDias != null
        ? String(initialData.vigenciaOfertaDias)
        : "",
    moneda: solicitudCurrencyValues.has(initialData?.moneda)
      ? initialData.moneda
      : "PEN",
    codigoMonedaOtra: initialData?.codigoMonedaOtra || "",
    incluyeIgv:
      typeof initialData?.incluyeIgv === "boolean"
        ? String(initialData.incluyeIgv)
        : "true",
    tiempoEntregaDias:
      initialData?.tiempoEntregaDias != null
        ? String(initialData.tiempoEntregaDias)
        : "",
    lugarEntrega: initialData?.lugarEntrega || "",
    alcanceCompraLocal: initialData?.alcanceCompraLocal || "",
    lugarEntregaLocalTipo: initialData?.lugarEntregaLocalTipo || "",
    lugarEntregaLocalDetalle: initialData?.lugarEntregaLocalDetalle || "",
    transporteAsumidoPor: initialData?.transporteAsumidoPor || "",
    cargaDescargaAsumidaPor: initialData?.cargaDescargaAsumidaPor || "",
    permiteEntregasParciales:
      typeof initialData?.permiteEntregasParciales === "boolean"
        ? String(initialData.permiteEntregasParciales)
        : "",
    condicionesLogisticasLocales:
      initialData?.condicionesLogisticasLocales || "",
    condicionPagoLocal: initialData?.condicionPagoLocal || "",
    hitoPagoLocal: initialData?.hitoPagoLocal || "",
    porcentajeAnticipoLocal:
      initialData?.porcentajeAnticipoLocal != null
        ? String(initialData.porcentajeAnticipoLocal)
        : "",
    porcentajeSaldoLocal:
      initialData?.porcentajeSaldoLocal != null
        ? String(initialData.porcentajeSaldoLocal)
        : "",
    diasCreditoLocal:
      initialData?.diasCreditoLocal != null
        ? String(initialData.diasCreditoLocal)
        : "",
    estructuraPagoImportacion: initialData?.estructuraPagoImportacion || "",
    instrumentoPagoImportacion: initialData?.instrumentoPagoImportacion || "",
    gatilloPagoImportacion: initialData?.gatilloPagoImportacion || "",
    porcentajeAnticipoImportacion:
      initialData?.porcentajeAnticipoImportacion != null
        ? String(initialData.porcentajeAnticipoImportacion)
        : "",
    porcentajeSaldoImportacion:
      initialData?.porcentajeSaldoImportacion != null
        ? String(initialData.porcentajeSaldoImportacion)
        : "",
    diasCreditoImportacion:
      initialData?.diasCreditoImportacion != null
        ? String(initialData.diasCreditoImportacion)
        : "",
    referenciaPlazoImportacion: initialData?.referenciaPlazoImportacion || "",
    gastosBancariosPor: initialData?.gastosBancariosPor || "",
    garantia: initialData?.garantia || "",
    fechaLimiteRecepcion: formatDateTimeLocalInput(
      initialData?.fechaLimiteRecepcion,
    ),
    medioRecepcion: medioRecepcionValues.has(initialData?.medioRecepcion)
      ? initialData.medioRecepcion
      : "CORREO",
    tipoCompra,
    incoterm: initialData?.incoterm || "",
    incotermVersion: initialData?.incotermVersion || INCOTERM_VERSION_2020,
    incotermPuntoLogistico: initialData?.incotermPuntoLogistico || "",
  };
};

const resolveTiempoEntregaModo = (tiempoEntregaDias) => {
  if (tiempoEntregaDias === null || tiempoEntregaDias === undefined) {
    return "";
  }
  const value = String(tiempoEntregaDias);
  if (value === "") return "";
  return value === "0" ? "inmediata" : "dias";
};

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
    .map((especialidad) =>
      String(especialidad?.tipoProducto?.nombre || "").trim(),
    )
    .filter(Boolean);
};

const getProveedorNombre = (proveedor) =>
  String(proveedor?.razonSocial || "").trim() || "Proveedor sin razón social";

const buildProveedorOptionDescription = (proveedor) => {
  const especialidades = getProveedorEspecialidades(proveedor);
  const especialidadesPreview =
    especialidades.length > 2
      ? `${especialidades.slice(0, 2).join(", ")} +${especialidades.length - 2}`
      : especialidades.join(", ");

  return [
    proveedor?.ruc ? `RUC: ${proveedor.ruc}` : null,
    proveedor?.correoElectronico
      ? `Correo: ${proveedor.correoElectronico}`
      : null,
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

// ---------------------------------------------------------------------------
// FechaLimiteRecepcionPicker
// Selector inline controlado con campos date + time separados.
// Muestra el valor fijado (o estado vacío) y un panel expandible de edición.
// "Fijar" valida que la fecha+hora no queden en el pasado antes de confirmar.
// "Cancelar" descarta la selección en curso sin alterar el valor confirmado.
// ---------------------------------------------------------------------------
const FechaLimiteRecepcionPicker = ({ formIdPrefix, value, onChange }) => {
  const { date: confirmedDate, time: confirmedTime } =
    splitDateTimeLocal(value);

  // Estado local del panel de edición
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [error, setError] = useState("");

  const handleOpen = () => {
    // Precarga con el valor confirmado si existe, si no queda vacío
    setDraftDate(confirmedDate);
    setDraftTime(confirmedTime);
    setError("");
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setError("");
  };

  const handleFijar = () => {
    if (!draftDate || !draftTime) {
      setError("Debes seleccionar tanto la fecha como la hora.");
      return;
    }
    const combined = `${draftDate}T${draftTime}`;
    const parsed = new Date(combined);
    if (Number.isNaN(parsed.getTime())) {
      setError("Fecha u hora no válidas.");
      return;
    }
    if (parsed <= new Date()) {
      setError("La fecha y hora límite no pueden quedar en el pasado.");
      return;
    }
    onChange(combined);
    setOpen(false);
    setError("");
  };

  const displayValue = formatFechaLimiteDisplay(value);

  return (
    <div className="space-y-1 text-sm text-gray-700 md:col-span-2">
      <span className="font-medium">Fecha límite de recepción</span>

      {/* Valor confirmado (o estado vacío) */}
      {!open && (
        <div
          className={`flex items-center justify-between rounded border px-3 py-2 ${
            value ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-white"
          }`}
        >
          {value ? (
            <span className="font-medium text-blue-800">{displayValue}</span>
          ) : (
            <span className="text-gray-400 italic">Sin fijar</span>
          )}
          <button
            type="button"
            onClick={handleOpen}
            className="ml-3 shrink-0 rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            {value ? "Cambiar" : "Seleccionar"}
          </button>
        </div>
      )}

      {/* Panel de edición inline */}
      {open && (
        <div className="space-y-3 rounded border border-gray-300 bg-gray-50 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <label className="min-w-0 space-y-1">
              <span className="text-xs text-gray-600">Fecha</span>
              <input
                id={`${formIdPrefix}-fecha-limite-date`}
                name="fechaLimiteRecepcionFecha"
                type="date"
                value={draftDate}
                onChange={(e) => {
                  setDraftDate(e.target.value);
                  setError("");
                }}
                className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-xs text-gray-600">Hora</span>
              <input
                id={`${formIdPrefix}-fecha-limite-time`}
                name="fechaLimiteRecepcionHora"
                type="time"
                value={draftTime}
                onChange={(e) => {
                  setDraftTime(e.target.value);
                  setError("");
                }}
                className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFijar}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Fijar
            </button>
          </div>
        </div>
      )}

      {/* Input oculto para que el required del formulario funcione */}
      <input
        type="hidden"
        name="fechaLimiteRecepcion"
        value={value || ""}
        required
      />
    </div>
  );
};

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
  const [tiempoEntregaModo, setTiempoEntregaModo] = useState(() =>
    resolveTiempoEntregaModo(initialData?.tiempoEntregaDias),
  );
  const [proveedorSearch, setProveedorSearch] = useState("");
  const [tipoProductoFiltroId, setTipoProductoFiltroId] = useState("");
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);
  const [incotermPickerOpen, setIncotermPickerOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const normalized = normalizeInitialData(initialData);
    setFormData(normalized);
    setTiempoEntregaModo(
      resolveTiempoEntregaModo(normalized.tiempoEntregaDias),
    );
    setProveedorSearch("");
    setTipoProductoFiltroId("");
    setProveedorModalOpen(false);
    setIncotermPickerOpen(false);
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

  const selectedIncoterm = formData.incoterm
    ? INCOTERM_METADATA[formData.incoterm]
    : null;

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

    const errors = {};
    if (formData.vigenciaOfertaDias !== "") {
      const vv = parseFloat(formData.vigenciaOfertaDias);
      if (Number.isNaN(vv) || !Number.isInteger(vv) || vv < 1) {
        errors.vigenciaOfertaDias = "Debe ser un número entero mayor que 0.";
      }
    }
    if (!formData.moneda) {
      errors.moneda = "Selecciona la moneda.";
    }
    if (formData.moneda === "OTRA") {
      const codigoMonedaOtra = formData.codigoMonedaOtra.trim().toUpperCase();
      if (!codigoMonedaOtra) {
        errors.codigoMonedaOtra = "Ingresa el codigo de moneda.";
      } else if (!/^[A-Z]{3,10}$/.test(codigoMonedaOtra)) {
        errors.codigoMonedaOtra =
          "Usa solo letras, entre 3 y 10 caracteres.";
      }
    }
    if (!formData.medioRecepcion) {
      errors.medioRecepcion = "Selecciona el medio de recepcion.";
    }
    if (tiempoEntregaModo === "dias") {
      const tv = parseFloat(formData.tiempoEntregaDias);
      if (Number.isNaN(tv) || !Number.isInteger(tv) || tv < 1) {
        errors.tiempoEntregaDias = "Debe ser un número entero mayor que 0.";
      }
    }
    if (!formData.tipoCompra) {
      errors.tipoCompra = "Selecciona el tipo de compra.";
    }
    if (formData.tipoCompra === "LOCAL") {
      if (!formData.alcanceCompraLocal) {
        errors.alcanceCompraLocal = "Selecciona el alcance local.";
      }
      if (!formData.lugarEntregaLocalTipo) {
        errors.lugarEntregaLocalTipo =
          "Selecciona el tipo de lugar de entrega local.";
      }
      if (!formData.lugarEntregaLocalDetalle.trim()) {
        errors.lugarEntregaLocalDetalle =
          "Ingresa el detalle del lugar de entrega local.";
      }
      if (!formData.transporteAsumidoPor) {
        errors.transporteAsumidoPor =
          "Selecciona quien asume el transporte local.";
      }
      if (!formData.cargaDescargaAsumidaPor) {
        errors.cargaDescargaAsumidaPor =
          "Selecciona quien asume la carga y descarga.";
      }
      if (formData.permiteEntregasParciales === "") {
        errors.permiteEntregasParciales =
          "Indica si permite entregas parciales.";
      }
      if (formData.condicionPagoLocal === "MIXTO") {
        const anticipo = parseFloat(formData.porcentajeAnticipoLocal);
        const saldo = parseFloat(formData.porcentajeSaldoLocal);

        if (formData.porcentajeAnticipoLocal === "") {
          errors.porcentajeAnticipoLocal =
            "El porcentaje de anticipo local es obligatorio.";
        } else if (Number.isNaN(anticipo) || anticipo <= 0 || anticipo > 100) {
          errors.porcentajeAnticipoLocal =
            "El porcentaje de anticipo local debe ser mayor que 0 y no exceder 100.";
        }

        if (formData.porcentajeSaldoLocal === "") {
          errors.porcentajeSaldoLocal =
            "El porcentaje de saldo local es obligatorio.";
        } else if (Number.isNaN(saldo) || saldo <= 0 || saldo > 100) {
          errors.porcentajeSaldoLocal =
            "El porcentaje de saldo local debe ser mayor que 0 y no exceder 100.";
        }

        if (
          !Number.isNaN(anticipo) &&
          !Number.isNaN(saldo) &&
          Math.abs(anticipo + saldo - 100) > PERCENTAGE_TOLERANCE
        ) {
          errors.porcentajeAnticipoLocal =
            "La suma de anticipo y saldo local debe ser 100.";
          errors.porcentajeSaldoLocal =
            "La suma de anticipo y saldo local debe ser 100.";
        }
      }

      if (formData.condicionPagoLocal === "CREDITO") {
        const diasCreditoLocal = parseFloat(formData.diasCreditoLocal);
        if (formData.diasCreditoLocal === "") {
          errors.diasCreditoLocal =
            "Los días de crédito local son obligatorios.";
        } else if (
          Number.isNaN(diasCreditoLocal) ||
          !Number.isInteger(diasCreditoLocal) ||
          diasCreditoLocal < 1
        ) {
          errors.diasCreditoLocal =
            "Los días de crédito local deben ser un entero mayor que 0.";
        }
      }
    }

    if (formData.tipoCompra === "IMPORTACION") {
      if (!formData.incoterm) {
        errors.incoterm = "Selecciona el Incoterm.";
      }
      if (formData.incotermVersion !== INCOTERM_VERSION_2020) {
        errors.incotermVersion = "Solo se admite Incoterms 2020.";
      }
      if (!formData.incotermPuntoLogistico.trim()) {
        errors.incotermPuntoLogistico =
          "Ingresa el punto logistico del Incoterm.";
      }
      if (!formData.estructuraPagoImportacion) {
        errors.estructuraPagoImportacion =
          "Selecciona la estructura de pago de importación.";
      }

      if (!formData.instrumentoPagoImportacion) {
        errors.instrumentoPagoImportacion =
          "Selecciona el instrumento de pago de importación.";
      }

      if (formData.estructuraPagoImportacion === "MIXTO") {
        const anticipo = parseFloat(formData.porcentajeAnticipoImportacion);
        const saldo = parseFloat(formData.porcentajeSaldoImportacion);

        if (formData.porcentajeAnticipoImportacion === "") {
          errors.porcentajeAnticipoImportacion =
            "El porcentaje de anticipo de importación es obligatorio.";
        } else if (Number.isNaN(anticipo) || anticipo <= 0 || anticipo > 100) {
          errors.porcentajeAnticipoImportacion =
            "El porcentaje de anticipo de importación debe ser mayor que 0 y no exceder 100.";
        }

        if (formData.porcentajeSaldoImportacion === "") {
          errors.porcentajeSaldoImportacion =
            "El porcentaje de saldo de importación es obligatorio.";
        } else if (Number.isNaN(saldo) || saldo <= 0 || saldo > 100) {
          errors.porcentajeSaldoImportacion =
            "El porcentaje de saldo de importación debe ser mayor que 0 y no exceder 100.";
        }

        if (
          !Number.isNaN(anticipo) &&
          !Number.isNaN(saldo) &&
          Math.abs(anticipo + saldo - 100) > PERCENTAGE_TOLERANCE
        ) {
          errors.porcentajeAnticipoImportacion =
            "La suma de anticipo y saldo de importación debe ser 100.";
          errors.porcentajeSaldoImportacion =
            "La suma de anticipo y saldo de importación debe ser 100.";
        }
      }

      if (formData.estructuraPagoImportacion === "CREDITO_PLAZO") {
        const diasCreditoImportacion = parseFloat(
          formData.diasCreditoImportacion,
        );
        if (formData.diasCreditoImportacion === "") {
          errors.diasCreditoImportacion =
            "Los días de crédito de importación son obligatorios.";
        } else if (
          Number.isNaN(diasCreditoImportacion) ||
          !Number.isInteger(diasCreditoImportacion) ||
          diasCreditoImportacion < 1
        ) {
          errors.diasCreditoImportacion =
            "Los días de crédito de importación deben ser un entero mayor que 0.";
        }

        if (!formData.referenciaPlazoImportacion) {
          errors.referenciaPlazoImportacion =
            "Selecciona la referencia del plazo de importación.";
        }
      }

      if (
        formData.estructuraPagoImportacion === "CONTRA_DOCUMENTOS" &&
        !formData.gatilloPagoImportacion
      ) {
        errors.gatilloPagoImportacion =
          "Selecciona el gatillo documentario de importación.";
      }

      if (
        formData.instrumentoPagoImportacion === "CARTA_CREDITO" &&
        !formData.gastosBancariosPor
      ) {
        errors.gastosBancariosPor =
          "Selecciona quién asume los gastos bancarios.";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    await onSubmit(
      buildSolicitudCotizacionPayload(formData, tiempoEntregaModo),
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.id ? "Editar solicitud" : "Nueva solicitud de cotización"}
          </h2>
          <p className="text-sm text-gray-600">
            Documento emitido a un proveedor para cotizar ítems de un
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
                Busca por razón social o RUC y selecciona un proveedor para la
                solicitud.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProveedorModalOpen(true)}
              className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              {proveedorSeleccionado
                ? "Cambiar proveedor"
                : "Seleccionar proveedor"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Filtrar por tipo de producto</span>
              <select
                id={`${formIdPrefix}-tipo-producto-filtro`}
                name="tipoProductoFiltroId"
                value={tipoProductoFiltroId}
                onChange={(event) =>
                  setTipoProductoFiltroId(event.target.value)
                }
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
            </div>

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
                  label="Teléfono"
                  value={proveedorSeleccionado.telefono}
                />
                <ProveedorSummaryField
                  label="Dirección"
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
              Aún no se seleccionó proveedor. Usa el selector para buscar por
              razón social o RUC.
            </div>
          )}
        </div>

        <label className="space-y-1 text-sm text-gray-700 md:col-span-2 xl:col-span-2">
          <span className="font-medium">Requerimiento aprobado</span>
          <select
            id={`${formIdPrefix}-requerimiento-id`}
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
            <option value="">Selecciona un requerimiento</option>
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
              id={`${formIdPrefix}-estado`}
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
          id={`${formIdPrefix}-cuerpo-solicitud`}
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

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">
            Tipo de compra y condiciones logísticas
          </p>
          <p className="text-xs text-gray-500">
            Indica si la compra es local o por importación para registrar las
            condiciones de entrega correspondientes.
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">
            Tipo de compra
          </legend>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                id={`${formIdPrefix}-tipo-compra-local`}
                type="radio"
                name="tipoCompra"
                value="LOCAL"
                checked={formData.tipoCompra === "LOCAL"}
                onChange={() => {
                  setFormData((prev) =>
                    buildTipoCompraFormState(prev, "LOCAL"),
                  );
                  setFormErrors((prev) => clearTipoCompraRelatedErrors(prev));
                }}
              />
              Compra local
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                id={`${formIdPrefix}-tipo-compra-importacion`}
                type="radio"
                name="tipoCompra"
                value="IMPORTACION"
                checked={formData.tipoCompra === "IMPORTACION"}
                onChange={() => {
                  setFormData((prev) =>
                    buildTipoCompraFormState(prev, "IMPORTACION"),
                  );
                  setFormErrors((prev) => clearTipoCompraRelatedErrors(prev));
                }}
              />
              Importación
            </label>
          </div>
          {formErrors.tipoCompra ? (
            <p className="mt-2 text-xs text-red-600">{formErrors.tipoCompra}</p>
          ) : null}
        </fieldset>

        {formData.tipoCompra === "LOCAL" ? (
          <div className="mt-4 grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Alcance de compra local</span>
              <select
                id={`${formIdPrefix}-alcance-compra-local`}
                name="alcanceCompraLocal"
                value={formData.alcanceCompraLocal}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    alcanceCompraLocal: event.target.value,
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["alcanceCompraLocal"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.alcanceCompraLocal
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona alcance</option>
                {LOCAL_PURCHASE_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.alcanceCompraLocal ? (
                <p className="text-xs text-red-600">
                  {formErrors.alcanceCompraLocal}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Tipo de lugar de entrega</span>
              <select
                id={`${formIdPrefix}-lugar-entrega-local-tipo`}
                name="lugarEntregaLocalTipo"
                value={formData.lugarEntregaLocalTipo}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    lugarEntregaLocalTipo: event.target.value,
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["lugarEntregaLocalTipo"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.lugarEntregaLocalTipo
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona tipo</option>
                {LOCAL_DELIVERY_PLACE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.lugarEntregaLocalTipo ? (
                <p className="text-xs text-red-600">
                  {formErrors.lugarEntregaLocalTipo}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Permite entregas parciales</span>
              <select
                id={`${formIdPrefix}-permite-entregas-parciales`}
                name="permiteEntregasParciales"
                value={formData.permiteEntregasParciales}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    permiteEntregasParciales: event.target.value,
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["permiteEntregasParciales"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.permiteEntregasParciales
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona</option>
                <option value="true">Si</option>
                <option value="false">No</option>
              </select>
              {formErrors.permiteEntregasParciales ? (
                <p className="text-xs text-red-600">
                  {formErrors.permiteEntregasParciales}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-gray-700 md:col-span-2 xl:col-span-3">
              <span className="font-medium">Detalle del lugar de entrega</span>
              <input
                id={`${formIdPrefix}-lugar-entrega-local-detalle`}
                name="lugarEntregaLocalDetalle"
                type="text"
                value={formData.lugarEntregaLocalDetalle}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    lugarEntregaLocalDetalle: event.target.value,
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["lugarEntregaLocalDetalle"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.lugarEntregaLocalDetalle
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                placeholder="Ej: Almacen principal, Lima"
                required
              />
              {formErrors.lugarEntregaLocalDetalle ? (
                <p className="text-xs text-red-600">
                  {formErrors.lugarEntregaLocalDetalle}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Transporte asumido por</span>
              <select
                id={`${formIdPrefix}-transporte-asumido-por`}
                name="transporteAsumidoPor"
                value={formData.transporteAsumidoPor}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    transporteAsumidoPor: event.target.value,
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["transporteAsumidoPor"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.transporteAsumidoPor
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona responsable</option>
                {LOCAL_LOGISTICS_RESPONSIBLE_PARTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.transporteAsumidoPor ? (
                <p className="text-xs text-red-600">
                  {formErrors.transporteAsumidoPor}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Carga/descarga asumida por</span>
              <select
                id={`${formIdPrefix}-carga-descarga-asumida-por`}
                name="cargaDescargaAsumidaPor"
                value={formData.cargaDescargaAsumidaPor}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    cargaDescargaAsumidaPor: event.target.value,
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["cargaDescargaAsumidaPor"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.cargaDescargaAsumidaPor
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona responsable</option>
                {LOCAL_LOGISTICS_RESPONSIBLE_PARTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.cargaDescargaAsumidaPor ? (
                <p className="text-xs text-red-600">
                  {formErrors.cargaDescargaAsumidaPor}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-gray-700 md:col-span-2 xl:col-span-3">
              <span className="font-medium">Condiciones logisticas locales</span>
              <textarea
                id={`${formIdPrefix}-condiciones-logisticas-locales`}
                name="condicionesLogisticasLocales"
                rows="2"
                value={formData.condicionesLogisticasLocales}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    condicionesLogisticasLocales: event.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Notas operativas adicionales, si aplican."
              />
            </label>
          </div>
        ) : null}

        {formData.tipoCompra === "IMPORTACION" ? (
          <div className="mt-4 grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
            <div className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Incoterm</span>
              <div
                className="relative"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIncotermPickerOpen(false);
                  }
                }}
              >
                <button
                  id={`${formIdPrefix}-incoterm`}
                  name="incoterm"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={incotermPickerOpen}
                  onClick={() => setIncotermPickerOpen((prev) => !prev)}
                  className={`flex min-h-[42px] w-full items-center justify-between gap-3 rounded border bg-white px-3 py-2 text-left ${
                    formErrors.incoterm ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <span className="min-w-0">
                    {selectedIncoterm ? (
                      <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                        <span className="font-semibold text-gray-900">
                          {formData.incoterm}
                        </span>
                        <span className="whitespace-normal text-gray-700">
                          {selectedIncoterm.label.replace(
                            `${formData.incoterm} - `,
                            "",
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        Selecciona Incoterm
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-gray-400" aria-hidden="true">
                    v
                  </span>
                </button>

                {incotermPickerOpen ? (
                  <div
                    className="absolute z-30 mt-1 max-h-[min(70vh,28rem)] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl"
                    role="listbox"
                    aria-labelledby={`${formIdPrefix}-incoterm`}
                  >
                    {INCOTERM_GROUPS.map((group) => (
                      <div key={group.key}>
                        <div className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          {group.label}
                        </div>
                        <div className="divide-y divide-gray-100">
                          {group.options.map((option) => {
                            const optionTitle = option.label.replace(
                              `${option.value} - `,
                              "",
                            );
                            const selected = formData.incoterm === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    incoterm: option.value,
                                  }));
                                  setFormErrors((prev) =>
                                    clearFormErrorKeys(prev, ["incoterm"]),
                                  );
                                  setIncotermPickerOpen(false);
                                }}
                                className={`grid w-full gap-2 px-3 py-3 text-left transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none sm:grid-cols-[4rem,1fr] ${
                                  selected ? "bg-blue-50" : "bg-white"
                                }`}
                              >
                                <span className="font-bold text-blue-900">
                                  {option.value}
                                </span>
                                <span className="min-w-0">
                                  <span className="block font-semibold text-gray-900">
                                    {optionTitle}
                                  </span>
                                  <span className="mt-1 block whitespace-normal text-xs leading-5 text-gray-600">
                                    {option.descripcion}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {formErrors.incoterm ? (
                <p className="text-xs text-red-600">{formErrors.incoterm}</p>
              ) : null}
            </div>

            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Versión Incoterm</span>
              <input
                id={`${formIdPrefix}-incoterm-version`}
                name="incotermVersion"
                type="text"
                value={formData.incotermVersion}
                readOnly
                className="w-full rounded border border-gray-300 px-3 py-2"
                aria-readonly="true"
              />
            </label>

            {formData.incoterm && INCOTERM_METADATA[formData.incoterm] ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 md:col-span-2">
                <p className="text-sm font-medium text-blue-900">
                  {INCOTERM_METADATA[formData.incoterm].label}
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  {INCOTERM_METADATA[formData.incoterm].descripcion}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-800">
                  {INCOTERM_METADATA[formData.incoterm].scopeLabel}
                </p>
              </div>
            ) : null}

            <label className="space-y-1 text-sm text-gray-700 md:col-span-2">
              <span className="font-medium">
                Punto logístico / lugar de referencia del Incoterm
              </span>
              <input
                id={`${formIdPrefix}-incoterm-punto-logistico`}
                name="incotermPuntoLogistico"
                type="text"
                value={formData.incotermPuntoLogistico}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    incotermPuntoLogistico: event.target.value,
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["incotermPuntoLogistico"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.incotermPuntoLogistico
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                placeholder={
                  INCOTERM_METADATA[formData.incoterm]?.placeholderPunto ||
                  "Especifica el punto logístico de referencia"
                }
                required
              />
              {formErrors.incotermPuntoLogistico ? (
                <p className="text-xs text-red-600">
                  {formErrors.incotermPuntoLogistico}
                </p>
              ) : null}
            </label>
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900">
          Condiciones documentarias
        </p>
        <p className="mb-3 text-xs text-gray-500">
          Estos campos alimentan el documento formal de la solicitud. El
          proveedor puede responder con valores distintos en su cotización.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Moneda</span>
            <select
              id={`${formIdPrefix}-moneda`}
              name="moneda"
              value={formData.moneda}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  moneda: event.target.value,
                  codigoMonedaOtra:
                    event.target.value === "OTRA"
                      ? prev.codigoMonedaOtra
                      : "",
                }));
                setFormErrors((prev) =>
                  clearFormErrorKeys(prev, ["moneda", "codigoMonedaOtra"]),
                );
              }}
              className={`w-full rounded border px-3 py-2 ${
                formErrors.moneda ? "border-red-400" : "border-gray-300"
              }`}
              required
            >
              {solicitudCurrencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
            {formErrors.moneda ? (
              <p className="text-xs text-red-600">{formErrors.moneda}</p>
            ) : null}
          </label>
          {formData.moneda === "OTRA" ? (
            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Codigo de moneda</span>
              <input
                id={`${formIdPrefix}-codigo-moneda-otra`}
                name="codigoMonedaOtra"
                type="text"
                value={formData.codigoMonedaOtra}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    codigoMonedaOtra: event.target.value.toUpperCase(),
                  }));
                  setFormErrors((prev) =>
                    clearFormErrorKeys(prev, ["codigoMonedaOtra"]),
                  );
                }}
                className={`w-full rounded border px-3 py-2 ${
                  formErrors.codigoMonedaOtra
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                placeholder="Ej: JPY"
                maxLength={10}
                required
              />
              {formErrors.codigoMonedaOtra ? (
                <p className="text-xs text-red-600">
                  {formErrors.codigoMonedaOtra}
                </p>
              ) : null}
            </label>
          ) : null}
          {formData.tipoCompra === "LOCAL" ? (
            <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 md:col-span-2">
              <p className="font-semibold">Tratamiento tributario local</p>
              <p className="mt-1 leading-6">{LOCAL_TAX_NOTICE}</p>
            </div>
          ) : null}
          <div className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Vigencia de oferta (días)</span>
            <input
              id={`${formIdPrefix}-vigencia-oferta-dias`}
              name="vigenciaOfertaDias"
              type="number"
              min="1"
              step="1"
              value={formData.vigenciaOfertaDias}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  vigenciaOfertaDias: event.target.value,
                }));
                if (formErrors.vigenciaOfertaDias) {
                  setFormErrors((prev) => ({
                    ...prev,
                    vigenciaOfertaDias: undefined,
                  }));
                }
              }}
              className={`w-full rounded border px-3 py-2 ${
                formErrors.vigenciaOfertaDias
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
              placeholder="Ej: 15"
            />
            {formErrors.vigenciaOfertaDias && (
              <p className="text-xs text-red-600">
                {formErrors.vigenciaOfertaDias}
              </p>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Tiempo de entrega (días)</span>
            <select
              id={`${formIdPrefix}-tiempo-entrega-modo`}
              name="tiempoEntregaModo"
              value={tiempoEntregaModo}
              onChange={(event) => {
                const modo = event.target.value;
                setTiempoEntregaModo(modo);
                setFormData((prev) => {
                  if (modo === "inmediata") {
                    return { ...prev, tiempoEntregaDias: "0" };
                  }
                  if (modo === "dias") {
                    return {
                      ...prev,
                      tiempoEntregaDias:
                        prev.tiempoEntregaDias !== "" &&
                        prev.tiempoEntregaDias !== "0"
                          ? prev.tiempoEntregaDias
                          : "",
                    };
                  }
                  return { ...prev, tiempoEntregaDias: "" };
                });
                setFormErrors((prev) => ({
                  ...prev,
                  tiempoEntregaDias: undefined,
                }));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Seleccionar</option>
              <option value="inmediata">Inmediata</option>
              <option value="dias">En días</option>
            </select>
            {tiempoEntregaModo === "dias" && (
              <input
                id={`${formIdPrefix}-tiempo-entrega-dias`}
                name="tiempoEntregaDias"
                type="number"
                min="1"
                step="1"
                value={formData.tiempoEntregaDias}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    tiempoEntregaDias: event.target.value,
                  }));
                  if (formErrors.tiempoEntregaDias) {
                    setFormErrors((prev) => ({
                      ...prev,
                      tiempoEntregaDias: undefined,
                    }));
                  }
                }}
                className={`mt-1 w-full rounded border px-3 py-2 ${
                  formErrors.tiempoEntregaDias
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
                placeholder="Ej: 7"
              />
            )}
            {formErrors.tiempoEntregaDias && (
              <p className="text-xs text-red-600">
                {formErrors.tiempoEntregaDias}
              </p>
            )}
          </div>
          <FechaLimiteRecepcionPicker
            formIdPrefix={formIdPrefix}
            value={formData.fechaLimiteRecepcion}
            onChange={(newValue) =>
              setFormData((prev) => ({
                ...prev,
                fechaLimiteRecepcion: newValue,
              }))
            }
          />
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Medio de recepción</span>
            <select
              id={`${formIdPrefix}-medio-recepcion`}
              name="medioRecepcion"
              value={formData.medioRecepcion}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  medioRecepcion: event.target.value,
                }));
                setFormErrors((prev) =>
                  clearFormErrorKeys(prev, ["medioRecepcion"]),
                );
              }}
              className={`w-full rounded border px-3 py-2 ${
                formErrors.medioRecepcion
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
              required
            >
              {medioRecepcionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {medioRecepcionOptions.find(
              (option) => option.value === formData.medioRecepcion,
            )?.descripcion ? (
              <p className="text-xs text-gray-500">
                {
                  medioRecepcionOptions.find(
                    (option) => option.value === formData.medioRecepcion,
                  ).descripcion
                }
              </p>
            ) : null}
            {formErrors.medioRecepcion ? (
              <p className="text-xs text-red-600">
                {formErrors.medioRecepcion}
              </p>
            ) : null}
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 md:col-span-2 xl:col-span-3">
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900">
                  {formData.tipoCompra === "LOCAL"
                    ? "Forma de pago"
                    : "Condiciones de pago"}
                </p>
                <p className="text-xs text-gray-500">
                  {formData.tipoCompra === "LOCAL"
                    ? "Puedes consignar una forma de pago referencial para la solicitud. Si no se define, el proveedor la responderá en su cotización."
                    : formData.tipoCompra === "IMPORTACION"
                      ? "El Incoterm define la logística. El pago se modela por condición comercial, instrumento y gatillo documentario según el tipo de compra."
                      : "Selecciona primero el tipo de compra para capturar el flujo de pago correcto."}
                </p>
              </div>

            {!formData.tipoCompra ? (
              <div className="rounded border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                Selecciona primero el tipo de compra para capturar el flujo de
                pago correcto.
              </div>
            ) : null}

            {formData.tipoCompra === "LOCAL" ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">Forma de pago</span>
                  <select
                    id={`${formIdPrefix}-condicion-pago-local`}
                    name="condicionPagoLocal"
                    value={resolveLocalPaymentFormValue(formData)}
                    onChange={(event) => {
                      setFormData((prev) =>
                        buildLocalPaymentConditionFormState(
                          prev,
                          event.target.value,
                        ),
                      );
                      setFormErrors((prev) =>
                        clearFormErrorKeys(prev, [
                          "condicionPagoLocal",
                          "hitoPagoLocal",
                          "porcentajeAnticipoLocal",
                          "porcentajeSaldoLocal",
                          "diasCreditoLocal",
                        ]),
                      );
                    }}
                    className={`w-full rounded border px-3 py-2 ${
                      formErrors.condicionPagoLocal
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Seleccionar</option>
                    {LOCAL_PAYMENT_FORM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.condicionPagoLocal ? (
                    <p className="text-xs text-red-600">
                      {formErrors.condicionPagoLocal}
                    </p>
                  ) : null}
                </label>

                {formData.condicionPagoLocal === "MIXTO" ? (
                  <>
                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">% anticipo local</span>
                      <input
                        id={`${formIdPrefix}-porcentaje-anticipo-local`}
                        name="porcentajeAnticipoLocal"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={formData.porcentajeAnticipoLocal}
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            porcentajeAnticipoLocal: event.target.value,
                          }));
                          setFormErrors((prev) =>
                            clearFormErrorKeys(prev, [
                              "porcentajeAnticipoLocal",
                              "porcentajeSaldoLocal",
                            ]),
                          );
                        }}
                        className={`w-full rounded border px-3 py-2 ${
                          formErrors.porcentajeAnticipoLocal
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: 40"
                        required
                      />
                      {formErrors.porcentajeAnticipoLocal ? (
                        <p className="text-xs text-red-600">
                          {formErrors.porcentajeAnticipoLocal}
                        </p>
                      ) : null}
                    </label>
                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">% saldo local</span>
                      <input
                        id={`${formIdPrefix}-porcentaje-saldo-local`}
                        name="porcentajeSaldoLocal"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={formData.porcentajeSaldoLocal}
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            porcentajeSaldoLocal: event.target.value,
                          }));
                          setFormErrors((prev) =>
                            clearFormErrorKeys(prev, [
                              "porcentajeAnticipoLocal",
                              "porcentajeSaldoLocal",
                            ]),
                          );
                        }}
                        className={`w-full rounded border px-3 py-2 ${
                          formErrors.porcentajeSaldoLocal
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: 60"
                        required
                      />
                      {formErrors.porcentajeSaldoLocal ? (
                        <p className="text-xs text-red-600">
                          {formErrors.porcentajeSaldoLocal}
                        </p>
                      ) : null}
                    </label>
                  </>
                ) : null}

                {formData.condicionPagoLocal === "CREDITO" ? (
                  <label className="space-y-1 text-sm text-gray-700">
                    <span className="font-medium">Días de crédito local</span>
                    <input
                      id={`${formIdPrefix}-dias-credito-local`}
                      name="diasCreditoLocal"
                      type="number"
                      min="1"
                      step="1"
                      value={formData.diasCreditoLocal}
                      onChange={(event) => {
                        setFormData((prev) => ({
                          ...prev,
                          diasCreditoLocal: event.target.value,
                        }));
                        setFormErrors((prev) =>
                          clearFormErrorKeys(prev, ["diasCreditoLocal"]),
                        );
                      }}
                      className={`w-full rounded border px-3 py-2 ${
                        formErrors.diasCreditoLocal
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                      placeholder="Ej: 30"
                      required
                    />
                    {formErrors.diasCreditoLocal ? (
                      <p className="text-xs text-red-600">
                        {formErrors.diasCreditoLocal}
                      </p>
                    ) : null}
                  </label>
                ) : null}
              </div>
            ) : null}

            {formData.tipoCompra === "IMPORTACION" ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">Estructura de pago</span>
                  <select
                    id={`${formIdPrefix}-estructura-pago-importacion`}
                    name="estructuraPagoImportacion"
                    value={formData.estructuraPagoImportacion}
                    onChange={(event) => {
                      setFormData((prev) =>
                        buildImportPaymentStructureFormState(
                          prev,
                          event.target.value,
                        ),
                      );
                      setFormErrors((prev) =>
                        clearFormErrorKeys(prev, [
                          "estructuraPagoImportacion",
                          "gatilloPagoImportacion",
                          "porcentajeAnticipoImportacion",
                          "porcentajeSaldoImportacion",
                          "diasCreditoImportacion",
                          "referenciaPlazoImportacion",
                        ]),
                      );
                    }}
                    className={`w-full rounded border px-3 py-2 ${
                      formErrors.estructuraPagoImportacion
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Selecciona una estructura</option>
                    {IMPORT_PAYMENT_STRUCTURE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.estructuraPagoImportacion ? (
                    <p className="text-xs text-red-600">
                      {formErrors.estructuraPagoImportacion}
                    </p>
                  ) : null}
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">Instrumento de pago</span>
                  <select
                    id={`${formIdPrefix}-instrumento-pago-importacion`}
                    name="instrumentoPagoImportacion"
                    value={formData.instrumentoPagoImportacion}
                    onChange={(event) => {
                      setFormData((prev) =>
                        buildImportPaymentInstrumentFormState(
                          prev,
                          event.target.value,
                        ),
                      );
                      setFormErrors((prev) =>
                        clearFormErrorKeys(prev, [
                          "instrumentoPagoImportacion",
                          "gastosBancariosPor",
                        ]),
                      );
                    }}
                    className={`w-full rounded border px-3 py-2 ${
                      formErrors.instrumentoPagoImportacion
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Selecciona un instrumento</option>
                    {IMPORT_PAYMENT_INSTRUMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.instrumentoPagoImportacion ? (
                    <p className="text-xs text-red-600">
                      {formErrors.instrumentoPagoImportacion}
                    </p>
                  ) : null}
                </label>

                {formData.estructuraPagoImportacion === "MIXTO" ? (
                  <>
                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">
                        % anticipo importación
                      </span>
                      <input
                        id={`${formIdPrefix}-porcentaje-anticipo-importacion`}
                        name="porcentajeAnticipoImportacion"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={formData.porcentajeAnticipoImportacion}
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            porcentajeAnticipoImportacion: event.target.value,
                          }));
                          setFormErrors((prev) =>
                            clearFormErrorKeys(prev, [
                              "porcentajeAnticipoImportacion",
                              "porcentajeSaldoImportacion",
                            ]),
                          );
                        }}
                        className={`w-full rounded border px-3 py-2 ${
                          formErrors.porcentajeAnticipoImportacion
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: 30"
                        required
                      />
                      {formErrors.porcentajeAnticipoImportacion ? (
                        <p className="text-xs text-red-600">
                          {formErrors.porcentajeAnticipoImportacion}
                        </p>
                      ) : null}
                    </label>
                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">% saldo importación</span>
                      <input
                        id={`${formIdPrefix}-porcentaje-saldo-importacion`}
                        name="porcentajeSaldoImportacion"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={formData.porcentajeSaldoImportacion}
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            porcentajeSaldoImportacion: event.target.value,
                          }));
                          setFormErrors((prev) =>
                            clearFormErrorKeys(prev, [
                              "porcentajeAnticipoImportacion",
                              "porcentajeSaldoImportacion",
                            ]),
                          );
                        }}
                        className={`w-full rounded border px-3 py-2 ${
                          formErrors.porcentajeSaldoImportacion
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: 70"
                        required
                      />
                      {formErrors.porcentajeSaldoImportacion ? (
                        <p className="text-xs text-red-600">
                          {formErrors.porcentajeSaldoImportacion}
                        </p>
                      ) : null}
                    </label>
                  </>
                ) : null}

                {formData.estructuraPagoImportacion === "CREDITO_PLAZO" ? (
                  <>
                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">Días de crédito</span>
                      <input
                        id={`${formIdPrefix}-dias-credito-importacion`}
                        name="diasCreditoImportacion"
                        type="number"
                        min="1"
                        step="1"
                        value={formData.diasCreditoImportacion}
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            diasCreditoImportacion: event.target.value,
                          }));
                          setFormErrors((prev) =>
                            clearFormErrorKeys(prev, [
                              "diasCreditoImportacion",
                            ]),
                          );
                        }}
                        className={`w-full rounded border px-3 py-2 ${
                          formErrors.diasCreditoImportacion
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: 45"
                        required
                      />
                      {formErrors.diasCreditoImportacion ? (
                        <p className="text-xs text-red-600">
                          {formErrors.diasCreditoImportacion}
                        </p>
                      ) : null}
                    </label>
                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">Referencia del plazo</span>
                      <select
                        id={`${formIdPrefix}-referencia-plazo-importacion`}
                        name="referenciaPlazoImportacion"
                        value={formData.referenciaPlazoImportacion}
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            referenciaPlazoImportacion: event.target.value,
                          }));
                          setFormErrors((prev) =>
                            clearFormErrorKeys(prev, [
                              "referenciaPlazoImportacion",
                            ]),
                          );
                        }}
                        className={`w-full rounded border px-3 py-2 ${
                          formErrors.referenciaPlazoImportacion
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                        required
                      >
                        <option value="">Selecciona una referencia</option>
                        {IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.referenciaPlazoImportacion ? (
                        <p className="text-xs text-red-600">
                          {formErrors.referenciaPlazoImportacion}
                        </p>
                      ) : null}
                    </label>
                  </>
                ) : null}

                {formData.estructuraPagoImportacion === "CONTRA_DOCUMENTOS" ? (
                  <label className="space-y-1 text-sm text-gray-700 md:col-span-2 xl:col-span-2">
                    <span className="font-medium">Gatillo documentario</span>
                    <select
                      id={`${formIdPrefix}-gatillo-pago-importacion`}
                      name="gatilloPagoImportacion"
                      value={formData.gatilloPagoImportacion}
                      onChange={(event) => {
                        setFormData((prev) => ({
                          ...prev,
                          gatilloPagoImportacion: event.target.value,
                        }));
                        setFormErrors((prev) =>
                          clearFormErrorKeys(prev, ["gatilloPagoImportacion"]),
                        );
                      }}
                      className={`w-full rounded border px-3 py-2 ${
                        formErrors.gatilloPagoImportacion
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Selecciona un gatillo</option>
                      {IMPORT_PAYMENT_TRIGGER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.gatilloPagoImportacion ? (
                      <p className="text-xs text-red-600">
                        {formErrors.gatilloPagoImportacion}
                      </p>
                    ) : null}
                  </label>
                ) : null}

                {formData.instrumentoPagoImportacion === "CARTA_CREDITO" ? (
                  <label className="space-y-1 text-sm text-gray-700">
                    <span className="font-medium">Gastos bancarios por</span>
                    <select
                      id={`${formIdPrefix}-gastos-bancarios-por`}
                      name="gastosBancariosPor"
                      value={formData.gastosBancariosPor}
                      onChange={(event) => {
                        setFormData((prev) => ({
                          ...prev,
                          gastosBancariosPor: event.target.value,
                        }));
                        setFormErrors((prev) =>
                          clearFormErrorKeys(prev, ["gastosBancariosPor"]),
                        );
                      }}
                      className={`w-full rounded border px-3 py-2 ${
                        formErrors.gastosBancariosPor
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Selecciona una asignación</option>
                      {BANK_CHARGE_PARTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.gastosBancariosPor ? (
                      <p className="text-xs text-red-600">
                        {formErrors.gastosBancariosPor}
                      </p>
                    ) : null}
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-medium">Garantía</span>
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
              placeholder="Ej: 6 meses contra defectos de fábrica"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-900">Ítems a cotizar</p>
          <p className="text-xs text-gray-500">
            Selecciona los ítems del requerimiento que se incluirán en esta
            solicitud.
          </p>
        </div>
        {availableItems.length > 0 ? (
          <div className="grid gap-2">
            <div className="hidden rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid sm:grid-cols-[3rem,4rem,minmax(0,1fr),8rem,8rem] sm:items-center">
              <span aria-hidden="true" />
              <span>&Iacute;tem</span>
              <span>Descripci&oacute;n</span>
              <span>Unid. Medida</span>
              <span>Cantidad</span>
            </div>
            {availableItems.map((item, index) => {
              const checked = formData.itemIds.includes(String(item.id));
              const itemName =
                item.producto?.nombre ||
                item.productoTemporal?.nombre ||
                item.descripcionVisible ||
                "Item sin nombre";
              const rawDescription =
                item.productoTemporal?.descripcion ||
                item.descripcionVisible ||
                "";
              const normalizedName = String(itemName).trim().toLowerCase();
              const normalizedDescription = String(rawDescription)
                .trim()
                .toLowerCase();
              const itemDescription =
                rawDescription && normalizedDescription !== normalizedName
                  ? rawDescription
                  : "";
              const itemQuantity = Number(item.cantidadRequerida ?? 0);
              const quantityLabel = Number.isFinite(itemQuantity)
                ? itemQuantity.toLocaleString("es-PE", {
                    maximumFractionDigits: 2,
                  })
                : "-";

              return (
                <label
                  key={item.id}
                  className={`grid cursor-pointer grid-cols-[auto,2.5rem,minmax(0,1fr)] gap-3 rounded border px-3 py-3 text-sm transition sm:grid-cols-[3rem,4rem,minmax(0,1fr),8rem,8rem] sm:items-center ${
                    checked
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="flex items-start sm:justify-center">
                    <input
                      id={`${formIdPrefix}-item-${item.id}`}
                      name="itemIds"
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      className="mt-1 sm:mt-0"
                    />
                  </span>
                  <span className="font-semibold text-gray-900 sm:text-center">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-gray-900">
                      {itemName}
                    </span>
                    {itemDescription ? (
                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        {itemDescription}
                      </span>
                    ) : null}
                  </span>
                  <span className="col-start-3 rounded border border-gray-200 bg-white/70 px-3 py-2 sm:col-start-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:hidden">
                      Unid. Medida
                    </span>
                    <span className="mt-1 block font-medium text-gray-900">
                      {item.unidadMedida || "-"}
                    </span>
                  </span>
                  <span className="col-start-3 rounded border border-gray-200 bg-white/70 px-3 py-2 sm:col-start-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:hidden">
                      Cantidad
                    </span>
                    <span className="mt-1 block font-medium text-gray-900">
                      {quantityLabel}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
            Selecciona un requerimiento para ver sus ítems.
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
        ) : null}
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
        searchLabel="Buscar proveedor por razón social o RUC"
        searchPlaceholder="Escribe razón social o RUC"
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
            ? "Prueba con otro término de búsqueda o elimina el filtro por tipo de producto."
            : "Prueba buscando por razón social o RUC."
        }
      />
    </form>
  );
};

export default SolicitudCotizacionForm;
