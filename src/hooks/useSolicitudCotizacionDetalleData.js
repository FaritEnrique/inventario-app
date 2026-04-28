import { useCallback, useEffect, useMemo, useState } from "react";
import configuracionEmpresaApi from "../api/configuracionEmpresaApi";
import solicitudesCotizacionApi from "../api/solicitudesCotizacionApi";
import {
  buildLetterheadDocumentData,
  resolveInstitutionalAssetUrl,
} from "../utils/configuracionEmpresaLetterhead";

const useSolicitudCotizacionDetalleData = (id) => {
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configuracionEmpresa, setConfiguracionEmpresa] = useState(null);
  const [configuracionEmpresaError, setConfiguracionEmpresaError] =
    useState(null);

  const load = useCallback(async () => {
    if (!id) {
      setSolicitud(null);
      setError("Solicitud de cotizacion invalida.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [solicitudResult, empresaResult] = await Promise.allSettled([
        solicitudesCotizacionApi.obtenerPorId(id),
        configuracionEmpresaApi.obtenerDocumento(),
      ]);

      if (solicitudResult.status !== "fulfilled") {
        throw solicitudResult.reason;
      }

      setSolicitud(solicitudResult.value);
      setError(null);

      if (empresaResult.status === "fulfilled") {
        setConfiguracionEmpresa(empresaResult.value);
        setConfiguracionEmpresaError(null);
      } else {
        setConfiguracionEmpresa(null);
        setConfiguracionEmpresaError(
          empresaResult.reason?.message ||
            "No se pudo cargar la configuracion institucional.",
        );
      }
    } catch (err) {
      setSolicitud(null);
      setError(err?.message || "No se pudo cargar la solicitud de cotizacion.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const documentData = useMemo(
    () =>
      buildLetterheadDocumentData(
        configuracionEmpresa || {},
        configuracionEmpresa?.logoSrc ||
          resolveInstitutionalAssetUrl(configuracionEmpresa?.logoUrl || ""),
        {
          usePlaceholderIdentity: false,
        },
      ),
    [configuracionEmpresa],
  );

  return {
    solicitud,
    loading,
    error,
    configuracionEmpresaError,
    documentData,
    reload: load,
  };
};

export default useSolicitudCotizacionDetalleData;
