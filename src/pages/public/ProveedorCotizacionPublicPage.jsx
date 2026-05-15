import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import publicProveedorCotizacionesApi from "../../api/publicProveedorCotizacionesApi";

const formasPago = [
  { value: "", label: "Seleccionar" },
  { value: "ContraEntrega", label: "Contra entrega" },
  { value: "Adelanto", label: "Adelanto" },
  { value: "Credito", label: "Credito" },
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "-";

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

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
    formaPago: "",
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
          <p className="text-sm text-slate-600">Validando enlace...</p>
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
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Gracias, su cotizacion fue registrada correctamente.
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Codigo interno: {confirmation.cotizacion?.codigo || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Total registrado:{" "}
            {formatCurrency(confirmation.cotizacion?.totalOferta || 0)}
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
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
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
                {submitting ? "Validando..." : "Ingresar"}
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
            <h2 className="mt-2 text-xl font-bold text-slate-950">
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
            <section className="grid gap-4 rounded bg-white p-6 shadow-sm md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Solicitud
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {detail.solicitud?.codigo || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Proveedor
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {detail.proveedor?.nombre || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fecha limite
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {formatDate(detail.solicitud?.fechaLimiteRecepcion)}
                </p>
              </div>
              {detail.solicitud?.cuerpoSolicitud ? (
                <div className="md:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mensaje de solicitud
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                    {detail.solicitud.cuerpoSolicitud}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">Codigo del proveedor</span>
                  <input
                    value={formData.codigoProveedorOpcional}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        codigoProveedorOpcional: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="Opcional"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">Garantia</span>
                  <input
                    value={formData.garantia}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        garantia: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">
                    Tiempo de entrega (dias)
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
                    Vigencia de oferta (dias)
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
                  <span className="font-semibold">Lugar de entrega</span>
                  <input
                    value={formData.lugarEntrega}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        lugarEntrega: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold">Forma de pago</span>
                  <select
                    value={formData.formaPago}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        formaPago: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  >
                    {formasPago.map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm md:col-span-2 lg:col-span-4">
                  <span className="font-semibold">Observaciones</span>
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
                  />
                </label>
              </div>
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
                    {formatCurrency(totalOferta)}
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
                          <span className="font-semibold">Precio unitario</span>
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
                          : `Subtotal: ${formatCurrency(subtotal)}`}
                      </p>
                    </div>
                  );
                })}
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

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Enviar cotizacion"}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
};

export default ProveedorCotizacionPublicPage;
