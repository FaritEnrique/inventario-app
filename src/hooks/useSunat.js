import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import sunatApi from "../api/sunatApi";

const JOB_TYPE = {
  PADRON_COMPLETO: "PADRON_COMPLETO",
  PADRON_REDUCIDO: "PADRON_REDUCIDO",
};

const ACTIVE_JOB_STATES = new Set(["PENDIENTE", "EN_PROCESO"]);
const POLLING_INTERVAL_MS = 5000;

const useSunat = () => {
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [ultimaActualizacionReducido, setUltimaActualizacionReducido] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [iniciandoSunat, setIniciandoSunat] = useState(false);
  const [iniciandoReducido, setIniciandoReducido] = useState(false);
  const [estadoImportacionSunat, setEstadoImportacionSunat] = useState(null);
  const [estadoImportacionReducido, setEstadoImportacionReducido] =
    useState(null);
  const pollingRefs = useRef({
    [JOB_TYPE.PADRON_COMPLETO]: null,
    [JOB_TYPE.PADRON_REDUCIDO]: null,
  });

  const clearPolling = useCallback((tipo) => {
    if (pollingRefs.current[tipo]) {
      clearInterval(pollingRefs.current[tipo]);
      pollingRefs.current[tipo] = null;
    }
  }, []);

  const obtenerUltimaActualizacion = useCallback(async () => {
    try {
      const data = await sunatApi.obtenerUltimaActualizacion();
      setUltimaActualizacion(data?.ultimaActualizacion || null);
      return data;
    } catch (err) {
      toast.error("Error al obtener la ultima actualizacion del padron SUNAT.");
      console.error(err);
      return null;
    }
  }, []);

  const obtenerUltimaActualizacionReducido = useCallback(async () => {
    try {
      const data = await sunatApi.obtenerUltimaActualizacionReducido();
      setUltimaActualizacionReducido(
        data?.ultimaActualizacionReducido || null
      );
      return data;
    } catch (err) {
      toast.error(
        "Error al obtener la ultima actualizacion del padron reducido."
      );
      console.error(err);
      return null;
    }
  }, []);

  const obtenerEstadoImportacion = useCallback(
    async (tipo, { silent = false } = {}) => {
      try {
        const response = await sunatApi.obtenerEstadoImportacion(tipo);
        const job = response?.job || null;

        if (tipo === JOB_TYPE.PADRON_COMPLETO) {
          setEstadoImportacionSunat(job);
          if (job?.estado === "COMPLETADO") {
            void obtenerUltimaActualizacion();
          }
        } else {
          setEstadoImportacionReducido(job);
          if (job?.estado === "COMPLETADO") {
            void obtenerUltimaActualizacionReducido();
          }
        }

        return job;
      } catch (err) {
        if (!silent) {
          toast.error("No se pudo consultar el estado de la importacion SUNAT.");
        }
        console.error(err);
        return null;
      }
    },
    [obtenerUltimaActualizacion, obtenerUltimaActualizacionReducido]
  );

  const ensurePolling = useCallback(
    (tipo) => {
      if (pollingRefs.current[tipo]) {
        return;
      }

      pollingRefs.current[tipo] = setInterval(() => {
        void obtenerEstadoImportacion(tipo, { silent: true });
      }, POLLING_INTERVAL_MS);
    },
    [obtenerEstadoImportacion]
  );

  useEffect(
    () => () => {
      clearPolling(JOB_TYPE.PADRON_COMPLETO);
      clearPolling(JOB_TYPE.PADRON_REDUCIDO);
    },
    [clearPolling]
  );

  useEffect(() => {
    if (ACTIVE_JOB_STATES.has(estadoImportacionSunat?.estado)) {
      ensurePolling(JOB_TYPE.PADRON_COMPLETO);
    } else {
      clearPolling(JOB_TYPE.PADRON_COMPLETO);
    }
  }, [estadoImportacionSunat?.estado, ensurePolling, clearPolling]);

  useEffect(() => {
    if (ACTIVE_JOB_STATES.has(estadoImportacionReducido?.estado)) {
      ensurePolling(JOB_TYPE.PADRON_REDUCIDO);
    } else {
      clearPolling(JOB_TYPE.PADRON_REDUCIDO);
    }
  }, [estadoImportacionReducido?.estado, ensurePolling, clearPolling]);

  const actualizarPadronSunat = useCallback(async () => {
    if (iniciandoSunat || ACTIVE_JOB_STATES.has(estadoImportacionSunat?.estado)) {
      toast.warn("Ya hay una importacion del padron SUNAT en proceso.");
      return null;
    }

    setIniciandoSunat(true);
    try {
      const response = await sunatApi.actualizarPadronSunat();
      const job = response?.job || null;
      setEstadoImportacionSunat(job);

      if (response?.alreadyRunning) {
        toast.info(
          response?.mensaje || "Ya existe una importacion del padron SUNAT en proceso."
        );
      } else {
        toast.success(
          response?.mensaje ||
            "La importacion del padron SUNAT fue iniciada correctamente."
        );
      }

      void obtenerEstadoImportacion(JOB_TYPE.PADRON_COMPLETO, { silent: true });
      return response;
    } catch (err) {
      console.error("Error en actualizarPadronSunat:", err);
      toast.error(
        err?.message || "Error al iniciar la importacion del padron SUNAT."
      );
      return null;
    } finally {
      setIniciandoSunat(false);
    }
  }, [estadoImportacionSunat?.estado, iniciandoSunat, obtenerEstadoImportacion]);

  const actualizarPadronReducido = useCallback(async () => {
    if (
      iniciandoReducido ||
      ACTIVE_JOB_STATES.has(estadoImportacionReducido?.estado)
    ) {
      toast.warn("Ya hay una importacion del padron reducido en proceso.");
      return null;
    }

    setIniciandoReducido(true);
    try {
      const response = await sunatApi.actualizarPadronReducido();
      const job = response?.job || null;
      setEstadoImportacionReducido(job);

      if (response?.alreadyRunning) {
        toast.info(
          response?.mensaje ||
            "Ya existe una importacion del padron reducido en proceso."
        );
      } else {
        toast.success(
          response?.mensaje ||
            "La importacion del padron reducido fue iniciada correctamente."
        );
      }

      void obtenerEstadoImportacion(JOB_TYPE.PADRON_REDUCIDO, { silent: true });
      return response;
    } catch (err) {
      console.error("Error en actualizarPadronReducido:", err);
      toast.error(
        err?.message || "Error al iniciar la importacion del padron reducido."
      );
      return null;
    } finally {
      setIniciandoReducido(false);
    }
  }, [
    estadoImportacionReducido?.estado,
    iniciandoReducido,
    obtenerEstadoImportacion,
  ]);

  const obtenerEstadoImportacionSunat = useCallback(
    () => obtenerEstadoImportacion(JOB_TYPE.PADRON_COMPLETO),
    [obtenerEstadoImportacion]
  );

  const obtenerEstadoImportacionReducido = useCallback(
    () => obtenerEstadoImportacion(JOB_TYPE.PADRON_REDUCIDO),
    [obtenerEstadoImportacion]
  );

  const consultarPadronSunat = useCallback(async (ruc) => {
    if (!ruc || !/^\d{11}$/.test(ruc)) return null;

    setLoading(true);
    try {
      const response = await sunatApi.consultarPadronSunat(ruc);

      if (!response?.ok) return null;

      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Error consultando SUNAT:", err);
      toast.error("No se pudo conectar con SUNAT. Verifica tu conexion.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ultimaActualizacion,
    ultimaActualizacionReducido,
    loading,
    actualizando:
      iniciandoSunat || ACTIVE_JOB_STATES.has(estadoImportacionSunat?.estado),
    actualizandoReducido:
      iniciandoReducido ||
      ACTIVE_JOB_STATES.has(estadoImportacionReducido?.estado),
    estadoImportacionSunat,
    estadoImportacionReducido,
    actualizarPadronSunat,
    actualizarPadronReducido,
    obtenerUltimaActualizacion,
    obtenerUltimaActualizacionReducido,
    obtenerEstadoImportacionSunat,
    obtenerEstadoImportacionReducido,
    consultarPadronSunat,
  };
};

export default useSunat;
