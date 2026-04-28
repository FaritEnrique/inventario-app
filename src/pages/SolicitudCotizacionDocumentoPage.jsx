import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaFilePdf } from "react-icons/fa";
import solicitudesCotizacionApi from "../api/solicitudesCotizacionApi";

const SolicitudCotizacionDocumentoPage = () => {
  const { id } = useParams();

  const pdfUrl = useMemo(
    () => (id ? solicitudesCotizacionApi.obtenerPdfUrl(id) : ""),
    [id],
  );

  useEffect(() => {
    if (!pdfUrl) return;
    window.location.replace(pdfUrl);
  }, [pdfUrl]);

  return (
    <>
      <Helmet>
        <title>Abriendo PDF oficial</title>
        <meta
          name="description"
          content="Redireccion al PDF oficial de la solicitud de cotizacion."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Documento oficial
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Abriendo PDF oficial
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            El documento oficial de la solicitud de cotizacion se genera en el
            backend como PDF estable con membrete institucional.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={id ? `/solicitudes-cotizacion/${id}` : "/cotizaciones"}
              className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FaArrowLeft className="text-xs" />
              Volver al detalle
            </Link>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <FaFilePdf className="text-xs" />
                Abrir PDF
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default SolicitudCotizacionDocumentoPage;
