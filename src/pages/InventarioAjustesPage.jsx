import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDown, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import ProductoSearchField from "../components/ProductoSearchField";
import useAlmacenes from "../hooks/useAlmacenes";
import useInventario from "../hooks/useInventario";
import { getBienInventarioLabel } from "../utils/bienesInventarioDespacho";
import { normalizeBienInventarioListResponse } from "../utils/bienInventarioTrazabilidad";
import { esProductoControlIndividual } from "../utils/productoControlInventario";

const CAUSALES = [
  ["ROBO_EN_ALMACEN", "Robo dentro del almacén"],
  ["PERDIDA_EN_CUSTODIA", "Pérdida durante la custodia"],
  ["DETERIORO_EN_ALMACEN", "Deterioro dentro del almacén"],
  [
    "DIFERENCIA_NEGATIVA_INVENTARIO_FISICO",
    "Diferencia negativa de inventario físico",
  ],
  [
    "DIFERENCIA_POSITIVA_INVENTARIO_FISICO",
    "Diferencia positiva de inventario físico",
  ],
  ["SINIESTRO", "Siniestro del almacén"],
  ["CORRECCION_AUTORIZADA", "Corrección autorizada"],
  ["OTRO", "Otro"],
];

const todayInput = () => new Date().toISOString().slice(0, 10);

const openBlob = ({ blob }) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const InventarioAjustesPage = () => {
  const {
    loading,
    emitirAjusteInventario,
    obtenerAjustesInventario,
    obtenerBienesInventario,
    obtenerAjusteInventarioPdfBlob,
    obtenerSustentoAjusteInventarioBlob,
  } = useInventario();
  const { almacenes, obtenerAlmacenes } = useAlmacenes();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [almacenId, setAlmacenId] = useState("");
  const [tipoAjuste, setTipoAjuste] = useState("NEGATIVO");
  const [causal, setCausal] = useState("ROBO_EN_ALMACEN");
  const [causalOtro, setCausalOtro] = useState("");
  const [descripcionHechos, setDescripcionHechos] = useState("");
  const [tipoDocumentoSustento, setTipoDocumentoSustento] = useState("");
  const [numeroDocumentoSustento, setNumeroDocumentoSustento] = useState("");
  const [fechaDocumentoSustento, setFechaDocumentoSustento] = useState(todayInput());
  const [documentoSustento, setDocumentoSustento] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [detalles, setDetalles] = useState([]);
  const [ajustes, setAjustes] = useState([]);

  const cargarAjustes = useCallback(async () => {
    try {
      const response = await obtenerAjustesInventario({ page: 1, limit: 20 });
      setAjustes(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error.message || "No se pudieron cargar los ajustes emitidos.");
    }
  }, [obtenerAjustesInventario]);

  useEffect(() => {
    obtenerAlmacenes({ estado: "activos" }).catch(() => {});
    cargarAjustes();
  }, [cargarAjustes, obtenerAlmacenes]);

  useEffect(() => {
    if (tipoAjuste === "POSITIVO") {
      if (
        [
          "ROBO_EN_ALMACEN",
          "PERDIDA_EN_CUSTODIA",
          "DETERIORO_EN_ALMACEN",
          "DIFERENCIA_NEGATIVA_INVENTARIO_FISICO",
          "SINIESTRO",
        ].includes(causal)
      ) {
        setCausal("DIFERENCIA_POSITIVA_INVENTARIO_FISICO");
      }
    } else if (causal === "DIFERENCIA_POSITIVA_INVENTARIO_FISICO") {
      setCausal("DIFERENCIA_NEGATIVA_INVENTARIO_FISICO");
    }
  }, [causal, tipoAjuste]);

  const total = useMemo(
    () => detalles.reduce((sum, item) => sum + Number(item.cantidad || 0), 0),
    [detalles],
  );

  const addProduct = () => {
    if (!selectedProduct?.id) {
      toast.info("Selecciona un producto.");
      return;
    }
    if (detalles.some((item) => Number(item.producto.id) === Number(selectedProduct.id))) {
      toast.info("El producto ya fue agregado.");
      return;
    }
    if (tipoAjuste === "POSITIVO" && esProductoControlIndividual(selectedProduct)) {
      toast.info(
        "El incremento de un producto individualizado se registra mediante Nota de Ingreso de regularización con sus series.",
      );
      return;
    }
    setDetalles((current) => [
      ...current,
      {
        producto: selectedProduct,
        cantidad: "",
        bienInventarioIds: [],
        unidadesDisponibles: [],
        loadingUnidades: false,
        observaciones: "",
      },
    ]);
    setSelectedProduct(null);
  };

  const updateDetail = (index, patch) => {
    setDetalles((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const cargarUnidades = async (index) => {
    const detalle = detalles[index];
    if (!almacenId) {
      toast.info("Selecciona primero el almacén.");
      return;
    }
    updateDetail(index, { loadingUnidades: true });
    try {
      const response = await obtenerBienesInventario({
        productoId: detalle.producto.id,
        almacenId,
        estado: "DISPONIBLE",
        page: 1,
        limit: 100,
      });
      updateDetail(index, {
        loadingUnidades: false,
        unidadesDisponibles: normalizeBienInventarioListResponse(response).data,
      });
    } catch (error) {
      updateDetail(index, { loadingUnidades: false, unidadesDisponibles: [] });
      toast.error(error.message || "No se pudieron cargar las unidades disponibles.");
    }
  };

  const toggleUnidad = (index, id) => {
    const current = new Set(detalles[index].bienInventarioIds || []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    updateDetail(index, {
      bienInventarioIds: [...current],
      cantidad: String(current.size),
    });
  };

  const validate = () => {
    if (!almacenId) return "Selecciona el almacén.";
    if (!descripcionHechos.trim() || descripcionHechos.trim().length < 10) {
      return "Describe detalladamente los hechos.";
    }
    if (causal === "OTRO" && causalOtro.trim().length < 3) {
      return "Especifica la causal del ajuste.";
    }
    if (!detalles.length) return "Agrega al menos un producto.";
    if (!tipoDocumentoSustento.trim()) return "Indica el tipo de sustento.";
    if (!documentoSustento) return "Adjunta el documento sustentatorio.";
    for (const detalle of detalles) {
      const cantidad = Number(detalle.cantidad || 0);
      if (!(cantidad > 0)) return `Indica la cantidad de ${detalle.producto.nombre}.`;
      if (
        tipoAjuste === "NEGATIVO" &&
        esProductoControlIndividual(detalle.producto) &&
        detalle.bienInventarioIds.length !== cantidad
      ) {
        return `Selecciona exactamente ${cantidad} unidad(es) de ${detalle.producto.nombre}.`;
      }
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    try {
      const ajuste = await emitirAjusteInventario({
        almacenId: Number(almacenId),
        tipoAjuste,
        causal,
        causalOtro: causal === "OTRO" ? causalOtro.trim() : undefined,
        descripcionHechos: descripcionHechos.trim(),
        tipoDocumentoSustento: tipoDocumentoSustento.trim(),
        numeroDocumentoSustento: numeroDocumentoSustento.trim() || undefined,
        fechaDocumentoSustento,
        observaciones: observaciones.trim() || undefined,
        documentoSustento,
        detalles: detalles.map((detalle) => ({
          productoId: detalle.producto.id,
          cantidad: Number(detalle.cantidad),
          bienInventarioIds: detalle.bienInventarioIds,
          observaciones: detalle.observaciones.trim() || undefined,
        })),
      });
      toast.success(`Se emitió el Ajuste de Inventario ${ajuste.codigo}.`);
      setDetalles([]);
      setDescripcionHechos("");
      setCausalOtro("");
      setTipoDocumentoSustento("");
      setNumeroDocumentoSustento("");
      setDocumentoSustento(null);
      setObservaciones("");
      await cargarAjustes();
    } catch (error) {
      toast.error(error.message || "No se pudo emitir el Ajuste de Inventario.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Ajustes de Inventario
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Documento formal para diferencias o incidencias sobre bienes que aún
          permanecen bajo custodia del almacén.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          El stock se modificará únicamente al emitir este documento. Para
          productos individualizados, un ajuste positivo debe registrarse como
          Nota de Ingreso de regularización con sus series.
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Almacén *</span>
            <select
              value={almacenId}
              onChange={(event) => {
                setAlmacenId(event.target.value);
                setDetalles((current) =>
                  current.map((item) => ({
                    ...item,
                    bienInventarioIds: [],
                    unidadesDisponibles: [],
                    cantidad: esProductoControlIndividual(item.producto)
                      ? ""
                      : item.cantidad,
                  })),
                );
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            >
              <option value="">Seleccionar</option>
              {almacenes.map((almacen) => (
                <option key={almacen.id} value={almacen.id}>
                  {almacen.codigo} - {almacen.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Tipo *</span>
            <select
              value={tipoAjuste}
              onChange={(event) => {
                setTipoAjuste(event.target.value);
                setDetalles([]);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="NEGATIVO">Ajuste negativo</option>
              <option value="POSITIVO">Ajuste positivo</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Causal *</span>
            <select
              value={causal}
              onChange={(event) => setCausal(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {CAUSALES.filter(([value]) =>
                tipoAjuste === "POSITIVO"
                  ? ![
                      "ROBO_EN_ALMACEN",
                      "PERDIDA_EN_CUSTODIA",
                      "DETERIORO_EN_ALMACEN",
                      "DIFERENCIA_NEGATIVA_INVENTARIO_FISICO",
                      "SINIESTRO",
                    ].includes(value)
                  : value !== "DIFERENCIA_POSITIVA_INVENTARIO_FISICO",
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {causal === "OTRO" ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Especifique la causal *
            </span>
            <input
              value={causalOtro}
              onChange={(event) => setCausalOtro(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              maxLength={300}
              required
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Descripción detallada de los hechos *
          </span>
          <textarea
            value={descripcionHechos}
            onChange={(event) => setDescripcionHechos(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={4}
            maxLength={2000}
            required
          />
        </label>

        <section className="rounded-xl border border-slate-200 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
            <ProductoSearchField
              label="Agregar producto"
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
            />
            <button
              type="button"
              onClick={addProduct}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {detalles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aún no se agregaron productos.
              </div>
            ) : (
              detalles.map((detalle, index) => {
                const individual = esProductoControlIndividual(detalle.producto);
                return (
                  <div key={detalle.producto.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {detalle.producto.codigo} - {detalle.producto.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {individual ? "Control individual" : "Control por cantidad"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDetalles((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                        className="rounded p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[180px,1fr]">
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                          Cantidad *
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step={individual ? "1" : "0.01"}
                          value={detalle.cantidad}
                          readOnly={individual && tipoAjuste === "NEGATIVO"}
                          onChange={(event) => updateDetail(index, { cantidad: event.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                          Observación de línea
                        </span>
                        <input
                          value={detalle.observaciones}
                          onChange={(event) => updateDetail(index, { observaciones: event.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          maxLength={500}
                        />
                      </label>
                    </div>

                    {individual && tipoAjuste === "NEGATIVO" ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => cargarUnidades(index)}
                          disabled={detalle.loadingUnidades}
                          className="inline-flex items-center gap-2 rounded-lg border border-violet-300 px-3 py-2 text-sm font-medium text-violet-700 disabled:opacity-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {detalle.loadingUnidades ? "Consultando..." : "Cargar unidades disponibles"}
                        </button>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {detalle.unidadesDisponibles.map((bien) => {
                            const checked = detalle.bienInventarioIds.includes(bien.id);
                            return (
                              <label
                                key={bien.id}
                                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
                                  checked ? "border-violet-400 bg-violet-50" : "border-slate-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleUnidad(index, bien.id)}
                                  className="mt-1"
                                />
                                <span>{getBienInventarioLabel(bien)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Documento sustentatorio</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Tipo *</span>
              <input
                value={tipoDocumentoSustento}
                onChange={(event) => setTipoDocumentoSustento(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Acta, denuncia, informe..."
                required
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Número o código</span>
              <input
                value={numeroDocumentoSustento}
                onChange={(event) => setNumeroDocumentoSustento(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Fecha *</span>
              <input
                type="date"
                value={fechaDocumentoSustento}
                onChange={(event) => setFechaDocumentoSustento(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
          </div>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(event) => setDocumentoSustento(event.target.files?.[0] || null)}
            className="mt-4 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </section>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Observaciones generales</span>
          <textarea
            value={observaciones}
            onChange={(event) => setObservaciones(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={3}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">Cantidad total del documento: <strong>{total}</strong></p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Emitiendo..." : "Emitir Ajuste de Inventario"}
          </button>
        </div>
      </form>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ajustes emitidos</h2>
            <p className="mt-1 text-sm text-slate-600">Documentos recientes y sus sustentos.</p>
          </div>
          <button type="button" onClick={cargarAjustes} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            Actualizar
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Almacén</th>
                <th className="px-4 py-3 text-left">Tipo / causal</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ajustes.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No hay ajustes emitidos.</td></tr>
              ) : ajustes.map((ajuste) => (
                <tr key={ajuste.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-semibold">{ajuste.codigo}</td>
                  <td className="px-4 py-3">{ajuste.almacen?.nombre || "-"}</td>
                  <td className="px-4 py-3">{ajuste.tipoAjuste} · {ajuste.causal}</td>
                  <td className="px-4 py-3">{new Date(ajuste.fechaEmision).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={async () => openBlob(await obtenerAjusteInventarioPdfBlob(ajuste.id))} className="inline-flex items-center gap-1 text-indigo-700">
                        <FileDown className="h-4 w-4" /> PDF
                      </button>
                      <button type="button" onClick={async () => openBlob(await obtenerSustentoAjusteInventarioBlob(ajuste.id))} className="text-emerald-700">
                        Sustento
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default InventarioAjustesPage;
