import React from "react";
import { Link } from "react-router-dom";
import { buildOrdenCompraGeneradaViewModel } from "../utils/ordenCompraDesdeBuenaProViewModel";

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const formatMoney = (value, currency = "PEN") => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  const normalizedCurrency = String(currency || "").toUpperCase();
  const prefix =
    normalizedCurrency === "USD"
      ? "US$"
      : normalizedCurrency === "PEN"
        ? "S/"
        : currency || "";

  return `${prefix} ${number.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const estadoLabel = (value) =>
  formatText(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

const OrdenesCompraGeneradasPanel = ({ ordenesCompra = [] }) => {
  if (!ordenesCompra.length) return null;

  const ordenes = ordenesCompra.map(buildOrdenCompraGeneradaViewModel);

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-indigo-950">
            Órdenes de Compra generadas
          </h3>
          <p className="mt-1 text-sm text-indigo-900">
            Las órdenes quedan pendientes de aprobación.
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
          {ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-white/70 text-xs uppercase text-indigo-800">
            <tr>
              <th className="px-3 py-2 text-center">Código</th>
              <th className="px-3 py-2 text-center">Proveedor</th>
              <th className="px-3 py-2 text-center">Monto total</th>
              <th className="px-3 py-2 text-center">Estado</th>
              <th className="px-3 py-2 text-center">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden, index) => (
              <tr
                key={orden.id || `${orden.codigo}-${index}`}
                className="border-b border-indigo-100 last:border-0"
              >
                <td className="px-3 py-3 font-semibold text-indigo-950">
                  {formatText(orden.codigo)}
                </td>
                <td className="px-3 py-3 text-slate-800">
                  {formatText(orden.proveedor)}
                  {orden.proveedorRuc ? (
                    <span className="ml-2 text-xs text-slate-500">
                      RUC {orden.proveedorRuc}
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatMoney(orden.montoTotal, orden.moneda)}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex rounded-full bg-white px-2 py-1 text-xs font-semibold text-indigo-700">
                    {estadoLabel(orden.estadoAprobacion)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {orden.id ? (
                    <Link
                      to={`/ordenes-compra/${orden.id}`}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Ver detalle
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">No disponible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdenesCompraGeneradasPanel;
