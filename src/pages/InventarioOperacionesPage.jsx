import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canAdjustInventoryEffective,
  canOperateInventoryEffective,
} from "../accessRules";
import ProductoSearchField from "../components/ProductoSearchField";
import useAreas from "../hooks/useAreas";
import useInventario from "../hooks/useInventario";
import { useAuth } from "../context/authContext";
import { esProductoControlIndividual } from "../utils/productoControlInventario";

const operationOptions = [
  { value: "transferencia", label: "Transferencia entre almacenes" },
  { value: "liberarReserva", label: "Liberar reserva" },
];

const initialForm = {
  cantidad: "",
  almacenOrigenId: "",
  almacenDestinoId: "",
  areaId: "",
  fechaMovimiento: "",
  subtipoMovimiento: "",
  referenciaTipo: "",
  referenciaId: "",
  referenciaCodigo: "",
  observaciones: "",
  reservaId: "",
};

const operationLabels = {
  transferencia: "transferencia",
  liberarReserva: "liberación de reserva",
};

const InventarioOperacionesPage = () => {
  const { user } = useAuth();
  const { areas } = useAreas();
  const inventario = useInventario();
  const [modo, setModo] = useState("transferencia");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [resultado, setResultado] = useState(null);

  const canOperate = canOperateInventoryEffective(user);
  const canAdjust = canAdjustInventoryEffective(user);
  const requiereUnidadesFisicas =
    modo === "transferencia" && esProductoControlIndividual(selectedProduct);

  const canSubmit = useMemo(() => canOperate, [canOperate]);

  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const buildCommonPayload = () => ({
    cantidad: form.cantidad ? Number(form.cantidad) : undefined,
    areaId: form.areaId || undefined,
    fechaMovimiento: form.fechaMovimiento || undefined,
    subtipoMovimiento: form.subtipoMovimiento || undefined,
    referenciaTipo: form.referenciaTipo || undefined,
    referenciaId: form.referenciaId || undefined,
    referenciaCodigo: form.referenciaCodigo || undefined,
    observaciones: form.observaciones || undefined,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      let response;
      const payload = buildCommonPayload();

      if (requiereUnidadesFisicas) {
        throw new Error(
          "Transfiere los bienes individualizados desde su ficha para seleccionar las unidades físicas concretas.",
        );
      }

      if (modo === "transferencia") {
        if (!selectedProduct?.id) {
          throw new Error("Debes seleccionar un producto.");
        }
        response = await inventario.registrarTransferencia({
          ...payload,
          productoId: selectedProduct.id,
          almacenOrigenId: form.almacenOrigenId || undefined,
          almacenDestinoId: form.almacenDestinoId || undefined,
        });
      } else if (modo === "liberarReserva") {
        if (!form.reservaId) {
          throw new Error("Debes indicar el ID de la reserva.");
        }
        response = await inventario.liberarReserva(form.reservaId, {
          cantidad: form.cantidad ? Number(form.cantidad) : undefined,
          observaciones: form.observaciones || undefined,
        });
      } else {
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Operaciones complementarias de inventario
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Las entradas se formalizan con Nota de Ingreso; las entregas,
            definitivas o temporales, nacen de una Nota de Pedido y generan su
            Nota de Salida. Esta página conserva únicamente transferencias y
            liberaciones de reserva.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/modulo-almacen/recepcion-oc"
            className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Notas de Ingreso
          </Link>
          <Link
            to="/modulo-almacen/prestamos"
            className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
          >
            Préstamos
          </Link>
          {canAdjust ? (
            <Link
              to="/modulo-almacen/ajustes-inventario"
              className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Ajustes de Inventario
            </Link>
          ) : null}
        </div>
      </div>

      {!canSubmit ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Tu usuario no tiene autorización operativa para ejecutar movimientos
          de inventario.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-4 shadow"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de operación
              </span>
              <select
                value={modo}
                onChange={(event) => {
                  setModo(event.target.value);
                  setResultado(null);
                  setSelectedProduct(null);
                }}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {operationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Una transferencia cambia la ubicación del stock: disminuye el
              almacén de origen y aumenta el de destino, sin alterar el total
              institucional.
            </div>
          </div>

          {modo === "transferencia" ? (
            <ProductoSearchField
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
            />
          ) : null}

          {requiereUnidadesFisicas ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Este producto requiere seleccionar las series concretas. Realiza
              la transferencia desde{" "}
              <Link
                to="/modulo-almacen/bienes-individualizados"
                className="font-semibold underline"
              >
                Bienes individualizados
              </Link>
              .
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.cantidad}
              onChange={(event) => setField("cantidad", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder={
                modo === "liberarReserva" ? "Cantidad (opcional)" : "Cantidad"
              }
              required={modo === "transferencia"}
            />

            {modo === "transferencia" ? (
              <>
                <input
                  type="number"
                  min="1"
                  value={form.almacenOrigenId}
                  onChange={(event) =>
                    setField("almacenOrigenId", event.target.value)
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Almacén origen ID"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={form.almacenDestinoId}
                  onChange={(event) =>
                    setField("almacenDestinoId", event.target.value)
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Almacén destino ID"
                  required
                />
              </>
            ) : (
              <input
                type="number"
                min="1"
                value={form.reservaId}
                onChange={(event) => setField("reservaId", event.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Reserva ID"
                required
              />
            )}

            <select
              value={form.areaId}
              onChange={(event) => setField("areaId", event.target.value)}
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
              onChange={(event) =>
                setField("fechaMovimiento", event.target.value)
              }
              className="rounded border border-gray-300 px-3 py-2"
            />
            <input
              type="text"
              value={form.referenciaTipo}
              onChange={(event) => setField("referenciaTipo", event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Referencia tipo"
            />
            <input
              type="text"
              value={form.referenciaCodigo}
              onChange={(event) =>
                setField("referenciaCodigo", event.target.value)
              }
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Referencia código"
            />
          </div>

          <textarea
            value={form.observaciones}
            onChange={(event) => setField("observaciones", event.target.value)}
            rows="3"
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Observaciones"
          />

          <button
            type="submit"
            disabled={inventario.loading || requiereUnidadesFisicas}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {inventario.loading
              ? "Procesando…"
              : requiereUnidadesFisicas
                ? "Selecciona las unidades físicas"
                : "Registrar operación"}
          </button>
        </form>
      )}

      {resultado ? (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Resultado</h2>
          {resultado.reserva?.id ? (
            <Link
              to={`/inventario-reservas/${resultado.reserva.id}`}
              className="mb-4 inline-block font-medium text-blue-600 hover:text-blue-700"
            >
              Abrir reserva
            </Link>
          ) : null}
          <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-xs text-gray-700">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
};

export default InventarioOperacionesPage;
