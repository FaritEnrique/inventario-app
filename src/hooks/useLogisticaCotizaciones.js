// src/hooks/useLogisticaCotizaciones.js
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import logisticaCotizacionesApi from "../api/logisticaCotizacionesApi";

const useLogisticaCotizaciones = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (task, fallbackMessage) => {
    try {
      setCargando(true);
      const data = await task();
      setError(null);
      return data;
    } catch (err) {
      const message = err.message || fallbackMessage;
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const obtenerBandeja = useCallback(
    async (tipo, params = {}) => {
      return run(
        () =>
          tipo === "jefatura"
            ? logisticaCotizacionesApi.obtenerBandejaJefatura(params)
            : logisticaCotizacionesApi.obtenerBandejaOperador(params),
        "No se pudo cargar la bandeja logistica.",
      );
    },
    [run],
  );

  const obtenerDetalle = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.obtenerDetalle(requerimientoId),
        "No se pudo cargar el expediente logistico.",
      ),
    [run],
  );

  const listarFlujosCotizacion = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.listarFlujosCotizacion(requerimientoId),
        "No se pudieron cargar los flujos de cotización.",
      ),
    [run],
  );

  const cerrarFlujoCotizacion = useCallback(
    async (flujoId, payload = {}) =>
      run(
        () => logisticaCotizacionesApi.cerrarFlujoCotizacion(flujoId, payload),
        "No se pudo cerrar el flujo de cotización.",
      ),
    [run],
  );

  const reabrirFlujoCotizacion = useCallback(
    async (flujoId, payload = {}) =>
      run(
        () => logisticaCotizacionesApi.reabrirFlujoCotizacion(flujoId, payload),
        "No se pudo reabrir el flujo de cotización.",
      ),
    [run],
  );

  const obtenerComparativoPorFlujo = useCallback(
    async (flujoId) =>
      run(
        () => logisticaCotizacionesApi.obtenerComparativoPorFlujo(flujoId),
        "No se pudo cargar el comparativo del flujo.",
      ),
    [run],
  );

  const obtenerBuenaProPorFlujo = useCallback(
    async (flujoId) =>
      run(
        () => logisticaCotizacionesApi.obtenerBuenaProPorFlujo(flujoId),
        "No se pudo cargar la Buena Pro del flujo.",
      ),
    [run],
  );

  const registrarBuenaPro = useCallback(
    async (flujoId, payload) =>
      run(
        () => logisticaCotizacionesApi.registrarBuenaPro(flujoId, payload),
        "No se pudo registrar la Buena Pro.",
      ),
    [run],
  );

  const anularBuenaPro = useCallback(
    async (buenaProId, payload) =>
      run(
        () => logisticaCotizacionesApi.anularBuenaPro(buenaProId, payload),
        "No se pudo anular la Buena Pro.",
      ),
    [run],
  );

  const generarOrdenesCompraDesdeBuenaPro = useCallback(
    async (buenaProId) =>
      run(
        () =>
          logisticaCotizacionesApi.generarOrdenesCompraDesdeBuenaPro(
            buenaProId,
          ),
        "No se pudieron generar las Órdenes de Compra desde la Buena Pro.",
      ),
    [run],
  );

  const definirFlujo = useCallback(
    async (requerimientoId, payload) =>
      run(
        () => logisticaCotizacionesApi.definirFlujo(requerimientoId, payload),
        "No se pudo definir la modalidad del flujo logistico.",
      ),
    [run],
  );

  const obtenerOperadores = useCallback(
    async () =>
      run(
        () => logisticaCotizacionesApi.obtenerOperadores(),
        "No se pudo cargar la lista de operadores logisticos.",
      ),
    [run],
  );

  const asignar = useCallback(
    async (requerimientoId, payload) =>
      run(
        () => logisticaCotizacionesApi.asignar(requerimientoId, payload),
        "No se pudo asignar el expediente logistico.",
      ),
    [run],
  );

  const iniciar = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.iniciar(requerimientoId),
        "No se pudo iniciar el expediente logistico.",
      ),
    [run],
  );

  const formalizarDecisionExcepcional = useCallback(
    async (requerimientoId, payload) =>
      run(
        () =>
          logisticaCotizacionesApi.formalizarDecisionExcepcional(
            requerimientoId,
            payload,
          ),
        "No se pudo formalizar la decision excepcional.",
      ),
    [run],
  );

  const marcarListoAdjudicacion = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.marcarListoAdjudicacion(requerimientoId),
        "No se pudo dejar listo el expediente para adjudicacion.",
      ),
    [run],
  );

  const adjudicarCotizacionDirectaExcepcional = useCallback(
    async (cotizacionId, payload) =>
      run(
        () =>
          logisticaCotizacionesApi.adjudicarCotizacionDirectaExcepcional(
            cotizacionId,
            payload,
          ),
        "No se pudo registrar la adjudicacion directa excepcional.",
      ),
    [run],
  );

  return {
    cargando,
    error,
    obtenerBandeja,
    obtenerDetalle,
    listarFlujosCotizacion,
    cerrarFlujoCotizacion,
    reabrirFlujoCotizacion,
    obtenerComparativoPorFlujo,
    obtenerBuenaProPorFlujo,
    registrarBuenaPro,
    anularBuenaPro,
    generarOrdenesCompraDesdeBuenaPro,
    definirFlujo,
    obtenerOperadores,
    asignar,
    iniciar,
    formalizarDecisionExcepcional,
    marcarListoAdjudicacion,
    adjudicarCotizacionDirectaExcepcional,
  };
};

export default useLogisticaCotizaciones;
