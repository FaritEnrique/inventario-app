import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import publicProveedorCotizacionesApi from "../../api/publicProveedorCotizacionesApi";
import {
  BANK_CHARGE_PARTY_LABELS,
  BANK_CHARGE_PARTY_OPTIONS,
  IMPORT_PAYMENT_INSTRUMENT_LABELS,
  IMPORT_PAYMENT_INSTRUMENT_OPTIONS,
  IMPORT_PAYMENT_STRUCTURE_LABELS,
  IMPORT_PAYMENT_STRUCTURE_OPTIONS,
  IMPORT_PAYMENT_TERM_REFERENCE_LABELS,
  IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS,
  IMPORT_PAYMENT_TRIGGER_LABELS,
  IMPORT_PAYMENT_TRIGGER_OPTIONS,
  LOCAL_DELIVERY_PLACE_TYPE_LABELS,
  LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS,
  LOCAL_PAYMENT_CONDITION_LABELS,
  LOCAL_PAYMENT_MILESTONE_LABELS,
  LOCAL_PURCHASE_SCOPE_LABELS,
  PURCHASE_TYPE_LABELS,
  SOLICITUD_COTIZACION_CURRENCY_LABELS,
  SOLICITUD_COTIZACION_RECEPTION_CHANNEL_LABELS,
} from "../../features/solicitud-cotizacion/solicitudCotizacionCatalog";

const formasPagoLocalPropuesta = [
  { value: "", label: "Seleccionar" },
  { value: "CONTRA_ENTREGA", label: "Contra entrega" },
  { value: "ADELANTO", label: "Adelanto" },
  { value: "CREDITO", label: "Credito" },
  { value: "MIXTO", label: "Mixto" },
];

const resetLocalPaymentProposalFields = (formaPagoLocalPropuesta) => ({
  formaPagoLocalPropuesta,
  diasCreditoLocalPropuesto: "",
  porcentajeAnticipoLocalPropuesto: "",
  porcentajeSaldoLocalPropuesto: "",
});

const resetImportPaymentProposalStructureFields = (
  estructuraPagoImportacionPropuesta,
) => ({
  estructuraPagoImportacionPropuesta,
  gatilloPagoImportacionPropuesta: "",
  porcentajeAnticipoImportacionPropuesto: "",
  porcentajeSaldoImportacionPropuesto: "",
  diasCreditoImportacionPropuesto: "",
  referenciaPlazoImportacionPropuesta: "",
});

const resetImportPaymentProposalInstrumentFields = (
  instrumentoPagoImportacionPropuesta,
) => ({
  instrumentoPagoImportacionPropuesta,
  gastosBancariosPorPropuesto: "",
});

const buildPaymentProposalPayload = (formData, isImportacion) =>
  isImportacion
    ? {
        estructuraPagoImportacionPropuesta:
          formData.estructuraPagoImportacionPropuesta || null,
        instrumentoPagoImportacionPropuesta:
          formData.instrumentoPagoImportacionPropuesta || null,
        gatilloPagoImportacionPropuesta:
          formData.estructuraPagoImportacionPropuesta === "CONTRA_DOCUMENTOS"
            ? formData.gatilloPagoImportacionPropuesta || null
            : null,
        porcentajeAnticipoImportacionPropuesto:
          formData.estructuraPagoImportacionPropuesta === "MIXTO"
            ? Number(formData.porcentajeAnticipoImportacionPropuesto)
            : null,
        porcentajeSaldoImportacionPropuesto:
          formData.estructuraPagoImportacionPropuesta === "MIXTO"
            ? Number(formData.porcentajeSaldoImportacionPropuesto)
            : null,
        diasCreditoImportacionPropuesto:
          formData.estructuraPagoImportacionPropuesta === "CREDITO_PLAZO"
            ? Number(formData.diasCreditoImportacionPropuesto)
            : null,
        referenciaPlazoImportacionPropuesta:
          formData.estructuraPagoImportacionPropuesta === "CREDITO_PLAZO"
            ? formData.referenciaPlazoImportacionPropuesta || null
            : null,
        gastosBancariosPorPropuesto:
          formData.instrumentoPagoImportacionPropuesta === "CARTA_CREDITO"
            ? formData.gastosBancariosPorPropuesto || null
            : null,
        documentosPagoImportacionPropuestos:
          formData.documentosPagoImportacionPropuestos.trim() || null,
        observacionPagoImportacionPropuesta:
          formData.observacionPagoImportacionPropuesta.trim() || null,
      }
    : {
        formaPagoLocalPropuesta: formData.formaPagoLocalPropuesta,
        diasCreditoLocalPropuesto:
          formData.formaPagoLocalPropuesta === "CREDITO"
            ? Number(formData.diasCreditoLocalPropuesto)
            : null,
        porcentajeAnticipoLocalPropuesto:
          formData.formaPagoLocalPropuesta === "MIXTO"
            ? Number(formData.porcentajeAnticipoLocalPropuesto)
            : null,
        porcentajeSaldoLocalPropuesto:
          formData.formaPagoLocalPropuesta === "MIXTO"
            ? Number(formData.porcentajeSaldoLocalPropuesto)
            : null,
        observacionPagoLocalPropuesta:
          formData.observacionPagoLocalPropuesta.trim() || null,
      };

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "-";

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const getCurrencyLabel = (solicitud = {}) => {
  const base =
    SOLICITUD_COTIZACION_CURRENCY_LABELS[solicitud.moneda] ||
    solicitud.moneda ||
    "-";

  if (solicitud.moneda === "OTRA" && solicitud.codigoMonedaOtra) {
    return `${base} (${solicitud.codigoMonedaOtra})`;
  }

  return base;
};

const getCurrencyPrefix = (solicitud = {}) => {
  if (solicitud.moneda === "USD") return "USD";
  if (solicitud.moneda === "OTRA") return solicitud.codigoMonedaOtra || "";
  return "S/";
};

const formatCurrency = (value, solicitud = {}) => {
  const prefix = getCurrencyPrefix(solicitud);
  return `${prefix ? `${prefix} ` : ""}${Number(value || 0).toFixed(2)}`;
};

const labelFrom = (labels, value) => labels?.[value] || value || null;

const formatDays = (value, zeroLabel = "Inmediata") => {
  if (!hasValue(value)) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric === 0) return zeroLabel;
  return `${numeric} dia${numeric === 1 ? "" : "s"}`;
};

const formatPercentage = (value) => {
  if (!hasValue(value)) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `${numeric}%`;
};

const formatBoolean = (value) => {
  if (value === true) return "Si";
  if (value === false) return "No";
  return null;
};

const buildOfficialConditions = (solicitud = {}) =>
  [
    {
      label: "Tipo de compra",
      value: labelFrom(PURCHASE_TYPE_LABELS, solicitud.tipoCompra),
    },
    {
      label: "Validez de oferta solicitada",
      value: formatDays(solicitud.vigenciaOfertaDias, "Sin plazo indicado"),
    },
    {
      label: "Plazo de entrega solicitado",
      value: formatDays(solicitud.tiempoEntregaDias),
    },
    { label: "Garantia solicitada", value: solicitud.garantia },
    { label: "Lugar de entrega", value: solicitud.lugarEntrega },
    {
      label: "Alcance de compra local",
      value: labelFrom(LOCAL_PURCHASE_SCOPE_LABELS, solicitud.alcanceCompraLocal),
    },
    {
      label: "Tipo de lugar de entrega local",
      value: labelFrom(
        LOCAL_DELIVERY_PLACE_TYPE_LABELS,
        solicitud.lugarEntregaLocalTipo,
      ),
    },
    {
      label: "Detalle de lugar local",
      value: solicitud.lugarEntregaLocalDetalle,
    },
    {
      label: "Transporte asumido por",
      value: labelFrom(
        LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS,
        solicitud.transporteAsumidoPor,
      ),
    },
    {
      label: "Carga/descarga asumida por",
      value: labelFrom(
        LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS,
        solicitud.cargaDescargaAsumidaPor,
      ),
    },
    {
      label: "Permite entregas parciales",
      value: formatBoolean(solicitud.permiteEntregasParciales),
    },
    {
      label: "Condiciones logisticas locales",
      value: solicitud.condicionesLogisticasLocales,
    },
    {
      label: "Condicion de pago local",
      value: labelFrom(
        LOCAL_PAYMENT_CONDITION_LABELS,
        solicitud.condicionPagoLocal,
      ),
    },
    {
      label: "Hito de pago local",
      value: labelFrom(LOCAL_PAYMENT_MILESTONE_LABELS, solicitud.hitoPagoLocal),
    },
    {
      label: "Anticipo local",
      value: formatPercentage(solicitud.porcentajeAnticipoLocal),
    },
    {
      label: "Saldo local",
      value: formatPercentage(solicitud.porcentajeSaldoLocal),
    },
    {
      label: "Dias de credito local",
      value: formatDays(solicitud.diasCreditoLocal, "0 dias"),
    },
    {
      label: "Incoterm",
      value: [solicitud.incoterm, solicitud.incotermVersion]
        .filter(Boolean)
        .join(" "),
    },
    {
      label: "Punto logistico Incoterm",
      value: solicitud.incotermPuntoLogistico,
    },
    {
      label: "Estructura de pago",
      value: labelFrom(
        IMPORT_PAYMENT_STRUCTURE_LABELS,
        solicitud.estructuraPagoImportacion,
      ),
    },
    {
      label: "Instrumento de pago",
      value: labelFrom(
        IMPORT_PAYMENT_INSTRUMENT_LABELS,
        solicitud.instrumentoPagoImportacion,
      ),
    },
    {
      label: "Gatillo de pago",
      value: labelFrom(
        IMPORT_PAYMENT_TRIGGER_LABELS,
        solicitud.gatilloPagoImportacion,
      ),
    },
    {
      label: "Anticipo importacion",
      value: formatPercentage(solicitud.porcentajeAnticipoImportacion),
    },
    {
      label: "Saldo importacion",
      value: formatPercentage(solicitud.porcentajeSaldoImportacion),
    },
    {
      label: "Referencia de plazo",
      value: labelFrom(
        IMPORT_PAYMENT_TERM_REFERENCE_LABELS,
        solicitud.referenciaPlazoImportacion,
      ),
    },
    {
      label: "Dias de credito importacion",
      value: formatDays(solicitud.diasCreditoImportacion, "0 dias"),
    },
    {
      label: "Gastos bancarios por",
      value: labelFrom(BANK_CHARGE_PARTY_LABELS, solicitud.gastosBancariosPor),
    },
    {
      label: "Observaciones de la solicitud",
      value: solicitud.cuerpoSolicitud,
      wide: true,
    },
  ].filter((item) => hasValue(item.value));

const normalizeConditionGroups = (solicitud = {}) => {
  const condiciones = solicitud.condicionesOficiales;

  if (condiciones) {
    return [
      {
        title: "Condiciones generales",
        items: condiciones.comunes || [],
      },
      {
        title: "Condiciones logisticas",
        items: condiciones.logistica || [],
      },
      {
        title: "Condiciones de pago",
        items: condiciones.pago || [],
      },
    ].filter((group) => Array.isArray(group.items) && group.items.length > 0);
  }

  const fallbackItems = buildOfficialConditions(solicitud);
  return fallbackItems.length
    ? [{ title: "Condiciones oficiales", items: fallbackItems }]
    : [];
};

const buildSolicitudFields = (solicitud = {}) =>
  [
    { label: "Codigo", value: solicitud.codigo },
    { label: "Fecha de emision", value: formatDate(solicitud.fechaEmision) },
    {
      label: "Fecha limite",
      value: formatDate(solicitud.fechaLimiteRecepcion),
    },
    {
      label: "Medio de recepcion",
      value:
        SOLICITUD_COTIZACION_RECEPTION_CHANNEL_LABELS[
          solicitud.medioRecepcion
        ] ||
        solicitud.medioRecepcion ||
        "Sistema",
    },
    { label: "Moneda", value: getCurrencyLabel(solicitud) },
    {
      label: "Requerimiento asociado",
      value: solicitud.requerimiento?.codigo,
    },
    {
      label: "Area solicitante",
      value: solicitud.requerimiento?.areaSolicitante,
    },
    {
      label: "Tipo de compra",
      value: labelFrom(PURCHASE_TYPE_LABELS, solicitud.tipoCompra),
    },
  ].filter((item) => hasValue(item.value));

const buildProveedorFields = (proveedor = {}) =>
  [
    { label: "Razon social", value: proveedor.nombre || proveedor.razonSocial },
    { label: "RUC", value: proveedor.ruc },
    {
      label: "Domicilio legal",
      value: proveedor.domicilioLegal || proveedor.direccion,
      wide: true,
    },
    { label: "Telefono", value: proveedor.telefono },
    { label: "Correo", value: proveedor.correo || proveedor.correoElectronico },
    {
      label: "Contacto / representante",
      value: proveedor.contacto || proveedor.representante,
    },
  ].filter((item) => hasValue(item.value));

const EMPTY_READ_ONLY_FIELDS = [];

const ReadOnlyFieldGrid = ({ items = EMPTY_READ_ONLY_FIELDS }) =>
  items.length ? (
    <dl className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded border border-slate-200 bg-slate-50 p-3 ${
            item.wide ? "md:col-span-2 lg:col-span-3" : ""
          }`}
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-1 whitespace-pre-line text-sm font-medium text-slate-900">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  ) : null;

const buildItemsDraft = (items = []) =>
  items.map((item) => ({
    itemRequerimientoId: item.itemRequerimientoId,
    estadoRespuesta: "COTIZADO",
    cantidadOfrecida: String(item.cantidad || ""),
    precioUnidad: "",
    descripcionTecnicaOfertada: "",
  }));

const ProveedorCotizacionPublicPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [detail, setDetail] = useState(null);
  const [message, setMessage] = useState(null);
  const [claveTemporal, setClaveTemporal] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [formData, setFormData] = useState({
    codigoProveedorOpcional: "",
    garantia: "",
    tiempoEntregaDias: "",
    vigenciaOfertaDias: "",
    lugarEntrega: "",
    formaPagoLocalPropuesta: "",
    diasCreditoLocalPropuesto: "",
    porcentajeAnticipoLocalPropuesto: "",
    porcentajeSaldoLocalPropuesto: "",
    observacionPagoLocalPropuesta: "",
    estructuraPagoImportacionPropuesta: "",
    instrumentoPagoImportacionPropuesta: "",
    gatilloPagoImportacionPropuesta: "",
    porcentajeAnticipoImportacionPropuesto: "",
    porcentajeSaldoImportacionPropuesto: "",
    diasCreditoImportacionPropuesto: "",
    referenciaPlazoImportacionPropuesta: "",
    gastosBancariosPorPropuesto: "",
    documentosPagoImportacionPropuestos: "",
    observacionPagoImportacionPropuesta: "",
    observaciones: "",
    items: [],
  });

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    publicProveedorCotizacionesApi
      .obtenerEstado(token)
      .then((data) => {
        if (cancelled) return;
        setStatus(data);
        setMessage(data?.message || null);
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(
          error?.message ||
            "No se pudo validar el enlace. Comuniquese con logistica.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const totalOferta = useMemo(
    () =>
      formData.items.reduce((total, item) => {
        if (item.estadoRespuesta === "NO_COTIZA") return total;
        return (
          total +
          Number(item.cantidadOfrecida || 0) * Number(item.precioUnidad || 0)
        );
      }, 0),
    [formData.items],
  );

  const officialConditions = useMemo(
    () => normalizeConditionGroups(detail?.solicitud),
    [detail?.solicitud],
  );
  const solicitudFields = useMemo(
    () => buildSolicitudFields(detail?.solicitud),
    [detail?.solicitud],
  );
  const proveedorFields = useMemo(
    () => buildProveedorFields(detail?.proveedor),
    [detail?.proveedor],
  );

  const unitPriceCurrencyLabel =
    getCurrencyPrefix(detail?.solicitud) || getCurrencyLabel(detail?.solicitud);
  const isImportacion =
    String(detail?.solicitud?.tipoCompra || "").toUpperCase() ===
    "IMPORTACION";
  const isLocal =
    String(detail?.solicitud?.tipoCompra || "").toUpperCase() === "LOCAL";

  const handleValidateKey = async (event) => {
    event.preventDefault();
    setFieldErrors([]);
    setMessage(null);

    if (!claveTemporal.trim()) {
      setFieldErrors(["Ingresa la clave temporal."]);
      return;
    }

    setSubmitting(true);
    try {
      const data = await publicProveedorCotizacionesApi.validarClave(
        token,
        claveTemporal.trim(),
      );
      setDetail(data);
      setFormData((prev) => ({
        ...prev,
        items: buildItemsDraft(data.items || []),
      }));
    } catch (error) {
      setMessage(error?.message || "No se pudo validar la clave temporal.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = (itemId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (Number(item.itemRequerimientoId) !== Number(itemId)) return item;

        const nextItem = { ...item, [field]: value };

        if (field === "estadoRespuesta" && value === "NO_COTIZA") {
          return {
            ...nextItem,
            cantidadOfrecida: "",
            precioUnidad: "",
          };
        }

        return nextItem;
      }),
    }));
  };

  const validateCotizacion = () => {
    const errors = [];

    formData.items.forEach((item, index) => {
      const label = `Item ${index + 1}`;

      if (!["COTIZADO", "NO_COTIZA"].includes(item.estadoRespuesta)) {
        errors.push(`${label}: selecciona si cotiza o no cotiza.`);
      }

      if (item.estadoRespuesta === "COTIZADO") {
        if (Number(item.cantidadOfrecida) <= 0) {
          errors.push(`${label}: la cantidad ofrecida debe ser mayor a 0.`);
        }

        if (Number(item.precioUnidad) <= 0) {
          errors.push(`${label}: el precio unitario debe ser mayor a 0.`);
        }
      }

      if (String(item.descripcionTecnicaOfertada || "").length > 1000) {
        errors.push(
          `${label}: la descripcion tecnica ofertada no debe superar los 1000 caracteres.`,
        );
      }
    });

    if (
      formData.tiempoEntregaDias !== "" &&
      (!Number.isInteger(Number(formData.tiempoEntregaDias)) ||
        Number(formData.tiempoEntregaDias) < 0)
    ) {
      errors.push("El tiempo de entrega debe ser 0 o un entero positivo.");
    }

    if (
      formData.vigenciaOfertaDias !== "" &&
      (!Number.isInteger(Number(formData.vigenciaOfertaDias)) ||
        Number(formData.vigenciaOfertaDias) < 0)
    ) {
      errors.push("La vigencia de oferta debe ser 0 o un entero positivo.");
    }

    if (isImportacion) {
      if (!formData.estructuraPagoImportacionPropuesta) {
        errors.push("Selecciona la estructura de pago de importacion propuesta.");
      }
      if (!formData.instrumentoPagoImportacionPropuesta) {
        errors.push("Selecciona el instrumento de pago de importacion propuesto.");
      }
      if (formData.estructuraPagoImportacionPropuesta === "MIXTO") {
        const anticipo = Number(formData.porcentajeAnticipoImportacionPropuesto);
        const saldo = Number(formData.porcentajeSaldoImportacionPropuesto);
        if (
          !Number.isFinite(anticipo) ||
          !Number.isFinite(saldo) ||
          anticipo <= 0 ||
          saldo <= 0
        ) {
          errors.push("El pago mixto de importacion requiere anticipo y saldo mayores a 0.");
        } else if (Math.round((anticipo + saldo) * 100) / 100 !== 100) {
          errors.push("Los porcentajes de importacion propuestos deben sumar 100.");
        }
      }
      if (formData.estructuraPagoImportacionPropuesta === "CREDITO_PLAZO") {
        if (
          !Number.isInteger(Number(formData.diasCreditoImportacionPropuesto)) ||
          Number(formData.diasCreditoImportacionPropuesto) <= 0
        ) {
          errors.push("El credito de importacion requiere dias mayores a 0.");
        }
        if (!formData.referenciaPlazoImportacionPropuesta) {
          errors.push("Selecciona la referencia del plazo de importacion propuesta.");
        }
      }
      if (
        formData.estructuraPagoImportacionPropuesta === "CONTRA_DOCUMENTOS" &&
        !formData.gatilloPagoImportacionPropuesta
      ) {
        errors.push("Selecciona el gatillo documentario propuesto.");
      }
      if (
        formData.instrumentoPagoImportacionPropuesta === "CARTA_CREDITO" &&
        !formData.gastosBancariosPorPropuesto
      ) {
        errors.push("Selecciona quien asume los gastos bancarios propuestos.");
      }
      if (formData.documentosPagoImportacionPropuestos.length > 1000) {
        errors.push("Los documentos de pago propuestos no deben superar los 1000 caracteres.");
      }
      if (formData.observacionPagoImportacionPropuesta.length > 1000) {
        errors.push("La observacion de pago de importacion propuesta no debe superar los 1000 caracteres.");
      }
    }

    if (isLocal) {
      if (!formData.formaPagoLocalPropuesta) {
        errors.push("Selecciona la forma de pago local propuesta por el proveedor.");
      }
      if (formData.formaPagoLocalPropuesta === "CREDITO") {
        if (
          !Number.isInteger(Number(formData.diasCreditoLocalPropuesto)) ||
          Number(formData.diasCreditoLocalPropuesto) <= 0
        ) {
          errors.push("El credito local requiere dias mayores a 0.");
        }
      }
      if (formData.formaPagoLocalPropuesta === "MIXTO") {
        const anticipo = Number(formData.porcentajeAnticipoLocalPropuesto);
        const saldo = Number(formData.porcentajeSaldoLocalPropuesto);
        if (
          !Number.isFinite(anticipo) ||
          !Number.isFinite(saldo) ||
          anticipo <= 0 ||
          saldo <= 0
        ) {
          errors.push("El pago local mixto requiere anticipo y saldo mayores a 0.");
        } else if (Math.round((anticipo + saldo) * 100) / 100 !== 100) {
          errors.push("Los porcentajes de pago local propuestos deben sumar 100.");
        }
      }
      if (formData.observacionPagoLocalPropuesta.length > 1000) {
        errors.push("La observacion sobre pago local propuesto no debe superar los 1000 caracteres.");
      }
    }

    return errors;
  };

  const handleSubmitCotizacion = async (event) => {
    event.preventDefault();
    setFieldErrors([]);
    setMessage(null);

    const errors = validateCotizacion();
    if (errors.length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await publicProveedorCotizacionesApi.registrarCotizacion(
        token,
        {
          claveTemporal: claveTemporal.trim(),
          cotizacion: {
            codigoProveedorOpcional:
              formData.codigoProveedorOpcional.trim() || null,
            garantia: formData.garantia.trim() || null,
            tiempoEntregaDias:
              formData.tiempoEntregaDias === ""
                ? null
                : Number(formData.tiempoEntregaDias),
            vigenciaOfertaDias:
              formData.vigenciaOfertaDias === ""
                ? null
                : Number(formData.vigenciaOfertaDias),
            lugarEntrega: formData.lugarEntrega.trim() || null,
            ...buildPaymentProposalPayload(formData, isImportacion),
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
              descripcionTecnicaOfertada:
                item.descripcionTecnicaOfertada.trim() || null,
            })),
          },
        },
      );
      setConfirmation(result);
    } catch (error) {
      setMessage(error?.message || "No se pudo enviar la cotizacion.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderMessage = () =>
    message ? (
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {message}
      </div>
    ) : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Validando enlace…</p>
        </div>
      </main>
    );
  }

  if (confirmation) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-3xl rounded bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Cotizacion enviada
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Gracias, su cotizacion fue registrada correctamente.
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Codigo interno: {confirmation.cotizacion?.codigo || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Total registrado:{" "}
              {formatCurrency(
                confirmation.cotizacion?.totalOferta || 0,
                detail?.solicitud,
              )}
          </p>
        </section>
      </main>
    );
  }

  const canEnterKey = status?.requiereClave !== false && !detail;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="rounded bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Portal publico de proveedores
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Registro de cotizacion
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Este enlace permite responder solo la solicitud de cotizacion
            asociada al acceso recibido.
          </p>
        </header>

        {renderMessage()}

        {canEnterKey ? (
          <form
            onSubmit={handleValidateKey}
            className="rounded bg-white p-6 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="space-y-1 text-sm">
                <span className="font-semibold text-slate-700">
                  Clave temporal
                </span>
                <input
                  type="password"
                  value={claveTemporal}
                  onChange={(event) => setClaveTemporal(event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  autoComplete="one-time-code"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="self-end rounded bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Validando…" : "Ingresar"}
              </button>
            </div>
            {fieldErrors.length ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-red-700">
                {fieldErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </form>
        ) : null}

        {detail?.cotizacionExistente ? (
          <section className="rounded bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Cotizacion registrada
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Esta solicitud ya tiene una cotizacion enviada.
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Codigo interno: {detail.cotizacionExistente.codigo || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Total registrado:{" "}
              {formatCurrency(detail.cotizacionExistente.totalOferta || 0)}
            </p>
          </section>
        ) : null}

        {detail && !detail.cotizacionExistente ? (
          <form onSubmit={handleSubmitCotizacion} className="space-y-5">
            <section className="rounded bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Datos de la Solicitud de Cotizacion
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Informacion oficial de la solicitud asociada a este acceso.
                </p>
              </div>
              <div className="mt-4">
                <ReadOnlyFieldGrid items={solicitudFields} />
              </div>
            </section>

            <section className="rounded bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Datos del proveedor invitado
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Verifique que la solicitud corresponde a su razon social antes
                  de registrar la oferta.
                </p>
              </div>
              <div className="mt-4">
                <ReadOnlyFieldGrid items={proveedorFields} />
              </div>
              {!proveedorFields.length ? (
                <p className="mt-4 rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No hay datos adicionales del proveedor para mostrar.
                </p>
              ) : null}
            </section>

            <section className="rounded bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Condiciones oficiales de la Solicitud de Cotizacion
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Estos datos vienen de la solicitud oficial y son solo de
                  referencia. No reemplazan los datos que registre como oferta.
                </p>
              </div>
              {officialConditions.length ? (
                <div className="mt-4 space-y-5">
                  {officialConditions.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                        {group.title}
                      </h3>
                      <ReadOnlyFieldGrid items={group.items} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  La solicitud no registra condiciones oficiales adicionales.
                </p>
              )}
            </section>

            <section className="rounded bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">
                  Items solicitados
                </h2>
                <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Total oferta
                  </p>
                  <p className="text-lg font-bold text-emerald-950">
                    {formatCurrency(totalOferta, detail.solicitud)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {formData.items.map((item, index) => {
                  const source = detail.items?.find(
                    (currentItem) =>
                      Number(currentItem.itemRequerimientoId) ===
                      Number(item.itemRequerimientoId),
                  );
                  const subtotal =
                    item.estadoRespuesta === "NO_COTIZA"
                      ? 0
                      : Number(item.cantidadOfrecida || 0) *
                        Number(item.precioUnidad || 0);

                  return (
                    <div
                      key={item.itemRequerimientoId}
                      className="rounded border border-slate-200 p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            Item solicitado
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                            {source?.descripcionSolicitada ||
                              source?.descripcion ||
                              `Item ${index + 1}`}
                          </p>
                          {source?.observacionSolicitada ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Observacion solicitada:{" "}
                              {source.observacionSolicitada}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-500">
                            Cantidad solicitada: {source?.cantidad || 0}{" "}
                            {source?.unidadMedida || ""}
                          </p>
                        </div>
                        <label className="space-y-1 text-sm">
                          <span className="font-semibold">Respuesta</span>
                          <select
                            value={item.estadoRespuesta}
                            onChange={(event) =>
                              updateItem(
                                item.itemRequerimientoId,
                                "estadoRespuesta",
                                event.target.value,
                              )
                            }
                            className="w-full rounded border border-slate-300 px-3 py-2"
                          >
                            <option value="COTIZADO">Cotizado</option>
                            <option value="NO_COTIZA">No cotiza</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-sm">
                          <span className="font-semibold">
                            Cantidad ofrecida
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={item.estadoRespuesta === "NO_COTIZA"}
                            value={item.cantidadOfrecida}
                            onChange={(event) =>
                              updateItem(
                                item.itemRequerimientoId,
                                "cantidadOfrecida",
                                event.target.value,
                              )
                            }
                            className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                          />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span className="font-semibold">
                            Precio unitario ({unitPriceCurrencyLabel})
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={item.estadoRespuesta === "NO_COTIZA"}
                            value={item.precioUnidad}
                            onChange={(event) =>
                              updateItem(
                                item.itemRequerimientoId,
                                "precioUnidad",
                                event.target.value,
                              )
                            }
                            className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                          />
                        </label>
                      </div>
                      <label className="mt-3 block space-y-1 text-sm">
                        <span className="font-semibold">
                          Descripcion tecnica ofertada
                        </span>
                        <textarea
                          rows="3"
                          maxLength={1000}
                          value={item.descripcionTecnicaOfertada}
                          onChange={(event) =>
                            updateItem(
                              item.itemRequerimientoId,
                              "descripcionTecnicaOfertada",
                              event.target.value,
                            )
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2"
                          placeholder="Opcional. Complete solo si desea precisar marca, modelo, caracteristicas o mejoras respecto de lo solicitado."
                        />
                        <span className="block text-right text-xs text-slate-500">
                          {String(item.descripcionTecnicaOfertada || "").length}
                          /1000
                        </span>
                      </label>
                      <p className="mt-3 text-right text-sm font-semibold text-slate-900">
                        {item.estadoRespuesta === "NO_COTIZA"
                          ? "Sin oferta"
                          : `Subtotal: ${formatCurrency(
                              subtotal,
                              detail.solicitud,
                            )}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Datos generales de la oferta del proveedor
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Complete aqui los datos propios de su propuesta. Las
                  condiciones oficiales de la solicitud se muestran arriba y no
                  se modifican desde este formulario.
                </p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">
                    N.º de cotizacion del proveedor
                  </span>
                  <input
                    value={formData.codigoProveedorOpcional}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        codigoProveedorOpcional: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="Opcional. Ingrese el numero o referencia de su cotizacion, si cuenta con uno."
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">Garantia ofertada</span>
                  <input
                    value={formData.garantia}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        garantia: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="Opcional"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">
                    Tiempo de entrega ofertado (dias)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.tiempoEntregaDias}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        tiempoEntregaDias: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">
                    Vigencia ofrecida (dias)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.vigenciaOfertaDias}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        vigenciaOfertaDias: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-1 lg:col-span-2">
                  <span className="font-semibold">
                    Lugar de entrega propuesto
                  </span>
                  <input
                    value={formData.lugarEntrega}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        lugarEntrega: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="Opcional"
                  />
                </label>
                {isLocal ? (
                  <div className="space-y-3 rounded border border-blue-100 bg-blue-50/50 p-4 md:col-span-2 lg:col-span-4">
                    <div>
                      <h3 className="text-sm font-semibold text-blue-950">
                        Forma de pago local propuesta por el proveedor
                      </h3>
                      <p className="text-xs text-blue-800">
                        Las condiciones oficiales de pago se muestran arriba. Use
                        este bloque para registrar su propuesta local.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <label className="space-y-1 text-sm">
                        <span className="font-semibold">
                          Forma de pago local propuesta
                        </span>
                        <select
                          value={formData.formaPagoLocalPropuesta}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              ...resetLocalPaymentProposalFields(
                                event.target.value,
                              ),
                            }))
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2"
                          required
                        >
                          {formasPagoLocalPropuesta.map((option) => (
                            <option
                              key={option.value || "empty"}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {formData.formaPagoLocalPropuesta === "CREDITO" ? (
                        <label className="space-y-1 text-sm">
                          <span className="font-semibold">
                            Dias de credito local propuestos
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.diasCreditoLocalPropuesto}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                diasCreditoLocalPropuesto: event.target.value,
                              }))
                            }
                            className="w-full rounded border border-slate-300 px-3 py-2"
                            required
                          />
                        </label>
                      ) : null}
                      {formData.formaPagoLocalPropuesta === "MIXTO" ? (
                        <>
                          <label className="space-y-1 text-sm">
                            <span className="font-semibold">
                              % anticipo local propuesto
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={formData.porcentajeAnticipoLocalPropuesto}
                              onChange={(event) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  porcentajeAnticipoLocalPropuesto:
                                    event.target.value,
                                }))
                              }
                              className="w-full rounded border border-slate-300 px-3 py-2"
                              required
                            />
                          </label>
                          <label className="space-y-1 text-sm">
                            <span className="font-semibold">
                              % saldo local propuesto
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={formData.porcentajeSaldoLocalPropuesto}
                              onChange={(event) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  porcentajeSaldoLocalPropuesto:
                                    event.target.value,
                                }))
                              }
                              className="w-full rounded border border-slate-300 px-3 py-2"
                              required
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                    <label className="space-y-1 text-sm">
                      <span className="font-semibold">
                        Observacion sobre pago local propuesto
                      </span>
                      <textarea
                        rows="2"
                        value={formData.observacionPagoLocalPropuesta}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            observacionPagoLocalPropuesta: event.target.value,
                          }))
                        }
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder="Opcional. Agregue precisiones sobre su propuesta de pago local."
                      />
                    </label>
                  </div>
                ) : null}

                {isImportacion ? (
                  <div className="space-y-3 rounded border border-indigo-100 bg-indigo-50/50 p-4 md:col-span-2 lg:col-span-4">
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-950">
                        Propuesta de pago de importacion del proveedor
                      </h3>
                      <p className="text-xs text-indigo-800">
                        Registre la estructura, instrumento y condiciones de
                        pago de importacion propuestas. Incoterm y punto
                        logistico se mantienen como contexto oficial.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <label className="space-y-1 text-sm">
                        <span className="font-semibold">
                          Estructura propuesta
                        </span>
                        <select
                          value={formData.estructuraPagoImportacionPropuesta}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              ...resetImportPaymentProposalStructureFields(
                                event.target.value,
                              ),
                            }))
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2"
                          required
                        >
                          <option value="">Seleccionar</option>
                          {IMPORT_PAYMENT_STRUCTURE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-semibold">
                          Instrumento propuesto
                        </span>
                        <select
                          value={formData.instrumentoPagoImportacionPropuesta}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              ...resetImportPaymentProposalInstrumentFields(
                                event.target.value,
                              ),
                            }))
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2"
                          required
                        >
                          <option value="">Seleccionar</option>
                          {IMPORT_PAYMENT_INSTRUMENT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {formData.estructuraPagoImportacionPropuesta ===
                      "MIXTO" ? (
                        <>
                          <label className="space-y-1 text-sm">
                            <span className="font-semibold">
                              % anticipo importacion propuesto
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={
                                formData.porcentajeAnticipoImportacionPropuesto
                              }
                              onChange={(event) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  porcentajeAnticipoImportacionPropuesto:
                                    event.target.value,
                                }))
                              }
                              className="w-full rounded border border-slate-300 px-3 py-2"
                              required
                            />
                          </label>
                          <label className="space-y-1 text-sm">
                            <span className="font-semibold">
                              % saldo importacion propuesto
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={
                                formData.porcentajeSaldoImportacionPropuesto
                              }
                              onChange={(event) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  porcentajeSaldoImportacionPropuesto:
                                    event.target.value,
                                }))
                              }
                              className="w-full rounded border border-slate-300 px-3 py-2"
                              required
                            />
                          </label>
                        </>
                      ) : null}
                      {formData.estructuraPagoImportacionPropuesta ===
                      "CREDITO_PLAZO" ? (
                        <>
                          <label className="space-y-1 text-sm">
                            <span className="font-semibold">
                              Dias credito importacion propuestos
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={formData.diasCreditoImportacionPropuesto}
                              onChange={(event) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  diasCreditoImportacionPropuesto:
                                    event.target.value,
                                }))
                              }
                              className="w-full rounded border border-slate-300 px-3 py-2"
                              required
                            />
                          </label>
                          <label className="space-y-1 text-sm">
                            <span className="font-semibold">
                              Referencia plazo propuesta
                            </span>
                            <select
                              value={
                                formData.referenciaPlazoImportacionPropuesta
                              }
                              onChange={(event) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  referenciaPlazoImportacionPropuesta:
                                    event.target.value,
                                }))
                              }
                              className="w-full rounded border border-slate-300 px-3 py-2"
                              required
                            >
                              <option value="">Seleccionar</option>
                              {IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS.map(
                                (option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </>
                      ) : null}
                      {formData.estructuraPagoImportacionPropuesta ===
                      "CONTRA_DOCUMENTOS" ? (
                        <label className="space-y-1 text-sm">
                          <span className="font-semibold">
                            Gatillo documentario propuesto
                          </span>
                          <select
                            value={formData.gatilloPagoImportacionPropuesta}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                gatilloPagoImportacionPropuesta:
                                  event.target.value,
                              }))
                            }
                            className="w-full rounded border border-slate-300 px-3 py-2"
                            required
                          >
                            <option value="">Seleccionar</option>
                            {IMPORT_PAYMENT_TRIGGER_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      {formData.instrumentoPagoImportacionPropuesta ===
                      "CARTA_CREDITO" ? (
                        <label className="space-y-1 text-sm">
                          <span className="font-semibold">
                            Gastos bancarios propuestos por
                          </span>
                          <select
                            value={formData.gastosBancariosPorPropuesto}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                gastosBancariosPorPropuesto:
                                  event.target.value,
                              }))
                            }
                            className="w-full rounded border border-slate-300 px-3 py-2"
                            required
                          >
                            <option value="">Seleccionar</option>
                            {BANK_CHARGE_PARTY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                    <label className="space-y-1 text-sm">
                      <span className="font-semibold">
                        Documentos de pago propuestos
                      </span>
                      <textarea
                        rows="2"
                        value={formData.documentosPagoImportacionPropuestos}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            documentosPagoImportacionPropuestos:
                              event.target.value,
                          }))
                        }
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder="Opcional. Factura comercial, packing list, BL, certificado u otros."
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-semibold">
                        Observacion de pago de importacion propuesta
                      </span>
                      <textarea
                        rows="2"
                        value={formData.observacionPagoImportacionPropuesta}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            observacionPagoImportacionPropuesta:
                              event.target.value,
                          }))
                        }
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder="Opcional. Agregue precisiones de pago de importacion."
                      />
                    </label>
                  </div>
                ) : null}
                <label className="space-y-1 text-sm md:col-span-2 lg:col-span-4">
                  <span className="font-semibold">
                    Observaciones del proveedor
                  </span>
                  <textarea
                    rows="3"
                    value={formData.observaciones}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        observaciones: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="Opcional. Indique precisiones de su oferta."
                  />
                </label>
              </div>
            </section>

            {fieldErrors.length ? (
              <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <ul className="list-disc space-y-1 pl-5">
                  {fieldErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <section className="flex flex-col gap-4 rounded bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total de oferta
                </p>
                <p className="text-2xl font-bold text-slate-950">
                  {formatCurrency(totalOferta, detail.solicitud)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Al enviar, la cotizacion quedara registrada y no podra
                  modificarse desde este portal publico.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Enviando…" : "Enviar cotizacion"}
              </button>
            </section>
          </form>
        ) : null}
      </section>
    </main>
  );
};

export default ProveedorCotizacionPublicPage;
