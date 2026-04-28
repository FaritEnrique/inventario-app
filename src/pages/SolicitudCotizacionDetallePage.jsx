import React, { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaFilePdf } from "react-icons/fa";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import useSolicitudCotizacionDetalleData from "../hooks/useSolicitudCotizacionDetalleData";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";
import {
  buildSolicitudCotizacionDocumentContract,
  buildSolicitudCotizacionTraceContract,
  solicitudCotizacionDocumentFieldLabels,
} from "../utils/solicitudCotizacionDocumentContract";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "-";

const formatMoney = (value, currency = "S/") =>
  value == null
    ? "-"
    : `${currency} ${new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0))}`;

const readValue = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const timelineGapLabels = {
  envioCorreo: "envio por correo",
  cambiosEstado: "cambios de estado",
  auditoriaEdicion: "auditoria de ediciones",
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
  const { solicitud, loading, error, configuracionEmpresaError, reload } =
    useSolicitudCotizacionDetalleData(id);
  const { obtenerSolicitudPdfUrl, enviarSolicitudCorreo } =
    useSolicitudesCotizacion({
      autoLoad: false,
    });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailError, setEmailError] = useState("");

  const documentContract = useMemo(
    () =>
      solicitud ? buildSolicitudCotizacionDocumentContract(solicitud) : null,
    [solicitud],
  );

  const traceContract = useMemo(
    () => (solicitud ? buildSolicitudCotizacionTraceContract(solicitud) : null),
    [solicitud],
  );

  const summaryItems = useMemo(
    () => [
      { label: "Codigo de solicitud", value: documentContract?.codigo || "-" },
      { label: "Estado", value: documentContract?.estado || "-" },
      {
        label: "Fecha de emision",
        value: formatDate(documentContract?.fechaEmision),
      },
      {
        label: "Requerimiento asociado",
        value: documentContract?.requerimientoAsociado || "-",
      },
      {
        label: "Area solicitante",
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
        label: "Elaborador",
        value: documentContract?.elaborador || "-",
      },
      {
        label: "Cargo",
        value: documentContract?.cargo || "-",
      },
      {
        label: "Medio de recepcion",
        value: documentContract?.recepcion?.medioRecepcionLabel || "-",
      },
      {
        label: "Fecha limite de recepcion",
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
      {
        label: "Incluye IGV",
        value: documentContract?.condiciones?.incluyeIgvLabel,
      },
      {
        label: "Validez de oferta",
        value:
          documentContract?.condiciones?.vigenciaOfertaDias != null
            ? `${documentContract.condiciones.vigenciaOfertaDias} dias`
            : null,
      },
      {
        label: "Plazo de entrega",
        value:
          documentContract?.condiciones?.tiempoEntregaDias != null
            ? `${documentContract.condiciones.tiempoEntregaDias} dias`
            : null,
      },
      {
        label: "Lugar de entrega",
        value: documentContract?.condiciones?.lugarEntrega,
      },
      {
        label: "Forma de pago",
        value: documentContract?.condiciones?.formaPagoLabel,
      },
      {
        label: "Garantia",
        value: documentContract?.condiciones?.garantia,
      },
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

  const traceGapLabels = useMemo(
    () =>
      (traceContract?.faltantes || []).map(
        (gap) => timelineGapLabels[gap] || gap,
      ),
    [traceContract],
  );

  const backTarget = location.state?.from
    ? `${location.state.from.pathname || ""}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : "/cotizaciones";

  const handleOpenOfficialPdf = () => {
    if (!id) return;
    window.open(obtenerSolicitudPdfUrl(id), "_blank", "noopener,noreferrer");
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
      return "Ingresa un correo electronico valido.";
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
    } catch {
      // El hook de solicitudes ya muestra el toast de error correspondiente.
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <Loader />;

  if (!solicitud) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error || "No se pudo cargar la solicitud de cotizacion."}
        </div>
      </div>
    );
  }

  if (!documentContract || !traceContract) {
    return <Loader />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Detalle de solicitud de cotizacion
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Vista operativa para revisar datos documentarios, condiciones, items
            solicitados y trazabilidad disponible.
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
          <button
            type="button"
            onClick={handleOpenEmailModal}
            disabled={sendingEmail}
            className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaEnvelope className="text-xs" />
            {sendingEmail ? "Enviando..." : "Enviar por correo"}
          </button>
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
            Se enviara la solicitud {documentContract.codigo} al correo que
            indiques. Puedes editar el destino antes de confirmar el envio.
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
                Se precarga el correo registrado del proveedor cuando esta
                disponible.
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
              {sendingEmail ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </Modal>

      {configuracionEmpresaError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          La configuracion institucional no pudo cargarse. La vista documentaria
          seguira disponible, pero el membrete puede salir incompleto.
        </div>
      ) : null}

      {solicitud.activo === false ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
          Esta solicitud se encuentra inactiva y se conserva solo para
          trazabilidad.
        </div>
      ) : null}

      {missingDocumentFields.length > 0 ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
          Esta solicitud aun tiene campos documentarios pendientes:{" "}
          <span className="font-semibold">
            {missingDocumentFields.join(", ")}
          </span>
          .
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Resumen principal
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              {documentContract.codigo}
            </h2>
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Condiciones de cotizacion
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
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Trazabilidad disponible
          </p>
          {!traceContract.completa && traceGapLabels.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              El backend aun no soporta trazabilidad completa. Faltan:{" "}
              <span className="font-semibold">{traceGapLabels.join(", ")}</span>
              .
            </div>
          ) : null}
          <div className="mt-4 space-y-4">
            {traceContract.eventos.length > 0 ? (
              traceContract.eventos.map((entry, index) => (
                <div
                  key={`${entry.tipo}-${entry.fecha || index}`}
                  className="rounded-lg border border-gray-200 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {entry.titulo}
                    </p>
                    <p className="text-gray-500">
                      {formatDateTime(entry.fecha)}
                    </p>
                  </div>
                  <p className="mt-1 text-gray-700">
                    Actor: {readValue(entry.actor)}
                  </p>
                  <p className="mt-1 text-gray-600">
                    {readValue(entry.descripcion)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                No hay eventos de trazabilidad disponibles para esta solicitud.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Items solicitados
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Descripcion
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Unidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Cant.
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  P. Unit. Ref.
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
                      {item.descripcion}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {readValue(item.unidad)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {Number(item.cantidad || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatMoney(
                        item.valorReferencialUnitario,
                        documentContract.condiciones.monedaSign || "S/",
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    La solicitud no tiene items disponibles.
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
                  Codigo
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
                    Aun no hay cotizaciones vinculadas a esta solicitud.
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
