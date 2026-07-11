import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  FileClock,
  ListChecks,
  ShoppingCart,
} from "lucide-react";

const alertMeta = {
  PLAZO_VENCIDO: {
    label: "Plazo vencido",
    description: "Solicitudes sin respuesta con fecha limite vencida.",
    icon: AlertTriangle,
    cardClass: "border-red-200 bg-red-50 text-red-800",
    buttonClass: "border-red-300 text-red-700 hover:bg-red-100",
  },
  PLAZO_POR_VENCER: {
    label: "Por vencer",
    description: "Solicitudes sin respuesta cerca de vencer.",
    icon: Clock,
    cardClass: "border-amber-200 bg-amber-50 text-amber-800",
    buttonClass: "border-amber-300 text-amber-800 hover:bg-amber-100",
  },
  COBERTURA_INCOMPLETA: {
    label: "Cobertura incompleta",
    description: "Items que no cumplen la cobertura minima de cotizaciones.",
    icon: ListChecks,
    cardClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
    buttonClass: "border-indigo-300 text-indigo-700 hover:bg-indigo-100",
  },
  FLUJO_CERRADO_SIN_BUENA_PRO: {
    label: "Flujo sin Buena Pro",
    description: "Flujos cerrados que aun no registran Buena Pro activa.",
    icon: Award,
    cardClass: "border-orange-200 bg-orange-50 text-orange-800",
    buttonClass: "border-orange-300 text-orange-700 hover:bg-orange-100",
  },
  BUENA_PRO_SIN_OC: {
    label: "Buena Pro sin O/C",
    description: "Buenas Pro activas pendientes de generar Orden de Compra.",
    icon: ShoppingCart,
    cardClass: "border-teal-200 bg-teal-50 text-teal-800",
    buttonClass: "border-teal-300 text-teal-700 hover:bg-teal-100",
  },
  OC_PENDIENTE_APROBACION: {
    label: "O/C por aprobar",
    description: "Órdenes de Compra pendientes de aprobación.",
    icon: FileClock,
    cardClass: "border-purple-200 bg-purple-50 text-purple-800",
    buttonClass: "border-purple-300 text-purple-700 hover:bg-purple-100",
  },
  OC_APROBADA_PENDIENTE_RECEPCION: {
    label: "O/C por recibir",
    description: "Órdenes aprobadas pendientes de recepción.",
    icon: CheckCircle2,
    cardClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    buttonClass: "border-emerald-300 text-emerald-700 hover:bg-emerald-100",
  },
};

export const alertOrder = [
  "PLAZO_VENCIDO",
  "PLAZO_POR_VENCER",
  "COBERTURA_INCOMPLETA",
  "FLUJO_CERRADO_SIN_BUENA_PRO",
  "BUENA_PRO_SIN_OC",
  "OC_PENDIENTE_APROBACION",
  "OC_APROBADA_PENDIENTE_RECEPCION",
];

export const getSeguimientoAlertMeta = (tipo) =>
  alertMeta[tipo] || {
    label: "Alerta",
    description: "Revisa el expediente.",
    icon: AlertTriangle,
    cardClass: "border-slate-200 bg-slate-50 text-slate-800",
    buttonClass: "border-slate-300 text-slate-700 hover:bg-slate-50",
  };


export const getSeguimientoAlertDetalle = (expediente, tipo) => {
  const detalle = expediente?.alertasSeguimiento?.detalle || {};
  if (tipo === "PLAZO_VENCIDO") return detalle.solicitudesVencidas || [];
  if (tipo === "PLAZO_POR_VENCER") return detalle.solicitudesPorVencer || [];
  if (tipo === "COBERTURA_INCOMPLETA") {
    return detalle.itemsCoberturaIncompleta || [];
  }
  if (tipo === "FLUJO_CERRADO_SIN_BUENA_PRO") {
    return detalle.flujosCerradosSinBuenaPro || [];
  }
  if (tipo === "BUENA_PRO_SIN_OC") {
    return detalle.buenasProSinOrdenCompra || [];
  }
  if (tipo === "OC_PENDIENTE_APROBACION") {
    return detalle.ordenesCompraPendientesAprobacion || [];
  }
  if (tipo === "OC_APROBADA_PENDIENTE_RECEPCION") {
    return detalle.ordenesCompraAprobadasPendientesRecepcion || [];
  }
  return [];
};
