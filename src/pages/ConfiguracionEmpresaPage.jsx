import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import configuracionEmpresaApi from "../api/configuracionEmpresaApi";
import Loader from "../components/Loader";

const buildUploadsBaseUrl = () => {
  const rawApiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

  return String(rawApiUrl || "").trim().replace(/\/+$/, "").replace(/\/api$/, "");
};

const resolveAssetUrl = (assetUrl) => {
  if (!assetUrl) return "";

  if (
    assetUrl.startsWith("blob:") ||
    assetUrl.startsWith("data:") ||
    assetUrl.startsWith("http://") ||
    assetUrl.startsWith("https://")
  ) {
    return assetUrl;
  }

  const uploadsBaseUrl = buildUploadsBaseUrl();
  if (!uploadsBaseUrl) {
    return assetUrl;
  }

  return `${uploadsBaseUrl}${assetUrl.startsWith("/") ? "" : "/"}${assetUrl}`;
};

const emptyForm = {
  razonSocial: "",
  ruc: "",
  direccion: "",
  telefono: "",
  correo: "",
  pieInstitucional: "",
  logoUrl: "",
  logoFile: null,
  removeLogo: false,
};

const ConfiguracionEmpresaPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const objectUrlRef = useRef(null);

  const logoPreviewUrl = useMemo(() => {
    if (formData.logoFile && objectUrlRef.current) {
      return objectUrlRef.current;
    }

    return resolveAssetUrl(formData.logoUrl);
  }, [formData.logoFile, formData.logoUrl]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await configuracionEmpresaApi.obtener();
        setFormData({
          ...emptyForm,
          ...data,
          logoFile: null,
          removeLogo: false,
        });
      } catch (error) {
        toast.error(error.message || "No se pudo cargar la configuracion de empresa.");
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
      removeLogo: false,
    }));
  };

  const handleRemoveLogo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setFormData((current) => ({
      ...current,
      logoFile: null,
      logoUrl: "",
      removeLogo: true,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = new FormData();
    payload.append("razonSocial", formData.razonSocial);
    payload.append("ruc", formData.ruc || "");
    payload.append("direccion", formData.direccion || "");
    payload.append("telefono", formData.telefono || "");
    payload.append("correo", formData.correo || "");
    payload.append("pieInstitucional", formData.pieInstitucional || "");
    payload.append("removeLogo", String(formData.removeLogo));

    if (formData.logoFile) {
      payload.append("logo", formData.logoFile);
    }

    setSaving(true);
    try {
      const response = await configuracionEmpresaApi.guardar(payload);
      setFormData({
        ...emptyForm,
        ...response.configuracion,
        logoFile: null,
        removeLogo: false,
      });

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      toast.success("Configuracion institucional actualizada.");
    } catch (error) {
      toast.error(error.message || "No se pudo guardar la configuracion de empresa.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
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
                Estos datos alimentan la Solicitud de Cotizacion formal y quedan
                listos para reutilizarse en futuros documentos institucionales.
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

        <div className="grid gap-6 xl:grid-cols-[1.25fr,0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Razon social</span>
                <input
                  value={formData.razonSocial}
                  onChange={(event) => updateField("razonSocial", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Empresa emisora"
                  required
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">RUC / identificador fiscal</span>
                <input
                  value={formData.ruc}
                  onChange={(event) => updateField("ruc", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="20123456789"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Telefono</span>
                <input
                  value={formData.telefono}
                  onChange={(event) => updateField("telefono", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="+51 999 999 999"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Direccion</span>
                <input
                  value={formData.direccion}
                  onChange={(event) => updateField("direccion", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Direccion institucional"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Correo institucional</span>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(event) => updateField("correo", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="logistica@empresa.pe"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Pie institucional</span>
                <textarea
                  rows="4"
                  value={formData.pieInstitucional}
                  onChange={(event) =>
                    updateField("pieInstitucional", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Texto final que aparecerá al pie del documento."
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Logo institucional</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
                <p className="text-xs text-slate-500">
                  Se recomienda una imagen limpia en PNG, JPG o WEBP. El backend la
                  normaliza para uso documental.
                </p>
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

              {(formData.logoUrl || formData.logoFile) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  Quitar logo
                </button>
              )}
            </div>
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Vista rapida
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Identidad que saldra en la solicitud
            </h2>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              {logoPreviewUrl ? (
                <img
                  src={logoPreviewUrl}
                  alt="Logo institucional"
                  className="mb-4 h-20 w-20 rounded-2xl border border-slate-200 bg-white object-contain p-2"
                />
              ) : (
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Sin logo
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {formData.razonSocial || "Empresa emisora"}
                </h3>
                <p className="text-sm text-slate-600">
                  {formData.ruc || "Sin RUC"}{" "}
                  {formData.telefono ? `· ${formData.telefono}` : ""}
                </p>
                <p className="text-sm text-slate-600">
                  {formData.direccion || "Sin direccion registrada"}
                </p>
                <p className="text-sm text-slate-600">
                  {formData.correo || "Sin correo institucional"}
                </p>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  {formData.pieInstitucional ||
                    "El pie institucional aparecerá aqui cuando se configure."}
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
