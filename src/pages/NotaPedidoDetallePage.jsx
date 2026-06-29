import { useCallback, useEffect, useMemo, useState } from "react";
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
  const { loading, obtenerPedidoPorId, obtenerPedidoPdfBlob } = usePedidosInternos();
  const [pedido, setPedido] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);

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
  }, [id, obtenerPedidoPorId]);

  const getSafePdfBlob = useCallback(async () => {
    const { blob } = await obtenerPedidoPdfBlob(id);

    return blob?.type === "application/pdf"
      ? blob
      : new Blob([blob], { type: "application/pdf" });
  }, [id, obtenerPedidoPdfBlob]);

  const handleDownloadPdf = useCallback(async () => {
    if (!pedido) return;

    setDownloadingPdf(true);
    try {
      const safeBlob = await getSafePdfBlob();
      const url = window.URL.createObjectURL(safeBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `NotaPedido-${pedido.codigo || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      toast.error(
        downloadError.message || "No se pudo generar el PDF de la nota de pedido.",
      );
    } finally {
      setDownloadingPdf(false);
    }
  }, [getSafePdfBlob, id, pedido]);

  const handlePrintPdf = useCallback(async () => {
    if (!pedido) return;

    setPrintingPdf(true);
    try {
      const safeBlob = await getSafePdfBlob();
      const blobUrl = window.URL.createObjectURL(safeBlob);
      const pdfWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");

      if (!pdfWindow) {
        window.URL.revokeObjectURL(blobUrl);
        toast.info("Se bloqueó la ventana emergente. Usa Descargar PDF.");
        return;
      }

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    } catch (printError) {
      toast.error(
        printError.message || "No se pudo abrir el PDF de la nota de pedido.",
      );
    } finally {
      setPrintingPdf(false);
    }
  }, [getSafePdfBlob, pedido]);

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
        pedido?.estadoFlujo,
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
          <h1 className="text-3xl font-semibold text-slate-900">
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
          {pedido ? (
            <>
              <button
                type="button"
                onClick={handlePrintPdf}
                disabled={printingPdf || downloadingPdf}
                className="rounded border border-violet-300 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {printingPdf ? "Abriendo PDF…" : "Imprimir PDF"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || printingPdf}
                className="rounded bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingPdf ? "Generando PDF…" : "Descargar PDF"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {loading && !pedido ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-slate-500">Cargando nota de pedido…</p>
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
