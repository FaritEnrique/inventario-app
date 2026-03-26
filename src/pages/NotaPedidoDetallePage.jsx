import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canApprovePedidoInternoEffective,
  canViewWarehouseTrayEffective,
} from "../accessRules";
import PedidoInternoDetallePanel from "../components/PedidoInternoDetallePanel";
import { useAuth } from "../context/authContext";
import usePedidosInternos from "../hooks/usePedidosInternos";

const NotaPedidoDetallePage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const { loading, obtenerPedidoPorId } = usePedidosInternos();
  const [pedido, setPedido] = useState(null);

  const canApprove = canApprovePedidoInternoEffective(user);
  const canUseWarehouseTray = canViewWarehouseTrayEffective(user);

  useEffect(() => {
    const cargarPedido = async () => {
      try {
        const response = await obtenerPedidoPorId(id);
        setPedido(response);
      } catch (error) {
        toast.error(error.message || "No se pudo cargar la nota de pedido.");
        setPedido(null);
      }
    };

    cargarPedido();
  }, [id]);

  const quickLinks = useMemo(() => {
    const links = [
      {
        to: "/notas-pedido",
        label: "Volver a notas",
        className:
          "rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50",
      },
      {
        to: "/inventario-stock",
        label: "Ver stock",
        className:
          "rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50",
      },
    ];

    if (canApprove && pedido?.estadoFlujo === "PENDIENTE_APROBACION") {
      links.push({
        to: "/notas-pedido/aprobaciones",
        label: "Ir a aprobaciones",
        className:
          "rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50",
      });
    }

    if (
      canUseWarehouseTray &&
      ["APROBADO", "PARCIALMENTE_ATENDIDO", "EN_ATENCION"].includes(
        pedido?.estadoFlujo
      )
    ) {
      links.push({
        to: "/notas-pedido/almacen",
        label: "Ir a bandeja de almacen",
        className:
          "rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50",
      });
    }

    return links;
  }, [canApprove, canUseWarehouseTray, pedido?.estadoFlujo]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Detalle de Nota de Pedido
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Revisa el documento interno, sus reservas y las notas de salida
            vinculadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className={link.className}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {loading && !pedido ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-slate-500">Cargando nota de pedido...</p>
        </div>
      ) : !pedido ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-slate-500">
            No se encontro la nota de pedido solicitada.
          </p>
        </div>
      ) : (
        <PedidoInternoDetallePanel pedido={pedido} />
      )}
    </div>
  );
};

export default NotaPedidoDetallePage;
