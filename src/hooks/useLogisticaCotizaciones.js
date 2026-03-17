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

  const obtenerOperadores = useCallback(
    async () =>
      run(
        () => logisticaCotizacionesApi.obtenerOperadores(),
        "No se pudo cargar la lista de operadores logisticos."
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

  const marcarListoAdjudicacion = useCallback(
    async (requerimientoId) =>
      run(
        () => logisticaCotizacionesApi.marcarListoAdjudicacion(requerimientoId),
        "No se pudo dejar listo el expediente para adjudicacion."
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
    obtenerOperadores,
    asignar,
    iniciar,
    marcarListoAdjudicacion,
    generarOrdenCompra,
  };
};

export default useLogisticaCotizaciones;
