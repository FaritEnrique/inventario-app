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
        "No se pudo cargar la bandeja logistica."
      );
    },
    [run]
  );

  const obtenerDetalle = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.obtenerDetalle(requerimientoId),
        "No se pudo cargar el expediente logistico."
      ),
    [run]
  );

  const definirFlujo = useCallback(
    async (requerimientoId, payload) =>
      run(
        () => logisticaCotizacionesApi.definirFlujo(requerimientoId, payload),
        "No se pudo definir la modalidad del flujo logistico."
      ),
    [run]
  );

  const obtenerOperadores = useCallback(
    async () =>
      run(
        () => logisticaCotizacionesApi.obtenerOperadores(),
        "No se pudo cargar la lista de operadores logisticos."
      ),
    [run]
  );

  const obtenerComparativo = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.obtenerComparativo(requerimientoId),
        "No se pudo cargar el comparativo formal."
      ),
    [run]
  );

  const asignar = useCallback(
    async (requerimientoId, payload) =>
      run(
        () => logisticaCotizacionesApi.asignar(requerimientoId, payload),
        "No se pudo asignar el expediente logistico."
      ),
    [run]
  );

  const iniciar = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.iniciar(requerimientoId),
        "No se pudo iniciar el expediente logistico."
      ),
    [run]
  );

  const formalizarDecisionExcepcional = useCallback(
    async (requerimientoId, payload) =>
      run(
        () =>
          logisticaCotizacionesApi.formalizarDecisionExcepcional(
            requerimientoId,
            payload
          ),
        "No se pudo formalizar la decision excepcional."
      ),
    [run]
  );

  const marcarListoAdjudicacion = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.marcarListoAdjudicacion(requerimientoId),
        "No se pudo dejar listo el expediente para adjudicacion."
      ),
    [run]
  );

  const crearComparativo = useCallback(
    async (requerimientoId, payload) =>
      run(
        () => logisticaCotizacionesApi.crearComparativo(requerimientoId, payload),
        "No se pudo crear el comparativo formal."
      ),
    [run]
  );

  const actualizarComparativo = useCallback(
    async (comparativoId, payload) =>
      run(
        () => logisticaCotizacionesApi.actualizarComparativo(comparativoId, payload),
        "No se pudo actualizar el comparativo formal."
      ),
    [run]
  );

  const aprobarComparativo = useCallback(
    async (comparativoId, payload = {}) =>
      run(
        () => logisticaCotizacionesApi.aprobarComparativo(comparativoId, payload),
        "No se pudo aprobar el comparativo formal."
      ),
    [run]
  );

  const observarComparativo = useCallback(
    async (comparativoId, payload = {}) =>
      run(
        () => logisticaCotizacionesApi.observarComparativo(comparativoId, payload),
        "No se pudo observar el comparativo formal."
      ),
    [run]
  );

  const rechazarComparativo = useCallback(
    async (comparativoId, payload = {}) =>
      run(
        () => logisticaCotizacionesApi.rechazarComparativo(comparativoId, payload),
        "No se pudo rechazar el comparativo formal."
      ),
    [run]
  );

  const adjudicarCotizacionDirectaExcepcional = useCallback(
    async (cotizacionId, payload) =>
      run(
        () =>
          logisticaCotizacionesApi.adjudicarCotizacionDirectaExcepcional(
            cotizacionId,
            payload
          ),
        "No se pudo registrar la adjudicacion directa excepcional."
      ),
    [run]
  );

  const generarOrdenCompra = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.generarOrdenCompra(requerimientoId),
        "No se pudo generar la orden de compra."
      ),
    [run]
  );

  return {
    cargando,
    error,
    obtenerBandeja,
    obtenerDetalle,
    definirFlujo,
    obtenerComparativo,
    obtenerOperadores,
    asignar,
    iniciar,
    formalizarDecisionExcepcional,
    marcarListoAdjudicacion,
    crearComparativo,
    actualizarComparativo,
    aprobarComparativo,
    observarComparativo,
    rechazarComparativo,
    adjudicarCotizacionDirectaExcepcional,
    generarOrdenCompra,
  };
};

export default useLogisticaCotizaciones;
