import { useEffect, useMemo, useReducer, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProductoSearchField from "../components/ProductoSearchField";
import { useAuth } from "../context/authContext";
import useInventario from "../hooks/useInventario";
import usePedidosInternos from "../hooks/usePedidosInternos";
import {
  canApprovePedidoInterno,
  canViewWarehouseTray,
} from "../utils/inventarioPermissions";

const initialState = {
  almacenId: "",
  observaciones: "",
  lineaCantidad: "",
  lineaObservaciones: "",
  lineas: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "addLine":
      return {
        ...state,
        lineas: [...state.lineas, action.linea],
        lineaCantidad: "",
        lineaObservaciones: "",
      };
    case "removeLine":
      return {
        ...state,
        lineas: state.lineas.filter(
          (linea) => linea.productoId !== action.productoId
        ),
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
};

const getAlmacenDisponible = (stockProducto, almacenId) =>
  (stockProducto?.almacenes || []).find(
    (almacen) => String(almacen.id) === String(almacenId)
  );

const CrearNotaPedidoPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inventario = useInventario();
  const pedidosInternos = usePedidosInternos();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stockRows, setStockRows] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockProducto, setStockProducto] = useState(null);
  const [loadingProductStock, setLoadingProductStock] = useState(false);

  const canApprove = canApprovePedidoInterno(user);
  const canUseWarehouseTray = canViewWarehouseTray(user);

  const cargarStockBase = async () => {
    try {
      const data = await inventario.obtenerStock();
      setStockRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el stock base.");
      setStockRows([]);
    }
  };

  useEffect(() => {
    cargarStockBase();
  }, []);

  useEffect(() => {
    if (!selectedProduct?.id) {
      setStockProducto(null);
      return;
    }

    let cancelled = false;

    const fetchStockProducto = async () => {
      setLoadingProductStock(true);
      try {
        const data = await inventario.obtenerStockPorProducto(selectedProduct.id);
        if (!cancelled) {
          setStockProducto(data);
        }
      } catch (error) {
        if (!cancelled) {
          setStockProducto(null);
          toast.error(error.message || "No se pudo consultar el stock del producto.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProductStock(false);
        }
      }
    };

    fetchStockProducto();
    return () => {
      cancelled = true;
    };
  }, [selectedProduct?.id]);

  const almacenes = useMemo(() => {
    const map = new Map();
    stockRows.forEach((row) => {
      (row.almacenes || []).forEach((almacen) => {
        map.set(String(almacen.id), almacen);
      });
    });
    return Array.from(map.values());
  }, [stockRows]);

  const almacenSeleccionado = useMemo(
    () => getAlmacenDisponible(stockProducto, state.almacenId),
    [stockProducto, state.almacenId]
  );

  const cantidadSolicitada = Number(state.lineaCantidad || 0);
  const cantidadExcedeDisponible =
    !!almacenSeleccionado &&
    Number.isFinite(cantidadSolicitada) &&
    cantidadSolicitada > Number(almacenSeleccionado.cantidadDisponible || 0);

  const handleAddLine = () => {
    if (!state.almacenId) {
      toast.error("Debes seleccionar un almacen antes de agregar lineas.");
      return;
    }

    if (!selectedProduct?.id) {
      toast.error("Debes seleccionar un producto.");
      return;
    }

    const cantidad = Number(state.lineaCantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      toast.error("La cantidad solicitada debe ser mayor que cero.");
      return;
    }

    if (!almacenSeleccionado) {
      toast.error("El producto no tiene stock visible en el almacen seleccionado.");
      return;
    }

    if (cantidad > Number(almacenSeleccionado.cantidadDisponible || 0)) {
      toast.error("La cantidad solicitada no puede superar el stock disponible real.");
      return;
    }

    if (state.lineas.some((linea) => linea.productoId === selectedProduct.id)) {
      toast.error("Ese producto ya fue agregado a la nota.");
      return;
    }

    dispatch({
      type: "addLine",
      linea: {
        productoId: selectedProduct.id,
        producto: selectedProduct,
        cantidadSolicitada: cantidad,
        observaciones: state.lineaObservaciones.trim() || null,
        stockDisponible: Number(almacenSeleccionado.cantidadDisponible || 0),
      },
    });

    setSelectedProduct(null);
    setStockProducto(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!state.almacenId) {
      toast.error("Debes seleccionar un almacen.");
      return;
    }

    if (state.lineas.length === 0) {
      toast.error("Debes agregar al menos una linea a la nota.");
      return;
    }

    try {
      const response = await pedidosInternos.crearPedido({
        almacenId: Number(state.almacenId),
        observaciones: state.observaciones || undefined,
        items: state.lineas.map((linea) => ({
          productoId: linea.productoId,
          cantidadSolicitada: linea.cantidadSolicitada,
          observaciones: linea.observaciones || undefined,
        })),
      });

      const estado = response?.estadoFlujo;
      if (estado === "PENDIENTE_APROBACION") {
        toast.success(
          "La nota de pedido fue creada. Aun no reserva stock porque queda pendiente de aprobacion."
        );
      } else {
        toast.success(
          "La nota de pedido fue creada y quedo aprobada. El stock ya quedo reservado temporalmente."
        );
      }

      dispatch({ type: "reset" });
      setSelectedProduct(null);
      setStockProducto(null);
      await cargarStockBase();

      if (response?.id) {
        navigate(`/notas-pedido/${response.id}`);
      }
    } catch (error) {
      toast.error(error.message || "No se pudo crear la nota de pedido.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nueva Nota de Pedido</h1>
          <p className="mt-1 text-sm text-slate-600">
            Solicita solo lo que esta realmente disponible en stock. Si necesitas
            mas, usa el flujo de requerimiento por separado.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventario-stock"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver stock
          </Link>
          <Link
            to="/notas-pedido"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver notas
          </Link>
          {canApprove && (
            <Link
              to="/notas-pedido/aprobaciones"
              className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              Bandeja de aprobacion
            </Link>
          )}
          {canUseWarehouseTray && (
            <Link
              to="/notas-pedido/almacen"
              className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Bandeja de almacen
            </Link>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Si la nota la crea un operador, quedara pendiente de aprobacion y aun no
        reservara stock. Si la crea un jefe o gerente, puede quedar aprobada de forma inmediata segun el backend.
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-lg bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="nota-pedido-almacen-id" className="mb-1 block text-sm font-medium text-slate-700">
                Almacen de despacho
              </label>
              <select
                id="nota-pedido-almacen-id"
                value={state.almacenId}
                name="crear-nota-pedido-page-select-282"
                onChange={(event) =>
                  dispatch({
                    type: "setField",
                    field: "almacenId",
                    value: event.target.value,
                  })
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Selecciona un almacen</option>
                {almacenes.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.codigo} - {almacen.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nota-pedido-observaciones" className="mb-1 block text-sm font-medium text-slate-700">
                Observaciones generales
              </label>
              <input
                id="nota-pedido-observaciones"
                type="text"
                value={state.observaciones}
                name="crear-nota-pedido-page-input-306"
                onChange={(event) =>
                  dispatch({
                    type: "setField",
                    field: "observaciones",
                    value: event.target.value,
                  })
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
                placeholder="Uso interno del area, destino o comentario"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Agregar lineas
          </h2>
          <div className="space-y-4">
            <ProductoSearchField
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
              label="Producto o material"
            />

            {selectedProduct && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded bg-white p-3 text-sm">
                    <span className="block text-slate-500">Stock actual</span>
                    <strong>{stockProducto?.totalActual ?? "-"}</strong>
                  </div>
                  <div className="rounded bg-white p-3 text-sm">
                    <span className="block text-slate-500">Reservado</span>
                    <strong>{stockProducto?.totalReservada ?? "-"}</strong>
                  </div>
                  <div className="rounded bg-white p-3 text-sm">
                    <span className="block text-slate-500">Disponible</span>
                    <strong>{stockProducto?.totalDisponible ?? "-"}</strong>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={state.lineaCantidad}
                    name="crear-nota-pedido-page-input-352"
                    onChange={(event) =>
                      dispatch({
                        type: "setField",
                        field: "lineaCantidad",
                        value: event.target.value,
                      })
                    }
                    className="rounded border border-slate-300 px-3 py-2"
                    placeholder="Cantidad solicitada"
                  />
                  <input
                    type="text"
                    value={state.lineaObservaciones}
                    name="crear-nota-pedido-page-input-367"
                    onChange={(event) =>
                      dispatch({
                        type: "setField",
                        field: "lineaObservaciones",
                        value: event.target.value,
                      })
                    }
                    className="rounded border border-slate-300 px-3 py-2"
                    placeholder="Observacion de la linea"
                  />
                  <button
                    type="button"
                    onClick={handleAddLine}
                    disabled={loadingProductStock}
                    className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {loadingProductStock ? "Consultando..." : "Agregar linea"}
                  </button>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  {state.almacenId && almacenSeleccionado ? (
                    <span>
                      Disponible en almacen seleccionado:{" "}
                      <strong>{almacenSeleccionado.cantidadDisponible}</strong>
                    </span>
                  ) : (
                    <span>Selecciona un almacen para validar el disponible real.</span>
                  )}
                </div>

                {cantidadExcedeDisponible && (
                  <div className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    La cantidad ingresada supera el stock disponible real del almacen seleccionado.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Lineas de la nota
            </h2>
            <span className="text-sm text-slate-500">
              {state.lineas.length} linea(s)
            </span>
          </div>

          {state.lineas.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aun no agregaste productos a la nota.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-left">Disponible</th>
                    <th className="px-3 py-2 text-left">Solicitada</th>
                    <th className="px-3 py-2 text-left">Observaciones</th>
                    <th className="px-3 py-2 text-left">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {state.lineas.map((linea) => (
                    <tr key={linea.productoId} className="border-t border-slate-200">
                      <td className="px-3 py-2">
                        {linea.producto.codigo} - {linea.producto.nombre}
                      </td>
                      <td className="px-3 py-2">{linea.stockDisponible}</td>
                      <td className="px-3 py-2">{linea.cantidadSolicitada}</td>
                      <td className="px-3 py-2">{linea.observaciones || "-"}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "removeLine",
                              productoId: linea.productoId,
                            })
                          }
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pedidosInternos.loading}
            className="rounded bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
          >
            {pedidosInternos.loading ? "Guardando..." : "Crear nota de pedido"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearNotaPedidoPage;
