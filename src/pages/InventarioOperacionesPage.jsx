import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ProductoSearchField from "../components/ProductoSearchField";
import useAreas from "../hooks/useAreas";
import useInventario from "../hooks/useInventario";
import { useAuth } from "../context/authContext";
import {
  canAdjustInventory,
  canOperateInventory,
} from "../utils/inventarioPermissions";

const operationOptions = [
  { value: "cargaInicial", label: "Carga inicial" },
  { value: "ajuste", label: "Ajuste manual" },
  { value: "entrada", label: "Entrada manual" },
  { value: "salida", label: "Salida manual" },
  { value: "transferencia", label: "Transferencia" },
  { value: "reserva", label: "Reserva de stock" },
  { value: "liberarReserva", label: "Liberar reserva" },
  { value: "despacharReserva", label: "Despachar reserva" },
];

const initialForm = {
  cantidad: "",
  almacenId: "",
  almacenOrigenId: "",
  almacenDestinoId: "",
  areaId: "",
  fechaMovimiento: "",
  fechaDocumento: "",
  direccionAjuste: "INCREMENTO",
  subtipoMovimiento: "",
  referenciaTipo: "",
  referenciaId: "",
  referenciaCodigo: "",
  observaciones: "",
  reservaId: "",
  codigoNotaSalida: "",
};

const operationLabels = {
  cargaInicial: "carga inicial",
  ajuste: "ajuste",
  entrada: "entrada",
  salida: "salida",
  transferencia: "transferencia",
  reserva: "reserva",
  liberarReserva: "liberación de reserva",
  despacharReserva: "despacho de reserva",
};

const InventarioOperacionesPage = () => {
  const { user } = useAuth();
  const { areas } = useAreas();
  const inventario = useInventario();
  const [modo, setModo] = useState("cargaInicial");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [resultado, setResultado] = useState(null);

  const canOperate = canOperateInventory(user);
  const canAdjust = canAdjustInventory(user);

  const canSubmit = useMemo(() => {
    if (["cargaInicial", "ajuste"].includes(modo)) {
      return canAdjust;
    }
    return canOperate;
  }, [canAdjust, canOperate, modo]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildCommonPayload = () => ({
    cantidad: form.cantidad ? Number(form.cantidad) : undefined,
    areaId: form.areaId || undefined,
    fechaMovimiento: form.fechaMovimiento || undefined,
    fechaDocumento: form.fechaDocumento || undefined,
    subtipoMovimiento: form.subtipoMovimiento || undefined,
    referenciaTipo: form.referenciaTipo || undefined,
    referenciaId: form.referenciaId || undefined,
    referenciaCodigo: form.referenciaCodigo || undefined,
    observaciones: form.observaciones || undefined,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      let response = null;
      const payload = buildCommonPayload();

      switch (modo) {
        case "cargaInicial":
          if (!selectedProduct?.id) throw new Error("Debes seleccionar un producto.");
          response = await inventario.registrarCargaInicial({
            ...payload,
            productoId: selectedProduct.id,
            almacenId: form.almacenId || undefined,
          });
          break;
        case "ajuste":
          if (!selectedProduct?.id) throw new Error("Debes seleccionar un producto.");
          response = await inventario.registrarAjuste({
            ...payload,
            productoId: selectedProduct.id,
            almacenId: form.almacenId || undefined,
            direccionAjuste: form.direccionAjuste,
          });
          break;
        case "entrada":
          if (!selectedProduct?.id) throw new Error("Debes seleccionar un producto.");
          response = await inventario.registrarEntrada({
            ...payload,
            productoId: selectedProduct.id,
            almacenDestinoId: form.almacenDestinoId || undefined,
          });
          break;
        case "salida":
          if (!selectedProduct?.id) throw new Error("Debes seleccionar un producto.");
          response = await inventario.registrarSalida({
            ...payload,
            productoId: selectedProduct.id,
            almacenOrigenId: form.almacenOrigenId || undefined,
          });
          break;
        case "transferencia":
          if (!selectedProduct?.id) throw new Error("Debes seleccionar un producto.");
          response = await inventario.registrarTransferencia({
            ...payload,
            productoId: selectedProduct.id,
            almacenOrigenId: form.almacenOrigenId || undefined,
            almacenDestinoId: form.almacenDestinoId || undefined,
          });
          break;
        case "reserva":
          if (!selectedProduct?.id) throw new Error("Debes seleccionar un producto.");
          response = await inventario.registrarReserva({
            ...payload,
            productoId: selectedProduct.id,
            almacenId: form.almacenId || undefined,
          });
          break;
        case "liberarReserva":
          if (!form.reservaId) throw new Error("Debes indicar el ID de la reserva.");
          response = await inventario.liberarReserva(form.reservaId, {
            cantidad: form.cantidad ? Number(form.cantidad) : undefined,
            observaciones: form.observaciones || undefined,
          });
          break;
        case "despacharReserva":
          if (!form.reservaId) throw new Error("Debes indicar el ID de la reserva.");
          response = await inventario.despacharReserva(form.reservaId, {
            cantidad: form.cantidad ? Number(form.cantidad) : undefined,
            areaId: form.areaId || undefined,
            fechaMovimiento: form.fechaMovimiento || undefined,
            fechaDocumento: form.fechaDocumento || undefined,
            subtipoMovimiento: form.subtipoMovimiento || undefined,
            codigoNotaSalida: form.codigoNotaSalida || undefined,
            observaciones: form.observaciones || undefined,
          });
          break;
        default:
          throw new Error("Operación no soportada.");
      }

      setResultado(response);
      toast.success(`Se registró la ${operationLabels[modo]} correctamente.`);
      setForm(initialForm);
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la operación.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Operaciones de inventario
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Exposición operativa mínima de carga inicial, ajustes, movimientos manuales y reservas.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Dashboard
        </Link>
      </div>

      {!canSubmit ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Tu usuario no tiene autorización operativa para ejecutar movimientos de inventario.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="inventario-operacion-tipo" className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de operación
              </label>
              <select
                id="inventario-operacion-tipo"
                value={modo}
                name="inventario-operaciones-page-select-208" onChange={(event) => {
                  setModo(event.target.value);
                  setResultado(null);
                }}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {operationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Si dejas vacío un almacén opcional, el backend usará <strong>ALMACÉN PRINCIPAL</strong>.
            </div>
          </div>

          {!["liberarReserva", "despacharReserva"].includes(modo) && (
            <ProductoSearchField
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
            />
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {!["liberarReserva", "despacharReserva"].includes(modo) && (
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.cantidad}
                name="inventario-operaciones-page-input-237" onChange={(event) => setField("cantidad", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Cantidad"
                required
              />
            )}

            {["cargaInicial", "ajuste", "reserva"].includes(modo) && (
              <input
                type="number"
                min="1"
                value={form.almacenId}
                name="inventario-operaciones-page-input-250" onChange={(event) => setField("almacenId", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Almacén ID"
              />
            )}

            {["entrada", "transferencia"].includes(modo) && (
              <input
                type="number"
                min="1"
                value={form.almacenDestinoId}
                name="inventario-operaciones-page-input-261" onChange={(event) => setField("almacenDestinoId", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Almacén destino ID"
                required={modo === "transferencia"}
              />
            )}

            {["salida", "transferencia"].includes(modo) && (
              <input
                type="number"
                min="1"
                value={form.almacenOrigenId}
                name="inventario-operaciones-page-input-273" onChange={(event) => setField("almacenOrigenId", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Almacén origen ID"
                required
              />
            )}

            {modo === "ajuste" && (
              <select
                value={form.direccionAjuste}
                name="inventario-operaciones-page-select-285" onChange={(event) => setField("direccionAjuste", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
              >
                <option value="INCREMENTO">INCREMENTO</option>
                <option value="DECREMENTO">DECREMENTO</option>
              </select>
            )}

            {["liberarReserva", "despacharReserva"].includes(modo) && (
              <input
                type="number"
                min="1"
                value={form.reservaId}
                name="inventario-operaciones-page-input-296" onChange={(event) => setField("reservaId", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Reserva ID"
                required
              />
            )}

            {modo === "despacharReserva" && (
              <input
                type="text"
                value={form.codigoNotaSalida}
                name="inventario-operaciones-page-input-308" onChange={(event) => setField("codigoNotaSalida", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Código nota salida (opcional)"
              />
            )}

            <select
              value={form.areaId}
              name="inventario-operaciones-page-select-317" onChange={(event) => setField("areaId", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Área (opcional)</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={form.fechaMovimiento}
              name="inventario-operaciones-page-input-330" onChange={(event) => setField("fechaMovimiento", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />

            <input
              type="date"
              value={form.fechaDocumento}
              name="inventario-operaciones-page-input-337" onChange={(event) => setField("fechaDocumento", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />

            <input
              type="text"
              value={form.subtipoMovimiento}
              name="inventario-operaciones-page-input-344" onChange={(event) => setField("subtipoMovimiento", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Subtipo movimiento (opcional)"
            />
            <input
              type="text"
              value={form.referenciaTipo}
              name="inventario-operaciones-page-input-351" onChange={(event) => setField("referenciaTipo", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Referencia tipo"
            />
            <input
              type="number"
              min="1"
              value={form.referenciaId}
              name="inventario-operaciones-page-input-358" onChange={(event) => setField("referenciaId", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Referencia ID"
            />
            <input
              type="text"
              value={form.referenciaCodigo}
              name="inventario-operaciones-page-input-366" onChange={(event) => setField("referenciaCodigo", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Referencia código"
            />
          </div>

          <textarea
            value={form.observaciones}
            name="inventario-operaciones-page-textarea-375" onChange={(event) => setField("observaciones", event.target.value)}
            rows="3"
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Observaciones"
          />

          <button
            type="submit"
            disabled={inventario.loading}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {inventario.loading ? "Procesando..." : "Registrar operación"}
          </button>
        </form>
      )}

      {resultado && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Resultado
          </h2>
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            {resultado.reserva?.id ? (
              <Link
                to={`/inventario-reservas/${resultado.reserva.id}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Abrir reserva
              </Link>
            ) : null}
            {resultado.notaSalida?.id ? (
              <Link
                to={`/inventario-notas-salida/${resultado.notaSalida.id}`}
                className="font-medium text-slate-600 hover:text-slate-700"
              >
                Abrir nota de salida
              </Link>
            ) : null}
          </div>
          <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-xs text-gray-700">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default InventarioOperacionesPage;
