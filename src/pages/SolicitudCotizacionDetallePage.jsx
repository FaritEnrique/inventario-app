// src/pages/SolicitudCotizacionDetallePage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCopy,
  FaEnvelope,
  FaFilePdf,
  FaHistory,
  FaKey,
  FaPrint,
  FaWhatsapp,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { canOperateCotizacionesLogisticaEffective } from "../accessRules";
import Modal from "../components/Modal";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import SolicitudCotizacionDetalleSkeleton from "../components/ui/skeletons/SolicitudCotizacionDetalleSkeleton";
import { useAuth } from "../context/authContext";
import useSolicitudCotizacionDetalleData from "../hooks/useSolicitudCotizacionDetalleData";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";
import { printHtmlInNewWindow } from "../utils/printWindow";
import { escapeHtml } from "../utils/configuracionEmpresaLetterhead";
import { buildSolicitudCotizacionEnvioTracePrintHtml } from "../utils/solicitudCotizacionEnvioPrintDocument";
import {
  buildSolicitudCotizacionDocumentContract,
  solicitudCotizacionDocumentFieldLabels,
} from "../utils/solicitudCotizacionDocumentContract";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "-";

const readValue = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_COUNTRY_OPTIONS = [
  { pais: "Peru", codigo: "+51" },
  { pais: "Estados Unidos", codigo: "+1" },
  { pais: "Chile", codigo: "+56" },
  { pais: "Colombia", codigo: "+57" },
  { pais: "Ecuador", codigo: "+593" },
  { pais: "Bolivia", codigo: "+591" },
  { pais: "Argentina", codigo: "+54" },
  { pais: "Brasil", codigo: "+55" },
  { pais: "Mexico", codigo: "+52" },
  { pais: "Espana", codigo: "+34" },
];

const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRY_OPTIONS[0];

const cleanPhoneDigits = (value) => String(value || "").replace(/[^\d]/g, "");

const cleanCountryCode = (value) => cleanPhoneDigits(value);

const findCountryByDigits = (digits) =>
  [...PHONE_COUNTRY_OPTIONS]
    .sort((left, right) => right.codigo.length - left.codigo.length)
    .find((option) => digits.startsWith(cleanCountryCode(option.codigo)));

const buildInitialSystemAccessPhone = (solicitud) => {
  const rawPhone = solicitud?.proveedor?.telefono || "";
  const rawPhoneText = String(rawPhone).trim();
  const digits = cleanPhoneDigits(rawPhoneText);
  const detectedCountry =
    rawPhoneText.startsWith("+") || digits.length > 10
      ? findCountryByDigits(digits)
      : null;
  const selectedCountry = detectedCountry || DEFAULT_PHONE_COUNTRY;
  const selectedCodeDigits = cleanCountryCode(selectedCountry.codigo);
  const localNumber =
    detectedCountry && digits.startsWith(selectedCodeDigits)
      ? digits.slice(selectedCodeDigits.length)
      : digits;

  return {
    paisTelefono: selectedCountry.pais,
    codigoPaisTelefono: selectedCountry.codigo,
    numeroLocalTelefono: localNumber,
  };
};

const buildWhatsappNormalizedNumber = ({
  codigoPaisTelefono,
  numeroLocalTelefono,
}) => {
  const countryCode = cleanCountryCode(codigoPaisTelefono);
  let localNumber = cleanPhoneDigits(numeroLocalTelefono);

  if (countryCode && localNumber.startsWith(countryCode)) {
    localNumber = localNumber.slice(countryCode.length);
  }

  return countryCode && localNumber ? `${countryCode}${localNumber}` : "";
};

const ACCESS_EVENT_LABELS = {
  ACCESO_GENERADO: "Acceso generado",
  WHATSAPP_MENSAJE_PREPARADO: "Mensaje preparado",
  WHATSAPP_MENSAJE_COPIADO: "Mensaje copiado",
  WHATSAPP_ABIERTO: "WhatsApp abierto",
  PROVEEDOR_PRIMER_INGRESO: "Primer ingreso del proveedor",
  CLAVE_FALLIDA: "Clave fallida",
  CLAVE_VALIDADA: "Clave validada",
  COTIZACION_BORRADOR_GUARDADO: "Borrador guardado",
  COTIZACION_FINALIZADA: "Cotizacion finalizada",
  ACCESO_VENCIDO: "Acceso vencido",
  ACCESO_BLOQUEADO: "Acceso bloqueado",
  ACCESO_REVOCADO: "Acceso revocado",
};

const formatAccessEventLabel = (tipoEvento) =>
  ACCESS_EVENT_LABELS[tipoEvento] || tipoEvento || "-";

const formatActorLabel = (event) => {
  if (event?.actorInterno?.nombre) return event.actorInterno.nombre;
  if (event?.actorTipo === "PROVEEDOR_ACCESO_PUBLICO") {
    return "Proveedor / acceso publico";
  }
  return "-";
};

const formatTraceDetail = (detalle = {}) => {
  if (!detalle || typeof detalle !== "object") return "-";

  const entries = Object.entries(detalle).filter(([, value]) => {
    if (value === null || value === undefined || value === "") return false;
    return typeof value !== "object";
  });

  if (!entries.length) return "-";

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
};

const getEventPhone = (event, access) =>
  event?.detalleSeguro?.numeroWhatsappNormalizado ||
  event?.detalleSeguro?.numeroWhatsappNormalizadoSnapshot ||
  access?.numeroWhatsappNormalizadoSnapshot ||
  null;

const buildAccessTracePrintHtml = ({ traceData, solicitud, printedBy }) => {
  const acceso = traceData?.acceso || {};
  const resumen = traceData?.resumen || {};
  const eventos = traceData?.eventos || [];
  const solicitudData = traceData?.solicitud || solicitud || {};
  const rows = eventos.length
    ? eventos
        .map(
          (event) => `
            <tr>
              <td>${escapeHtml(formatDateTime(event.fechaEvento))}</td>
              <td>${escapeHtml(formatAccessEventLabel(event.tipoEvento))}</td>
              <td>${escapeHtml(formatActorLabel(event))}</td>
              <td>${escapeHtml(readValue(getEventPhone(event, acceso)))}</td>
              <td>${escapeHtml(formatTraceDetail(event.detalleSeguro))}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="5" class="empty">Sin eventos registrados.</td></tr>`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Trazabilidad de acceso ${escapeHtml(readValue(solicitudData.codigo))}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
          h1 { font-size: 18px; margin: 0 0 14px; text-transform: uppercase; }
          h2 { font-size: 13px; margin: 20px 0 8px; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 20px; font-size: 12px; }
          .grid span { font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
          th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; }
          .empty { text-align: center; color: #64748b; }
        </style>
      </head>
      <body>
        <h1>Trazabilidad de acceso por sistema</h1>
        <section class="grid">
          <div><span>Solicitud:</span> ${escapeHtml(readValue(solicitudData.codigo))}</div>
          <div><span>Proveedor:</span> ${escapeHtml(readValue(solicitudData.proveedor?.razonSocial || solicitud?.proveedor?.razonSocial))}</div>
          <div><span>Estado acceso:</span> ${escapeHtml(readValue(acceso.estado))}</div>
          <div><span>Generado:</span> ${escapeHtml(formatDateTime(acceso.createdAt))}</div>
          <div><span>Vence:</span> ${escapeHtml(formatDateTime(acceso.expiresAt))}</div>
          <div><span>Finalizado:</span> ${escapeHtml(formatDateTime(acceso.respuestaFinalizadaAt))}</div>
          <div><span>Telefono:</span> ${escapeHtml(readValue(acceso.numeroWhatsappNormalizadoSnapshot))}</div>
          <div><span>Usuario que imprime:</span> ${escapeHtml(readValue(printedBy?.nombre))}</div>
        </section>
        <h2>Resumen</h2>
        <section class="grid">
          <div><span>Mensajes preparados:</span> ${escapeHtml(readValue(resumen.totalMensajesPreparados, "0"))}</div>
          <div><span>Mensajes copiados:</span> ${escapeHtml(readValue(resumen.totalMensajesCopiados, "0"))}</div>
          <div><span>WhatsApp abierto:</span> ${escapeHtml(readValue(resumen.totalWhatsappAbierto, "0"))}</div>
          <div><span>Regeneraciones:</span> ${escapeHtml(readValue(resumen.totalRegeneraciones, "0"))}</div>
          <div><span>Claves fallidas:</span> ${escapeHtml(readValue(resumen.totalIntentosFallidos, "0"))}</div>
          <div><span>Validaciones correctas:</span> ${escapeHtml(readValue(resumen.totalValidacionesCorrectas, "0"))}</div>
        </section>
        <h2>Linea cronologica</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Evento</th>
              <th>Actor</th>
              <th>Telefono</th>
              <th>Detalle seguro</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
};

const SummaryField = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-2 text-sm font-medium leading-6 text-gray-800">{value}</p>
  </div>
);

const InlineFieldList = ({ items }) => (
  <dl className="space-y-2">
    {items.map((item) => (
      <div
        key={item.label}
        className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[220px,1fr]"
      >
        <dt className="font-semibold text-gray-800">{item.label}:</dt>
        <dd className="leading-6 text-gray-700">{readValue(item.value)}</dd>
      </div>
    ))}
  </dl>
);

const buildDefaultEmailRecipient = (solicitud) =>
  solicitud?.proveedor?.correoElectronico?.trim() || "";

const SolicitudCotizacionDetallePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const {
    solicitud,
    loading,
    error,
    configuracionEmpresaError,
    documentData,
    reload,
  } =
    useSolicitudCotizacionDetalleData(id);
  const {
    obtenerSolicitudPdfUrl,
    obtenerHistorialEnvios,
    enviarSolicitudCorreo,
    generarAccesoSistemaSolicitud,
    registrarEventoAccesoSistema,
    obtenerTrazabilidadAccesoSistema,
  } = useSolicitudesCotizacion({
    autoLoad: false,
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailError, setEmailError] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [systemAccessModalOpen, setSystemAccessModalOpen] = useState(false);
  const [systemAccessLoading, setSystemAccessLoading] = useState(false);
  const [systemAccessData, setSystemAccessData] = useState(null);
  const [systemAccessError, setSystemAccessError] = useState("");
  const [systemAccessPhone, setSystemAccessPhone] = useState(() =>
    buildInitialSystemAccessPhone(null),
  );
  const [accessTraceModalOpen, setAccessTraceModalOpen] = useState(false);
  const [accessTraceData, setAccessTraceData] = useState(null);
  const [accessTraceLoading, setAccessTraceLoading] = useState(false);
  const [accessTraceError, setAccessTraceError] = useState("");

  const documentContract = useMemo(
    () =>
      solicitud ? buildSolicitudCotizacionDocumentContract(solicitud) : null,
    [solicitud],
  );

  const summaryItems = useMemo(
    () => [
      { label: "Código de solicitud", value: documentContract?.codigo || "-" },
      { label: "Estado", value: documentContract?.estado || "-" },
      {
        label: "Fecha de emisión",
        value: formatDate(documentContract?.fechaEmision),
      },
      {
        label: "Requerimiento asociado",
        value: documentContract?.requerimientoAsociado || "-",
      },
      {
        label: "Área solicitante",
        value: documentContract?.areaSolicitante || "-",
      },
      {
        label: "Proveedor",
        value: documentContract?.proveedor || "-",
      },
      {
        label: "RUC",
        value: documentContract?.ruc || "-",
      },
      {
        label: "Domicilio legal",
        value: documentContract?.domicilioLegal || "-",
      },
      {
        label: "Elaborador",
        value: documentContract?.elaborador || "-",
      },
      {
        label: "Cargo",
        value: documentContract?.cargo || "-",
      },
      {
        label: "Medio de recepción",
        value: documentContract?.recepcion?.medioRecepcionLabel || "-",
      },
      {
        label: "Fecha límite de recepción",
        value: formatDateTime(
          documentContract?.recepcion?.fechaLimiteRecepcion,
        ),
      },
    ],
    [documentContract],
  );

  const conditionItems = useMemo(
    () => [
      {
        label: "Moneda",
        value: documentContract?.condiciones?.monedaLabel,
      },
      ...(documentContract?.condiciones?.moneda === "OTRA"
        ? [
            {
              label: "Codigo moneda libre",
              value: documentContract.condiciones.codigoMonedaOtra,
            },
          ]
        : []),
      ...(documentContract?.condiciones?.tipoCompra === "LOCAL" &&
      documentContract?.condiciones?.tratamientoTributarioLocal
        ? [
            {
              label: "Tratamiento tributario local",
              value: documentContract.condiciones.tratamientoTributarioLocal,
            },
          ]
        : []),
      {
        label: "Vigencia de oferta",
        value:
          documentContract?.condiciones?.vigenciaOfertaDias != null
            ? `${documentContract.condiciones.vigenciaOfertaDias} días`
            : null,
      },
      {
        label: "Tiempo de entrega",
        value:
          documentContract?.condiciones?.tiempoEntregaDias != null
            ? documentContract.condiciones.tiempoEntregaDias === 0
              ? "Inmediata"
              : `${documentContract.condiciones.tiempoEntregaDias} días`
            : null,
      },
      ...(!documentContract?.condiciones?.tipoCompra &&
      documentContract?.condiciones?.lugarEntrega
        ? [
            {
              label: "Lugar de entrega",
              value: documentContract.condiciones.lugarEntrega,
            },
          ]
        : []),
      {
        label: "Garantía",
        value: documentContract?.condiciones?.garantia,
      },
      ...(documentContract?.condiciones?.tipoCompra
        ? [
            {
              label: "Tipo de compra",
              value:
                documentContract.condiciones.tipoCompra === "LOCAL"
                  ? "Compra local"
                  : "Importación",
            },
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.alcanceCompraLocalLabel
              ? [
                  {
                    label: "Alcance local",
                    value: documentContract.condiciones.alcanceCompraLocalLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.lugarEntregaLocalTipoLabel
              ? [
                  {
                    label: "Tipo de lugar local",
                    value:
                      documentContract.condiciones.lugarEntregaLocalTipoLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.lugarEntregaLocalDetalle
              ? [
                  {
                    label: "Detalle de lugar local",
                    value:
                      documentContract.condiciones.lugarEntregaLocalDetalle,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.transporteAsumidoPorLabel
              ? [
                  {
                    label: "Transporte asumido por",
                    value:
                      documentContract.condiciones.transporteAsumidoPorLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.cargaDescargaAsumidaPorLabel
              ? [
                  {
                    label: "Carga/descarga asumida por",
                    value:
                      documentContract.condiciones
                        .cargaDescargaAsumidaPorLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.permiteEntregasParcialesLabel
              ? [
                  {
                    label: "Permite entregas parciales",
                    value:
                      documentContract.condiciones
                        .permiteEntregasParcialesLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.condicionesLogisticasLocales
              ? [
                  {
                    label: "Condiciones logisticas locales",
                    value:
                      documentContract.condiciones
                        .condicionesLogisticasLocales,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.formaPagoLocalLabel
              ? [
                  {
                    label: "Forma de pago",
                    value: documentContract.condiciones.formaPagoLocalLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.porcentajeAnticipoLocalLabel &&
            documentContract.condiciones.porcentajeSaldoLocalLabel
              ? [
                  {
                    label: "Distribución local",
                    value: `${documentContract.condiciones.porcentajeAnticipoLocalLabel} anticipo / ${documentContract.condiciones.porcentajeSaldoLocalLabel} saldo`,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "LOCAL" &&
            documentContract.condiciones.diasCreditoLocalLabel
              ? [
                  {
                    label: "Crédito local",
                    value: documentContract.condiciones.diasCreditoLocalLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.estructuraPagoImportacionLabel
              ? [
                  {
                    label: "Estructura de pago",
                    value:
                      documentContract.condiciones
                        .estructuraPagoImportacionLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.instrumentoPagoImportacionLabel
              ? [
                  {
                    label: "Instrumento de pago",
                    value:
                      documentContract.condiciones
                        .instrumentoPagoImportacionLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.gatilloPagoImportacionLabel
              ? [
                  {
                    label: "Gatillo documentario",
                    value:
                      documentContract.condiciones.gatilloPagoImportacionLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.porcentajeAnticipoImportacionLabel &&
            documentContract.condiciones.porcentajeSaldoImportacionLabel
              ? [
                  {
                    label: "Distribución importación",
                    value: `${documentContract.condiciones.porcentajeAnticipoImportacionLabel} anticipo / ${documentContract.condiciones.porcentajeSaldoImportacionLabel} saldo`,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.diasCreditoImportacionLabel
              ? [
                  {
                    label: "Crédito importación",
                    value: documentContract.condiciones
                      .referenciaPlazoImportacionLabel
                      ? `${documentContract.condiciones.diasCreditoImportacionLabel} desde ${documentContract.condiciones.referenciaPlazoImportacionLabel}`
                      : documentContract.condiciones
                          .diasCreditoImportacionLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.gastosBancariosPorLabel
              ? [
                  {
                    label: "Gastos bancarios",
                    value: documentContract.condiciones.gastosBancariosPorLabel,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.incoterm
              ? [
                  {
                    label: "Incoterm",
                    value: `${documentContract.condiciones.incoterm}${documentContract.condiciones.incotermVersion ? ` (${documentContract.condiciones.incotermVersion})` : ""}${documentContract.condiciones.incotermTransportModeLabel ? ` - ${documentContract.condiciones.incotermTransportModeLabel}` : ""}`,
                  },
                ]
              : []),
            ...(documentContract.condiciones.tipoCompra === "IMPORTACION" &&
            documentContract.condiciones.incotermPuntoLogistico
              ? [
                  {
                    label: "Punto logístico",
                    value: documentContract.condiciones.incotermPuntoLogistico,
                  },
                ]
              : []),
          ]
        : []),
    ],
    [documentContract],
  );

  const missingDocumentFields = useMemo(
    () =>
      (documentContract?.camposPendientes || []).map(
        (field) => solicitudCotizacionDocumentFieldLabels[field] || field,
      ),
    [documentContract],
  );

  const medioRecepcion = String(solicitud?.medioRecepcion || "")
    .trim()
    .toUpperCase();
  const isMedioCorreo = medioRecepcion === "CORREO";
  const isMedioSistema = medioRecepcion === "SISTEMA";
  const isMedioFisico = medioRecepcion === "FISICO";
  const emailHistory = historyData?.historial || [];
  const latestEmailEvent = isMedioCorreo ? emailHistory[0] || null : null;
  const activeCotizacion = Array.isArray(solicitud?.cotizaciones)
    ? solicitud.cotizaciones.find((cotizacion) => cotizacion.activo !== false)
    : null;
  const canRegisterCotizacion =
    (isMedioCorreo || isMedioFisico) &&
    solicitud?.activo !== false &&
    Boolean(solicitud?.requerimientoId || solicitud?.requerimiento?.id) &&
    Boolean(solicitud?.requerimiento?.modalidadFlujoLogistico) &&
    !["ADJUDICADO", "OC_GENERADA"].includes(
      solicitud?.requerimiento?.estadoLogistica,
    ) &&
    canOperateCotizacionesLogisticaEffective(user, solicitud?.requerimiento) &&
    !activeCotizacion;
  const cotizacionesPhasePath = `/cotizaciones/proceso/${
    solicitud?.requerimientoId || solicitud?.requerimiento?.id || ""
  }/cotizaciones`;
  const whatsappNormalizedNumber = useMemo(
    () => buildWhatsappNormalizedNumber(systemAccessPhone),
    [systemAccessPhone],
  );
  const preparedWhatsappMessage = systemAccessData?.mensajeWhatsapp || "";
  const whatsappUrl =
    whatsappNormalizedNumber && preparedWhatsappMessage
      ? `https://wa.me/${whatsappNormalizedNumber}?text=${encodeURIComponent(
          preparedWhatsappMessage,
        )}`
      : "";
  const accessTraceAccess = accessTraceData?.acceso || null;
  const accessTraceSummary = accessTraceData?.resumen || {};
  const accessTraceEvents = accessTraceData?.eventos || [];
  const accessTraceCounts = [
    {
      label: "Mensajes preparados",
      value: accessTraceSummary.totalMensajesPreparados ?? 0,
    },
    {
      label: "Mensajes copiados",
      value: accessTraceSummary.totalMensajesCopiados ?? 0,
    },
    {
      label: "WhatsApp abierto",
      value: accessTraceSummary.totalWhatsappAbierto ?? 0,
    },
    {
      label: "Regeneraciones",
      value: accessTraceSummary.totalRegeneraciones ?? 0,
    },
    {
      label: "Claves fallidas",
      value: accessTraceSummary.totalIntentosFallidos ?? 0,
    },
    {
      label: "Validaciones correctas",
      value: accessTraceSummary.totalValidacionesCorrectas ?? 0,
    },
  ];

  const backTarget = location.state?.from
    ? `${location.state.from.pathname || ""}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : "/cotizaciones";

  const loadEmailHistory = useCallback(
    async ({ silent = false } = {}) => {
      if (!solicitud?.id) return null;

      if (!silent) {
        setHistoryLoading(true);
      }
      setHistoryError("");

      try {
        const data = await obtenerHistorialEnvios(solicitud.id);
        setHistoryData(data);
        return data;
      } catch (err) {
        const message =
          err?.message || "No se pudo cargar la trazabilidad de correo.";
        setHistoryError(message);
        if (!silent) {
          console.error("Error cargando trazabilidad de correo:", err);
        }
        return null;
      } finally {
        if (!silent) {
          setHistoryLoading(false);
        }
      }
    },
    [obtenerHistorialEnvios, solicitud?.id],
  );

  useEffect(() => {
    loadEmailHistory({ silent: true });
  }, [loadEmailHistory]);

  const handleOpenOfficialPdf = () => {
    if (!id) return;
    window.open(obtenerSolicitudPdfUrl(id), "_blank", "noopener,noreferrer");
  };

  const handleOpenHistoryModal = async () => {
    if (!solicitud?.id) return;
    setHistoryModalOpen(true);
    await loadEmailHistory();
  };

  const handlePrintHistory = async () => {
    const data = historyData || (await loadEmailHistory());
    if (!data) return;

    const html = buildSolicitudCotizacionEnvioTracePrintHtml({
      documentData,
      solicitud: data.solicitud || solicitud,
      historial: data.historial || [],
      printedBy: user,
    });

    await printHtmlInNewWindow(html);
  };

  const loadAccessTrace = useCallback(async () => {
    if (!solicitud?.id) return null;

    setAccessTraceLoading(true);
    setAccessTraceError("");

    try {
      const data = await obtenerTrazabilidadAccesoSistema(solicitud.id);
      setAccessTraceData(data);
      return data;
    } catch (err) {
      const message =
        err?.message || "No se pudo cargar la trazabilidad del acceso.";
      setAccessTraceError(message);
      return null;
    } finally {
      setAccessTraceLoading(false);
    }
  }, [obtenerTrazabilidadAccesoSistema, solicitud?.id]);

  const handleOpenAccessTraceModal = async () => {
    if (!solicitud?.id) return;
    setAccessTraceModalOpen(true);
    await loadAccessTrace();
  };

  const handlePrintAccessTrace = async () => {
    const data = accessTraceData || (await loadAccessTrace());
    if (!data) return;

    await printHtmlInNewWindow(
      buildAccessTracePrintHtml({
        traceData: data,
        solicitud,
        printedBy: user,
      }),
    );
  };

  const handleOpenEmailModal = () => {
    if (!solicitud?.id) return;
    setEmailRecipient(buildDefaultEmailRecipient(solicitud));
    setEmailError("");
    setEmailModalOpen(true);
  };

  const handleCloseEmailModal = () => {
    if (sendingEmail) return;
    setEmailModalOpen(false);
    setEmailError("");
  };

  const validateEmailRecipient = () => {
    const destination = emailRecipient.trim();

    if (!destination) {
      return "Ingresa un correo destino.";
    }

    if (!EMAIL_PATTERN.test(destination)) {
      return "Ingresa un correo electrónico válido.";
    }

    return "";
  };

  const handleSendEmail = async (event) => {
    event.preventDefault();
    if (!solicitud?.id || sendingEmail) return;

    const validationMessage = validateEmailRecipient();
    if (validationMessage) {
      setEmailError(validationMessage);
      return;
    }

    setSendingEmail(true);
    try {
      await enviarSolicitudCorreo(solicitud.id, {
        to: emailRecipient.trim(),
      });
      setEmailModalOpen(false);
      setEmailError("");
      await reload();
      await loadEmailHistory({ silent: true });
    } catch {
      // El hook de solicitudes ya muestra el toast de error correspondiente.
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenSystemAccessModal = () => {
    if (!solicitud?.id) return;
    setSystemAccessPhone(buildInitialSystemAccessPhone(solicitud));
    setSystemAccessData(null);
    setSystemAccessError("");
    setSystemAccessModalOpen(true);
  };

  const handleSystemAccessCountryChange = (codigoPaisTelefono) => {
    const selectedCountry =
      PHONE_COUNTRY_OPTIONS.find(
        (option) => option.codigo === codigoPaisTelefono,
      ) || DEFAULT_PHONE_COUNTRY;

    setSystemAccessPhone((prev) => ({
      ...prev,
      paisTelefono: selectedCountry.pais,
      codigoPaisTelefono: selectedCountry.codigo,
    }));
  };

  const handleGenerateSystemAccess = async ({ regenerar = false } = {}) => {
    if (!solicitud?.id || systemAccessLoading) return;

    setSystemAccessLoading(true);
    setSystemAccessError("");

    try {
      const response = await generarAccesoSistemaSolicitud(solicitud.id, {
        regenerar,
        telefonoOriginal: solicitud.proveedor?.telefono || "",
        paisTelefono: systemAccessPhone.paisTelefono,
        codigoPaisTelefono: systemAccessPhone.codigoPaisTelefono,
        numeroLocalTelefono: systemAccessPhone.numeroLocalTelefono,
      });
      setSystemAccessData(response);
    } catch (err) {
      setSystemAccessError(
        err?.message || "No se pudo generar el acceso por sistema.",
      );
    } finally {
      setSystemAccessLoading(false);
    }
  };

  const handleRegisterSystemAccessEvent = async (tipoEvento) => {
    const accessId = systemAccessData?.access?.id;

    if (!solicitud?.id || !accessId) return;

    try {
      await registrarEventoAccesoSistema(solicitud.id, accessId, {
        tipoEvento,
        detalle: {
          numeroWhatsappNormalizado: whatsappNormalizedNumber || null,
        },
      });
    } catch {
      // El evento no debe bloquear la accion manual del usuario.
    }
  };

  const handleCopySystemAccessMessage = async () => {
    if (!preparedWhatsappMessage) return;

    try {
      await navigator.clipboard.writeText(preparedWhatsappMessage);
      toast.success("Mensaje copiado.");
      await handleRegisterSystemAccessEvent("WHATSAPP_MENSAJE_COPIADO");
    } catch {
      toast.error("No se pudo copiar el mensaje.");
    }
  };

  const handleOpenWhatsapp = async () => {
    if (!whatsappUrl) return;
    await handleRegisterSystemAccessEvent("WHATSAPP_ABIERTO");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) return <SolicitudCotizacionDetalleSkeleton />;

  if (!solicitud) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error || "No se pudo cargar la solicitud de cotización."}
        </div>
      </div>
    );
  }

  if (!documentContract) {
    return <SolicitudCotizacionDetalleSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Detalle de solicitud de cotización
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Vista operativa para revisar datos documentarios, condiciones e
            ítems solicitados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={backTarget}
            className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaArrowLeft className="text-xs" />
            Volver
          </Link>
          <button
            type="button"
            onClick={handleOpenOfficialPdf}
            className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FaFilePdf className="text-xs" />
            Abrir PDF
          </button>
          {isMedioCorreo && !isMedioFisico ? (
            <button
              type="button"
              onClick={handleOpenHistoryModal}
              className="inline-flex items-center gap-2 rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              <FaHistory className="text-xs" />
              Historial correos
            </button>
          ) : null}
          {isMedioSistema && !isMedioFisico ? (
            <>
              <button
                type="button"
                onClick={handleOpenSystemAccessModal}
                className="inline-flex items-center gap-2 rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <FaKey className="text-xs" />
                Acceso sistema
              </button>
              <button
                type="button"
                onClick={handleOpenAccessTraceModal}
                className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FaHistory className="text-xs" />
                Historial sistema
              </button>
            </>
          ) : null}
          {canRegisterCotizacion ? (
            <Link
              to={cotizacionesPhasePath}
              state={{ solicitudId: solicitud.id, from: location }}
              className="inline-flex items-center gap-2 rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              Registrar cotizacion recibida
            </Link>
          ) : null}
          {isMedioCorreo ? (
            <button
              type="button"
              onClick={handleOpenEmailModal}
              disabled={sendingEmail}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaEnvelope className="text-xs" />
              {sendingEmail ? "Enviando…" : "Enviar por correo"}
            </button>
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={emailModalOpen}
        onClose={handleCloseEmailModal}
        title="Enviar solicitud por correo"
        maxWidth="max-w-lg"
        closeOnBackdrop={!sendingEmail}
        showCloseButton={!sendingEmail}
      >
        <form onSubmit={handleSendEmail} className="space-y-5" noValidate>
          <p className="text-sm leading-6 text-gray-600">
            Se enviará la solicitud {documentContract.codigo} al correo que
            indiques. Puedes editar el destino antes de confirmar el envío.
          </p>

          <div>
            <label
              htmlFor="solicitud-email-recipient"
              className="block text-sm font-semibold text-gray-800"
            >
              Correo destino
            </label>
            <input
              id="solicitud-email-recipient"
              type="email"
              value={emailRecipient}
              onChange={(event) => {
                setEmailRecipient(event.target.value);
                if (emailError) setEmailError("");
              }}
              disabled={sendingEmail}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError
                  ? "solicitud-email-recipient-error"
                  : "solicitud-email-recipient-help"
              }
              className={`mt-2 w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 ${
                emailError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-100"
              } disabled:cursor-not-allowed disabled:bg-gray-100`}
              placeholder="proveedor@empresa.com"
              autoComplete="email"
            />
            {emailError ? (
              <p
                id="solicitud-email-recipient-error"
                className="mt-2 text-sm text-red-600"
              >
                {emailError}
              </p>
            ) : (
              <p
                id="solicitud-email-recipient-help"
                className="mt-2 text-xs text-gray-500"
              >
                Se precarga el correo electrónico registrado del proveedor
                cuando está disponible.
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleCloseEmailModal}
              disabled={sendingEmail}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sendingEmail}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaEnvelope className="text-xs" />
              {sendingEmail ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Historial correos"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm leading-6 text-gray-600">
              Trazabilidad de correos enviados para la solicitud{" "}
              <span className="font-semibold text-gray-900">
                {documentContract.codigo}
              </span>
              .
            </p>
            <button
              type="button"
              onClick={handlePrintHistory}
              className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FaPrint className="text-xs" />
              Imprimir trazabilidad
            </button>
          </div>

          {historyError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {historyError}
            </div>
          ) : null}

          {historyLoading ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
              Cargando historial de envios…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Fecha y hora
                    </th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Destinatario
                    </th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Asunto
                    </th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Enviado por
                    </th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Tipo
                    </th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Resultado
                    </th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      PDF adjunto
                    </th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      ID proveedor / error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {emailHistory.length > 0 ? (
                    emailHistory.map((event) => (
                      <tr key={event.id}>
                        <td className="p-3 text-sm text-gray-700">
                          {formatDateTime(event.fechaHoraEnvio)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {readValue(event.correoDestino)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {readValue(event.asunto)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {readValue(event.enviadoPor?.nombre)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {readValue(event.tipoEnvio)}
                        </td>
                        <td className="p-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              event.resultadoEnvio === "EXITOSO"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {readValue(event.resultadoEnvio)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {readValue(event.nombreArchivoAdjunto)}
                        </td>
                        <td className="max-w-xs p-3 text-sm text-gray-700">
                          <span className="break-words">
                            {readValue(
                              event.providerMessageId || event.detalleError,
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        Aun no hay envios registrados para esta solicitud.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={systemAccessModalOpen}
        onClose={() => setSystemAccessModalOpen(false)}
        title="Acceso por sistema"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Con WhatsApp manual el sistema no puede confirmar la entrega del
            mensaje; solo registra que se preparÃ³, copiÃ³ o abriÃ³ WhatsApp.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SummaryField
              label="Proveedor"
              value={solicitud.proveedor?.razonSocial || "-"}
            />
            <SummaryField
              label="Telefono registrado"
              value={solicitud.proveedor?.telefono || "-"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[220px,1fr,1fr]">
            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Pais / codigo</span>
              <select
                value={systemAccessPhone.codigoPaisTelefono}
                onChange={(event) =>
                  handleSystemAccessCountryChange(event.target.value)
                }
                disabled={Boolean(systemAccessData?.accessUrl)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {PHONE_COUNTRY_OPTIONS.map((option) => (
                  <option key={`${option.codigo}-${option.pais}`} value={option.codigo}>
                    {option.codigo} {option.pais}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Numero local</span>
              <input
                type="text"
                value={systemAccessPhone.numeroLocalTelefono}
                onChange={(event) =>
                  setSystemAccessPhone((prev) => ({
                    ...prev,
                    numeroLocalTelefono: event.target.value,
                  }))
                }
                disabled={Boolean(systemAccessData?.accessUrl)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="987654321"
              />
            </label>

            <SummaryField
              label="Numero WhatsApp"
              value={
                whatsappNormalizedNumber
                  ? `+${whatsappNormalizedNumber}`
                  : "Pendiente de validar"
              }
            />
          </div>

          {systemAccessError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {systemAccessError}
            </div>
          ) : null}

          {!systemAccessData?.accessUrl ? (
            <div className="flex flex-wrap justify-end gap-3">
              {systemAccessData?.status === "EXISTENTE" ? (
                <button
                  type="button"
                  onClick={() => handleGenerateSystemAccess({ regenerar: true })}
                  disabled={systemAccessLoading}
                  className="inline-flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaKey className="text-xs" />
                  {systemAccessLoading ? "Regenerando…" : "Regenerar acceso"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGenerateSystemAccess()}
                  disabled={systemAccessLoading}
                  className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaKey className="text-xs" />
                  {systemAccessLoading ? "Generando…" : "Generar acceso"}
                </button>
              )}
            </div>
          ) : null}

          {systemAccessData?.accessUrl ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <SummaryField label="Enlace externo" value={systemAccessData.accessUrl} />
                <SummaryField
                  label="Clave temporal"
                  value={systemAccessData.claveTemporal || "-"}
                />
              </div>

              <label className="block space-y-1 text-sm text-gray-700">
                <span className="font-medium">Mensaje preparado</span>
                <textarea
                  value={preparedWhatsappMessage}
                  readOnly
                  rows={7}
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCopySystemAccessMessage}
                  disabled={!preparedWhatsappMessage}
                  className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaCopy className="text-xs" />
                  Copiar mensaje
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsapp}
                  disabled={!whatsappUrl}
                  className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaWhatsapp className="text-xs" />
                  Abrir WhatsApp
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={accessTraceModalOpen}
        onClose={() => setAccessTraceModalOpen(false)}
        title="Trazabilidad de acceso por sistema"
        maxWidth="max-w-6xl"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Con WhatsApp manual, el sistema registra la copia o apertura del
            enlace, pero no puede confirmar que el mensaje haya sido enviado
            dentro de WhatsApp.
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={loadAccessTrace}
              disabled={accessTraceLoading}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accessTraceLoading ? "Actualizando…" : "Actualizar"}
            </button>
            <button
              type="button"
              onClick={handlePrintAccessTrace}
              disabled={accessTraceLoading || !accessTraceData}
              className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaPrint className="text-xs" />
              Imprimir trazabilidad
            </button>
          </div>

          {accessTraceError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {accessTraceError}
            </div>
          ) : null}

          {accessTraceLoading && !accessTraceData ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
              Cargando trazabilidad de acceso…
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryField
                  label="Estado actual"
                  value={accessTraceAccess?.estado || "Sin acceso"}
                />
                <SummaryField
                  label="Generado el"
                  value={formatDateTime(accessTraceAccess?.createdAt)}
                />
                <SummaryField
                  label="Vence el"
                  value={formatDateTime(accessTraceAccess?.expiresAt)}
                />
                <SummaryField
                  label="Finalizado el"
                  value={formatDateTime(
                    accessTraceAccess?.respuestaFinalizadaAt,
                  )}
                />
                <SummaryField
                  label="Intentos fallidos"
                  value={`${accessTraceAccess?.intentosFallidos ?? 0} de ${
                    accessTraceAccess?.maxIntentos ?? "-"
                  }`}
                />
                <SummaryField
                  label="Telefono usado"
                  value={
                    accessTraceAccess?.numeroWhatsappNormalizadoSnapshot
                      ? `+${accessTraceAccess.numeroWhatsappNormalizadoSnapshot}`
                      : "-"
                  }
                />
                <SummaryField
                  label="Ultimo intento de compartir"
                  value={formatDateTime(accessTraceSummary.ultimoCompartidoAt)}
                />
                <SummaryField
                  label="Ultimo actor interno"
                  value={readValue(accessTraceSummary.ultimoCompartidoPor?.nombre)}
                />
                <SummaryField
                  label="Requiere regeneracion"
                  value={accessTraceSummary.requiereRegeneracion ? "Si" : "No"}
                />
                <SummaryField
                  label="Generado por"
                  value={readValue(accessTraceAccess?.generadoPor?.nombre)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {accessTraceCounts.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Fecha y hora
                      </th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Evento
                      </th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Actor
                      </th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Telefono
                      </th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Detalle seguro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {accessTraceEvents.length ? (
                      accessTraceEvents.map((event) => (
                        <tr key={event.id}>
                          <td className="p-3 text-sm text-gray-700">
                            {formatDateTime(event.fechaEvento)}
                          </td>
                          <td className="p-3 text-sm font-medium text-gray-800">
                            {formatAccessEventLabel(event.tipoEvento)}
                          </td>
                          <td className="p-3 text-sm text-gray-700">
                            {formatActorLabel(event)}
                          </td>
                          <td className="p-3 text-sm text-gray-700">
                            {readValue(getEventPhone(event, accessTraceAccess))}
                          </td>
                          <td className="max-w-sm p-3 text-sm text-gray-700">
                            <span className="break-words">
                              {formatTraceDetail(event.detalleSeguro)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-10 text-center text-sm text-gray-500"
                        >
                          Aun no hay eventos registrados para el acceso por
                          sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>

      {configuracionEmpresaError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          La configuración institucional no pudo cargarse. La vista documentaria
          seguirá disponible, pero el membrete puede salir incompleto.
        </div>
      ) : null}

      {solicitud.activo === false ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Esta solicitud se encuentra desactivada y se conserva solo para
          trazabilidad.
        </div>
      ) : null}

      {missingDocumentFields.length > 0 ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          Esta solicitud aún tiene campos documentarios pendientes:{" "}
          <span className="font-semibold">
            {missingDocumentFields.join(", ")}
          </span>
          .
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
              RESUMEN PRINCIPAL
            </p>
          </div>
          <CotizacionEstadoBadge
            estado={documentContract.estado}
            tipo="solicitud"
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryItems.map((item) => (
            <SummaryField
              key={item.label}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
      </div>

      {latestEmailEvent ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Ultimo envio por correo
              </p>
              <div className="mt-3 grid gap-3 text-sm text-indigo-950 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <span className="block text-xs font-semibold uppercase text-indigo-600">
                    Fecha
                  </span>
                  {formatDateTime(latestEmailEvent.fechaHoraEnvio)}
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-indigo-600">
                    Destinatario
                  </span>
                  {readValue(latestEmailEvent.correoDestino)}
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-indigo-600">
                    Enviado por
                  </span>
                  {readValue(latestEmailEvent.enviadoPor?.nombre)}
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-indigo-600">
                    Resultado
                  </span>
                  {readValue(latestEmailEvent.resultadoEnvio)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenHistoryModal}
              className="inline-flex items-center gap-2 rounded border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              <FaHistory className="text-xs" />
              Ver historial
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Condiciones de cotización
        </p>
        <div className="mt-4">
          <InlineFieldList items={conditionItems} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Texto base de la solicitud
        </p>
        <p className="mt-4 text-sm leading-7 text-gray-700">
          {readValue(documentContract.cuerpoSolicitud)}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Ítems solicitados
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Ítem
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Unidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Cant.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {documentContract.items.length > 0 ? (
                documentContract.items.map((item) => (
                  <tr key={`${documentContract.codigo}-item-${item.orden}`}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.orden}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {String(item.descripcion || "")
                        .split("\n")
                        .map((line, index) => (
                          <span
                            key={`${item.orden}-${index}-${line}`}
                            className={
                              index === 0
                                ? "block font-medium"
                                : "block text-xs text-gray-500"
                            }
                          >
                            {line}
                          </span>
                        ))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {readValue(item.unidad)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {Number(item.cantidad || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    La solicitud no tiene ítems disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Cotizaciones relacionadas
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(solicitud.cotizaciones || []).length > 0 ? (
                solicitud.cotizaciones.map((cotizacion) => (
                  <tr key={cotizacion.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {cotizacion.codigo || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {cotizacion?.proveedor?.razonSocial || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(cotizacion.fechaEmision)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <CotizacionEstadoBadge estado={cotizacion.estado} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Aún no hay cotizaciones vinculadas a esta solicitud.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SolicitudCotizacionDetallePage;
