import { useCallback } from "react";
import { toast } from "react-toastify";
import useAppDialog from "./useAppDialog";
import useLogisticaCotizaciones from "./useLogisticaCotizaciones";
import { TIPO_COMPRA_LABELS } from "../utils/flujoCotizacionUi";

const getTipoCompraLabel = (flujo) =>
  TIPO_COMPRA_LABELS[flujo?.tipoCompra] || flujo?.tipoCompra || "este flujo";

const useFlujoCotizacionActions = ({ onAfterChange } = {}) => {
  const { confirm, prompt, dialogNode } = useAppDialog();
  const { cargando, cerrarFlujoCotizacion, reabrirFlujoCotizacion } =
    useLogisticaCotizaciones();

  const refreshAfterChange = useCallback(async () => {
    if (typeof onAfterChange === "function") {
      await onAfterChange();
    }
  }, [onAfterChange]);

  const handleCerrarFlujo = useCallback(
    async (flujo) => {
      if (!flujo?.id) return;

      const tipoCompraLabel = getTipoCompraLabel(flujo);
      const motivoCierre = await prompt({
        title: `Cerrar flujo ${tipoCompraLabel}`,
        message: `Al cerrar este flujo, ya no se podrán emitir nuevas solicitudes ni registrar/modificar cotizaciones de tipo ${tipoCompraLabel} hasta que sea reabierto. ¿Desea continuar?`,
        defaultValue: "",
        placeholder: "Motivo de cierre opcional",
        confirmText: "Cerrar flujo",
        cancelText: "Cancelar",
        variant: "warning",
      });

      if (motivoCierre === null) return;

      await cerrarFlujoCotizacion(flujo.id, {
        motivoCierre: String(motivoCierre || "").trim() || null,
      });
      await refreshAfterChange();
      toast.success(`Flujo ${tipoCompraLabel} cerrado correctamente.`);
    },
    [cerrarFlujoCotizacion, prompt, refreshAfterChange],
  );

  const handleReabrirFlujo = useCallback(
    async (flujo) => {
      if (!flujo?.id) return;

      const tipoCompraLabel = getTipoCompraLabel(flujo);
      const motivoReapertura = await prompt({
        title: `Reabrir flujo ${tipoCompraLabel}`,
        message: "Registre el motivo de reapertura del flujo de cotización.",
        defaultValue: "",
        placeholder: "Motivo de reapertura",
        confirmText: "Reabrir flujo",
        cancelText: "Cancelar",
        variant: "warning",
      });

      if (motivoReapertura === null) return;

      const motivo = String(motivoReapertura || "").trim();
      if (!motivo) {
        toast.error("Debe registrar el motivo de reapertura.");
        return;
      }

      const confirmed = await confirm({
        title: `Confirmar reapertura ${tipoCompraLabel}`,
        message:
          "El flujo volverá a quedar disponible para emitir solicitudes y registrar o corregir cotizaciones.",
        confirmText: "Reabrir",
        cancelText: "Cancelar",
        variant: "warning",
      });

      if (!confirmed) return;

      await reabrirFlujoCotizacion(flujo.id, { motivoReapertura: motivo });
      await refreshAfterChange();
      toast.success(`Flujo ${tipoCompraLabel} reabierto correctamente.`);
    },
    [confirm, prompt, reabrirFlujoCotizacion, refreshAfterChange],
  );

  return {
    dialogNode,
    submittingFlujo: cargando,
    handleCerrarFlujo,
    handleReabrirFlujo,
  };
};

export default useFlujoCotizacionActions;
