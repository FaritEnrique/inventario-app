import { useEffect, useMemo, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import configuracionEmpresaApi from "../api/configuracionEmpresaApi";
import Loader from "../components/Loader";
import {
  buildBlankLetterheadPrintHtml,
  buildLetterheadDocumentData,
  resolveInstitutionalAssetUrl,
} from "../utils/configuracionEmpresaLetterhead";
import { printHtmlInNewWindow } from "../utils/printWindow";
import { institutionalLetterheadMetrics } from "@document-branding/documentBrandingMetrics.js";

const emptyForm = {
  razonSocial: "",
  ruc: "",
  fraseEncabezado: "",
  direccion: "",
  ciudad: "",
  telefono: "",
  correo: "",
  pieInstitucional: "",
  logoUrl: "",
  logoFile: null,
};

const buildConfigurationPayload = (formData) => {
  const payload = new FormData();
  payload.append("razonSocial", formData.razonSocial);
  payload.append("ruc", formData.ruc || "");
  payload.append("fraseEncabezado", formData.fraseEncabezado || "");
  payload.append("direccion", formData.direccion || "");
  payload.append("ciudad", formData.ciudad || "");
  payload.append("telefono", formData.telefono || "");
  payload.append("correo", formData.correo || "");
  payload.append("pieInstitucional", formData.pieInstitucional || "");
  payload.append("logoUrl", formData.logoUrl || "");
  payload.append("removeLogo", "false");

  if (formData.logoFile) {
    payload.append("logo", formData.logoFile);
  }

  return payload;
};

const normalizePersistedConfiguration = (data) => ({
  ...emptyForm,
  ...data,
  logoFile: null,
});

const FooterPreviewItem = ({
  value,
  icon,
  extraIcon = null,
  className = "",
}) => {
  if (!value) return null;

  return (
    <div
      className={`flex min-w-0 items-start gap-2.5 px-1 py-1 text-slate-700 ${className}`.trim()}
    >
      <div className="flex flex-none items-center gap-1 pt-0.5 text-slate-700">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[13px]">
          {icon}
        </span>
        {extraIcon ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px]">
            {extraIcon}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <span className="block break-words text-[12px] font-medium leading-[1.45] text-slate-800">
          {value}
        </span>
      </div>
    </div>
  );
};

const requiredFieldLabels = {
  logo: "logo institucional",
  razonSocial: "razon social",
  ruc: "RUC",
  direccion: "direccion",
  correo: "correo institucional",
  telefono: "telefono",
};

const getMissingRequiredLetterheadFields = (formData) => {
  const missing = [];

  if (!formData.logoUrl && !formData.logoFile) {
    missing.push(requiredFieldLabels.logo);
  }

  ["razonSocial", "ruc", "direccion", "correo", "telefono"].forEach((field) => {
    if (!String(formData[field] || "").trim()) {
      missing.push(requiredFieldLabels[field]);
    }
  });

  return missing;
};

const buildLetterheadPreviewStyles = () => {
  const previewMetrics = institutionalLetterheadMetrics.preview;
  const printMetrics = institutionalLetterheadMetrics.print;

  return `
    .letterhead-preview-sheet {
      padding: ${previewMetrics.canvasPadding.base};
    }
    .letterhead-preview-header {
      display: grid;
      align-items: start;
      gap: ${previewMetrics.headerGap.base};
      padding-bottom: ${previewMetrics.headerPaddingBottom};
      border-bottom: 2px solid #0f172a;
    }
    .letterhead-preview-header--with-phrase {
      grid-template-columns: ${printMetrics.headerColumns};
    }
    .letterhead-preview-brand-row {
      display: grid;
      width: 100%;
      min-width: 0;
      grid-template-columns: ${previewMetrics.logoWidth.base} minmax(0, 1fr);
      align-items: center;
      gap: ${previewMetrics.brandRowGap};
    }
    .letterhead-preview-logo,
    .letterhead-preview-logo-fallback {
      width: ${previewMetrics.logoWidth.base};
      height: ${previewMetrics.logoHeight.base};
      border-radius: ${previewMetrics.logoRadius};
    }
    .letterhead-preview-logo {
      padding: ${previewMetrics.logoPadding};
      object-fit: contain;
      object-position: left center;
    }
    .letterhead-preview-logo-fallback {
      padding: 0 12px;
    }
    .letterhead-preview-brand-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      align-items: flex-start;
      gap: ${previewMetrics.brandCopyGap};
    }
    .letterhead-preview-company {
      max-width: ${previewMetrics.brandCompanyMaxWidth};
      font-size: ${previewMetrics.brandCompanyFontSize.base};
      line-height: 1.2;
    }
    .letterhead-preview-tax-id {
      padding: ${previewMetrics.brandTaxIdPadding};
      font-size: ${previewMetrics.brandTaxIdFontSize};
    }
    .letterhead-preview-phrase-shell {
      min-height: ${previewMetrics.phraseMinHeight.base};
    }
    .letterhead-preview-phrase {
      min-height: ${previewMetrics.phraseMinHeight.base};
      padding: ${previewMetrics.phrasePadding.base};
      font-size: ${previewMetrics.phraseFontSize.base};
    }
    .letterhead-preview-body {
      margin-top: ${previewMetrics.bodyMarginTop};
      padding: ${previewMetrics.bodyPadding};
    }
    .letterhead-preview-body-inner {
      padding: ${previewMetrics.bodyInnerPadding};
    }
    .letterhead-preview-footer {
      margin-top: ${previewMetrics.footerMarginTop};
      padding-top: ${previewMetrics.footerPaddingTop};
    }
    .letterhead-preview-footer-contacts {
      display: grid;
      align-items: start;
      gap: ${previewMetrics.footerGridGap};
      border-top: 1px solid #f1f5f9;
      padding-top: ${previewMetrics.footerContactsPaddingTop};
    }
    .letterhead-preview-comment {
      margin-top: ${previewMetrics.footerCommentMarginTop};
      padding: ${previewMetrics.footerCommentPadding};
    }
    @media (min-width: 768px) {
      .letterhead-preview-sheet {
        padding: ${previewMetrics.canvasPadding.md};
      }
      .letterhead-preview-brand-row {
        grid-template-columns: ${previewMetrics.logoWidth.md} minmax(0, 1fr);
      }
      .letterhead-preview-logo,
      .letterhead-preview-logo-fallback {
        width: ${previewMetrics.logoWidth.md};
        height: ${previewMetrics.logoHeight.md};
      }
      .letterhead-preview-company {
        font-size: ${previewMetrics.brandCompanyFontSize.md};
      }
      .letterhead-preview-phrase-shell,
      .letterhead-preview-phrase {
        min-height: ${previewMetrics.phraseMinHeight.md};
      }
      .letterhead-preview-phrase {
        padding: ${previewMetrics.phrasePadding.md};
        font-size: ${previewMetrics.phraseFontSize.md};
      }
      .letterhead-preview-footer-contacts {
        grid-template-columns: ${printMetrics.footerColumns};
      }
    }
    @media (min-width: 1024px) {
      .letterhead-preview-sheet {
        padding: ${previewMetrics.canvasPadding.lg};
      }
      .letterhead-preview-header {
        gap: ${previewMetrics.headerGap.lg};
      }
    }
  `;
};

const letterheadPreviewStyles = buildLetterheadPreviewStyles();

const ConfiguracionEmpresaPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const objectUrlRef = useRef(null);

  const loadPersistedConfiguration = async () => {
    const data = await configuracionEmpresaApi.obtener();
    setFormData(normalizePersistedConfiguration(data));
    return data;
  };

  const logoPreviewUrl = useMemo(() => {
    if (formData.logoFile && objectUrlRef.current) {
      return objectUrlRef.current;
    }

    return resolveInstitutionalAssetUrl(formData.logoUrl);
  }, [formData.logoFile, formData.logoUrl]);

  const letterheadDocumentData = useMemo(
    () => buildLetterheadDocumentData(formData, logoPreviewUrl),
    [formData, logoPreviewUrl],
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await loadPersistedConfiguration();
      } catch (error) {
        toast.error(
          error.message || "No se pudo cargar la configuracion de empresa.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!file) {
      setFormData((current) => ({
        ...current,
        logoFile: null,
      }));
      return;
    }

    objectUrlRef.current = URL.createObjectURL(file);
    setFormData((current) => ({
      ...current,
      logoFile: file,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const missingFields = getMissingRequiredLetterheadFields(formData);
    if (missingFields.length) {
      toast.error(
        `Completa los campos obligatorios: ${missingFields.join(", ")}.`,
      );
      return;
    }

    setSaving(true);
    try {
      const response = await configuracionEmpresaApi.guardar(
        buildConfigurationPayload(formData),
      );

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      try {
        await loadPersistedConfiguration();
      } catch {
        if (response?.configuracion) {
          setFormData(normalizePersistedConfiguration(response.configuracion));
        } else {
          throw new Error(
            "La configuracion se guardo, pero no se pudo recargar desde el servidor.",
          );
        }
      }

      toast.success("Configuracion institucional actualizada.");
    } catch (error) {
      toast.error(
        error.message || "No se pudo guardar la configuracion de empresa.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!formData.logoFile) {
      toast.info("Selecciona primero un logo para guardarlo.");
      return;
    }

    const payload = new FormData();
    payload.append("logo", formData.logoFile);

    setSavingLogo(true);
    try {
      const response = await configuracionEmpresaApi.guardarLogo(payload);
      setFormData((current) => ({
        ...current,
        logoUrl: response.configuracion.logoUrl || "",
        logoFile: null,
      }));

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      toast.success("Logo institucional actualizado.");
    } catch (error) {
      toast.error(error.message || "No se pudo guardar el logo institucional.");
    } finally {
      setSavingLogo(false);
    }
  };

  const handleOpenPdfPreviewWithPendingLogo = async () => {
    const missingFields = getMissingRequiredLetterheadFields(formData);
    if (missingFields.length) {
      toast.error(
        `Para abrir el membrete PDF completa: ${missingFields.join(", ")}.`,
      );
      return;
    }

    try {
      if (formData.logoFile) {
        setSavingLogo(true);
        await persistPendingLogoIfNeeded();
      }

      window.open(
        configuracionEmpresaApi.obtenerMembretePdfUrl(),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      toast.error(
        error.message || "No se pudo preparar el logo para el membrete PDF.",
      );
    } finally {
      setSavingLogo(false);
    }
  };

  const handlePrintBlankLetterhead = async () => {
    const missingFields = getMissingRequiredLetterheadFields(formData);
    if (missingFields.length) {
      toast.error(
        `Para imprimir el membrete completa: ${missingFields.join(", ")}.`,
      );
      return;
    }

    try {
      await printHtmlInNewWindow(
        buildBlankLetterheadPrintHtml(letterheadDocumentData),
      );
    } catch (error) {
      toast.error(
        error.message || "No se pudo abrir la ventana de impresion del membrete.",
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Identidad institucional
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Configuracion de empresa emisora
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Aqui definimos el membrete institucional que alimenta los
                documentos comerciales. El logo ahora se gestiona por separado y
                la previsualizacion muestra una hoja A4 para revisar el
                resultado antes de emitir PDFs. Cuando ya exista una
                configuracion guardada, este mismo formulario se precarga y
                funciona como edicion.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Datos del membrete
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Informacion institucional editable
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Razon social</span>
                <input
                  id="configuracion-empresa-razon-social"
                  name="razonSocial"
                  value={formData.razonSocial}
                  onChange={(event) =>
                    updateField("razonSocial", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Empresa emisora"
                  required
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">RUC / identificador fiscal</span>
                <input
                  id="configuracion-empresa-ruc"
                  name="ruc"
                  value={formData.ruc}
                  onChange={(event) => updateField("ruc", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="20123456789"
                  required
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Telefono</span>
                <input
                  id="configuracion-empresa-telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={(event) =>
                    updateField("telefono", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="+51 999 999 999"
                  required
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Frase del encabezado</span>
                <textarea
                  id="configuracion-empresa-frase-encabezado"
                  name="fraseEncabezado"
                  rows="3"
                  value={formData.fraseEncabezado}
                  onChange={(event) =>
                    updateField("fraseEncabezado", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Los mejores precios en materiales de construccion"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Direccion</span>
                <input
                  id="configuracion-empresa-direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={(event) =>
                    updateField("direccion", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Direccion institucional"
                  required
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Ciudad</span>
                <input
                  id="configuracion-empresa-ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={(event) =>
                    updateField("ciudad", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Iquitos, Lima, etc."
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Correo institucional</span>
                <input
                  id="configuracion-empresa-correo"
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(event) =>
                    updateField("correo", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="logistica@empresa.pe"
                  required
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Comentario del pie</span>
                <textarea
                  id="configuracion-empresa-pie"
                  name="pieInstitucional"
                  rows="4"
                  value={formData.pieInstitucional}
                  onChange={(event) =>
                    updateField("pieInstitucional", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Comentario breve que aparecera debajo de los datos de contacto."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar configuracion"}
              </button>
            </div>
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Logo institucional
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Carga independiente del logo
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Selecciona y guarda el logo por separado. La previsualizacion A4
              usa de inmediato el archivo local para que veamos el membrete
              antes de publicarlo. El logo es obligatorio para guardar y emitir
              el membrete institucional.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-[auto,1fr]">
              <div className="flex items-start justify-center">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt="Logo institucional"
                    className="h-28 w-28 rounded-3xl border border-slate-200 bg-white object-contain p-3 shadow-sm"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Sin logo
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="space-y-1 text-sm text-slate-700">
                  <span className="font-medium">Archivo del logo</span>
                  <input
                    id="configuracion-empresa-logo"
                    name="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>

                <p className="text-xs text-slate-500">
                  Se recomienda un archivo limpio en PNG, JPG o WEBP. El backend
                  lo normaliza para uso documental.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveLogo}
                    disabled={savingLogo || !formData.logoFile}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingLogo ? "Guardando logo..." : "Guardar logo"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Previsualizacion A4
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Asi se veria el papel membretado
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Esta vista muestra una hoja membretada en blanco con la
              composicion real del encabezado y el pie institucional. Tambien
              puedes abrir el PDF del membrete guardado o imprimir una hoja
              membretada de utilidad.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleOpenPdfPreviewWithPendingLogo}
                disabled={savingLogo}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Ver membrete en visor PDF
              </button>
              <button
                type="button"
                onClick={handlePrintBlankLetterhead}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Imprimir hoja membretada en blanco
              </button>
            </div>

            <div className="mt-5 rounded-[2rem] bg-slate-200/70 p-4">
              <div className="mx-auto aspect-[210/297] w-full max-w-[900px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
                <style>{letterheadPreviewStyles}</style>
                <div className="letterhead-preview-sheet flex h-full flex-col">
                  <div
                    className={`letterhead-preview-header ${
                      letterheadDocumentData.hasPhrase
                        ? "letterhead-preview-header--with-phrase"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="letterhead-preview-brand-row">
                        {letterheadDocumentData.logoSrc ? (
                          <img
                            src={letterheadDocumentData.logoSrc}
                            alt="Logo en membrete"
                            className="letterhead-preview-logo border border-slate-200 bg-white"
                          />
                        ) : (
                          <div className="letterhead-preview-logo-fallback flex items-center justify-start border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Logo
                          </div>
                        )}

                        <div className="letterhead-preview-brand-copy">
                          <div className="letterhead-preview-company font-bold text-slate-900">
                            {letterheadDocumentData.razonSocial}
                          </div>

                          <div className="letterhead-preview-tax-id inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 font-semibold text-slate-700">
                            <span className="uppercase tracking-[0.16em] text-slate-500">
                              RUC
                            </span>
                            <span className="text-slate-800 whitespace-nowrap">
                              {letterheadDocumentData.ruc}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {letterheadDocumentData.hasPhrase ? (
                      <div className="letterhead-preview-phrase-shell">
                        <div className="letterhead-preview-phrase flex h-full w-full items-center justify-center text-center font-bold italic leading-6 text-sky-900">
                          {letterheadDocumentData.frase}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="letterhead-preview-body flex-1 bg-gradient-to-b from-slate-50/65 to-white">
                    <div className="letterhead-preview-body-inner h-full rounded-[16px] bg-white/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Hoja membretada en blanco
                      </p>
                      <h4 className="mt-3 text-base font-semibold text-slate-500">
                        Area util libre para impresion
                      </h4>
                      <div className="mt-4 space-y-3">
                        <div className="h-2.5 rounded-full bg-slate-100/90" />
                        <div className="h-2.5 w-10/12 rounded-full bg-slate-100/90" />
                        <div className="h-2.5 w-8/12 rounded-full bg-slate-100/90" />
                      </div>
                    </div>
                  </div>

                  <div className="letterhead-preview-footer border-t border-slate-200">
                    <div className="letterhead-preview-footer-contacts">
                      <FooterPreviewItem
                        value={letterheadDocumentData.contacts.direccion}
                        icon={<FiMapPin />}
                        className="min-w-0"
                      />
                      <FooterPreviewItem
                        value={letterheadDocumentData.contacts.correo}
                        icon={<FiMail />}
                        className="min-w-0"
                      />
                      <FooterPreviewItem
                        value={letterheadDocumentData.contacts.telefono}
                        icon={<FiPhone />}
                        extraIcon={<FaWhatsapp className="text-green-600" />}
                        className="min-w-0"
                      />
                    </div>

                    {letterheadDocumentData.hasComentario ? (
                      <div className="letterhead-preview-comment text-center text-sm leading-6 text-slate-600">
                        {letterheadDocumentData.comentario}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionEmpresaPage;
