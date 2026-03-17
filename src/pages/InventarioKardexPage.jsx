import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ProductoSearchField from "../components/ProductoSearchField";
import useInventario from "../hooks/useInventario";

const InventarioKardexPage = () => {
  const { loading, obtenerKardex } = useInventario();
  const [searchParams] = useSearchParams();
  const [producto, setProducto] = useState(
    searchParams.get("productoId")
      ? {
          id: Number(searchParams.get("productoId")),
          nombre: "Producto seleccionado",
          codigo: `ID ${searchParams.get("productoId")}`,
        }
      : null
  );
  const [filters, setFilters] = useState({
    almacenId: searchParams.get("almacenId") || "",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [kardex, setKardex] = useState(null);

  const consultarKardex = async (event) => {
    if (event) event.preventDefault();

    if (!producto?.id) {
      toast.error("Debes seleccionar un producto para consultar el kardex.");
      return;
    }

    try {
      const data = await obtenerKardex(producto.id, {
        almacenId: filters.almacenId || undefined,
        fechaDesde: filters.fechaDesde || undefined,
        fechaHasta: filters.fechaHasta || undefined,
      });
      setKardex(data);
    } catch (error) {
      toast.error(error.message || "No se pudo consultar el kardex.");
      setKardex(null);
    }
  };

  useEffect(() => {
    if (producto?.id) {
      consultarKardex();
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kardex por producto</h1>
          <p className="mt-1 text-sm text-gray-600">
            Consulta cronológica con saldo acumulado, documento, motivo, uso y área.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Dashboard
        </Link>
      </div>

      <form
        onSubmit={consultarKardex}
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-4"
      >
        <div className="md:col-span-2">
          <ProductoSearchField
            selectedProduct={producto}
            onSelect={setProducto}
            label="Producto"
          />
        </div>
        <div>
          <label htmlFor="kardex-almacen-id" className="mb-1 block text-sm font-medium text-gray-700">
            Almacén ID
          </label>
          <input
            id="kardex-almacen-id"
            type="number"
            min="1"
            value={filters.almacenId}
            name="inventario-kardex-page-input-85"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, almacenId: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Opcional"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Consultando..." : "Consultar kardex"}
          </button>
        </div>
        <div>
          <label htmlFor="kardex-fecha-desde" className="mb-1 block text-sm font-medium text-gray-700">
            Fecha desde
          </label>
          <input
            id="kardex-fecha-desde"
            type="date"
            value={filters.fechaDesde}
            name="inventario-kardex-page-input-109"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="kardex-fecha-hasta" className="mb-1 block text-sm font-medium text-gray-700">
            Fecha hasta
          </label>
          <input
            id="kardex-fecha-hasta"
            type="date"
            value={filters.fechaHasta}
            name="inventario-kardex-page-input-122"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </form>

      {kardex && (
        <>
          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {kardex.producto?.nombre}
              </h2>
              <p className="text-sm text-gray-600">
                {kardex.producto?.codigo} · {kardex.producto?.unidadMedida}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded bg-gray-50 px-3 py-2 text-sm">
                <span className="block text-gray-500">Saldo inicial</span>
                <strong>{kardex.resumen?.saldoInicial ?? 0}</strong>
              </div>
              <div className="rounded bg-green-50 px-3 py-2 text-sm">
                <span className="block text-gray-500">Entradas</span>
                <strong>{kardex.resumen?.totalEntradas ?? 0}</strong>
              </div>
              <div className="rounded bg-red-50 px-3 py-2 text-sm">
                <span className="block text-gray-500">Salidas</span>
                <strong>{kardex.resumen?.totalSalidas ?? 0}</strong>
              </div>
              <div className="rounded bg-indigo-50 px-3 py-2 text-sm">
                <span className="block text-gray-500">Saldo final</span>
                <strong>{kardex.resumen?.saldoFinal ?? 0}</strong>
              </div>
              <div className="rounded bg-yellow-50 px-3 py-2 text-sm">
                <span className="block text-gray-500">Stock actual</span>
                <strong>
                  {kardex.resumen?.stockActual?.cantidadActual ?? 0} / disp.{" "}
                  {kardex.resumen?.stockActual?.cantidadDisponible ?? 0}
                </strong>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Clase</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Uso</th>
                  <th className="px-4 py-3 text-left">Área</th>
                  <th className="px-4 py-3 text-left">Entrada</th>
                  <th className="px-4 py-3 text-left">Salida</th>
                  <th className="px-4 py-3 text-left">Saldo</th>
                  <th className="px-4 py-3 text-left">Documento</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {(kardex.movimientos || []).length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                      No hay movimientos para el filtro aplicado.
                    </td>
                  </tr>
                ) : (
                  kardex.movimientos.map((movimiento) => (
                    <tr key={movimiento.id} className="border-t align-top">
                      <td className="px-4 py-3">
                        {new Date(movimiento.fecha).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{movimiento.claseMovimiento}</td>
                      <td className="px-4 py-3">{movimiento.motivo || "-"}</td>
                      <td className="px-4 py-3">{movimiento.uso || "-"}</td>
                      <td className="px-4 py-3">
                        {movimiento.area?.nombre || movimiento.area || "-"}
                      </td>
                      <td className="px-4 py-3">{movimiento.entrada}</td>
                      <td className="px-4 py-3">{movimiento.salida}</td>
                      <td className="px-4 py-3">
                        {movimiento.saldoAnterior} → {movimiento.saldoPosterior}
                      </td>
                      <td className="px-4 py-3">
                        {movimiento.documento?.tipo || "-"}{" "}
                        {movimiento.documento?.codigo
                          ? `(${movimiento.documento.codigo})`
                          : ""}
                      </td>
                      <td className="px-4 py-3">
                        {movimiento.usuario?.nombre || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default InventarioKardexPage;
