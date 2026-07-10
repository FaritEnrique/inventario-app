// src/pages/InventarioRecepcionesPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { canOperateInventoryEffective } from "../accessRules";
import ProductoSearchField from "../components/ProductoSearchField";
import ValidarProductoTemporalModal from "../components/ValidarProductoTemporalModal";
import UnidadesInventarioEditor from "../components/inventario/UnidadesInventarioEditor";
import SkeletonSection from "../components/ui/skeletons/SkeletonSection";
import { useAuth } from "../context/authContext";
import useAreas from "../hooks/useAreas";
import useInventario from "../hooks/useInventario";
import useOrdenesCompra from "../hooks/useOrdenesCompra";
import {
  buildUnidadesInventarioPayload,
  esProductoIndividual,
  sincronizarUnidadesInventario,
  validateUnidadesInventario,
} from "../utils/bienesInventarioRecepcion";
import {
  buildRecepcionDraftFromOrdenCompra,
  findLineaOrdenCompra,
  getLineaProductoReal,
  getLineaProductoTemporal,
  getRecepcionPayloadItems,
  isLineaProductoTemporalPendiente,
  validateRecepcionDraft,
} from "../utils/recepcionOrdenCompraUi";

const DOCUMENTO_ENTREGA_TIPOS = [
  { value: "GUIA_REMISION", label: "Guía de remisión" },
  { value: "FACTURA", label: "Factura" },
  { value: "BOLETA", label: "Boleta" },
  { value: "OTRO", label: "Otro documento" },
];

const MAX_DOCUMENTOS_ENTREGA = 10;

const createDocumentoEntregaId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptyDocumentoEntrega = () => ({
  id: createDocumentoEntregaId(),
  tipoDocumento: "GUIA_REMISION",
  numeroDocumento: "",
  fechaDocumento: "",
  observaciones: "",
  file: null,
});

const createEmptySimpleForm = () => ({
  almacenDestinoId: "",
  areaId: "",
  fechaMovimiento: "",
  fechaDocumento: "",
  codigoNotaIngreso: "",
  cantidad: "",
  subtipoMovimiento: "NOTA_INGRESO",
  observaciones: "",
  referenciaTipo: "",
  referenciaId: "",
  referenciaCodigo: "",
  motivoSinDocumentacionEntrega: "",
  documentosEntrega: [],
  unidades: [],
});

const createEmptyOcForm = () => ({
  ordenCompraId: "",
  almacenDestinoId: "",
  areaId: "",
  fechaMovimiento: "",
  fechaDocumento: "",
  codigoNotaIngreso: "",
  observaciones: "",
  motivoSinDocumentacionEntrega: "",
  requiereConformidadGerencia: false,
  documentosEntrega: [createEmptyDocumentoEntrega()],
  items: [],
});

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const RECEPCION_ESTADOS_VALIDOS = new Set([
  "PENDIENTE_RECEPCION",
  "PARCIALMENTE_RECIBIDA",
]);
const ESTADO_APROBACION_RECEPCIONABLE = "APROBADA";

const hasDocumentoFile = (documento) => Boolean(documento?.file);

const hasDocumentoPartialData = (documento) =>
  Boolean(
    documento?.file ||
    documento?.numeroDocumento ||
    documento?.fechaDocumento ||
    documento?.observaciones,
  );

const getDocumentosEntregaConArchivo = (documentos = []) =>
  documentos.filter(hasDocumentoFile);

const validateDocumentosEntrega = ({
  documentosEntrega = [],
  required = false,
  motivoSinDocumentacionEntrega = "",
}) => {
  const documentosConArchivo =
    getDocumentosEntregaConArchivo(documentosEntrega);
  const documentosParcialesSinArchivo = documentosEntrega.filter(
    (documento) =>
      !hasDocumentoFile(documento) && hasDocumentoPartialData(documento),
  );
  const motivo = String(motivoSinDocumentacionEntrega || "").trim();

  if (documentosEntrega.length > MAX_DOCUMENTOS_ENTREGA) {
    return `Solo puedes adjuntar hasta ${MAX_DOCUMENTOS_ENTREGA} documentos sustentatorios.`;
  }

  if (documentosParcialesSinArchivo.length > 0) {
    return "Hay documentos con metadata registrada pero sin archivo adjunto. Adjunta el archivo o elimina la fila.";
  }

  if (documentosConArchivo.length === 0) {
    if (!motivo) {
      return required
        ? "Adjunta al menos un documento sustentatorio o registra el motivo excepcional por el cual no se cuenta con documentación de entrega."
        : "Si no adjuntas documentación sustentatoria, debes indicar el motivo.";
    }

    return "";
  }

  for (const [index, documento] of documentosConArchivo.entries()) {
    if (!documento.tipoDocumento) {
      return `Selecciona el tipo documental del documento ${index + 1}.`;
    }

    if (!documento.fechaDocumento) {
      return `Indica la fecha del documento sustentatorio ${index + 1}.`;
    }
  }

  return "";
};

const DocumentosEntregaSection = ({
  title,
  description,
  required = false,
  documentos = [],
  motivoSinDocumentacionEntrega = "",
  onDocumentoChange,
  onAddDocumento,
  onRemoveDocumento,
  onMotivoChange = () => {},
}) => {
  const canAddDocumento = documentos.length < MAX_DOCUMENTOS_ENTREGA;
  const documentosConArchivo = getDocumentosEntregaConArchivo(documentos);

  return (
    <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-indigo-950">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-indigo-800">
            {description}
          </p>
          <p className="mt-1 text-xs text-indigo-700">
            Documentos con archivo adjunto:{" "}
            <span className="font-semibold">{documentosConArchivo.length}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onAddDocumento}
          disabled={!canAddDocumento}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
        >
          Agregar documento
        </button>
      </div>

      <div
        className={`mt-4 rounded border p-3 ${
          required
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        <p className="text-xs leading-relaxed">
          {required
            ? "Para una recepción vinculada a Orden de Compra, adjunta al menos un documento sustentatorio. Si excepcionalmente no se cuenta con el archivo al momento de registrar la recepción, deja constancia del motivo."
            : "Si no adjuntas documento sustentatorio, el motivo es obligatorio."}
        </p>

        <label
          htmlFor={`recepcion-motivo-sin-documentacion-${
            required ? "oc" : "simple"
          }`}
          className="mt-3 mb-1 block text-xs font-semibold uppercase tracking-wide"
        >
          Motivo si no cuenta con documentación sustentatoria
        </label>
        <textarea
          id={`recepcion-motivo-sin-documentacion-${
            required ? "oc" : "simple"
          }`}
          value={motivoSinDocumentacionEntrega}
          onChange={(event) => onMotivoChange(event.target.value)}
          rows="2"
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          placeholder="Ejemplo: guía pendiente de entrega física, regularización autorizada, carga inicial de stock u otro motivo sustentado."
        />
      </div>

      <div className="mt-4 space-y-3">
        {documentos.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No hay documentos agregados.
          </div>
        ) : (
          documentos.map((documento, index) => (
            <article
              key={documento.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Documento sustentatorio {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() => onRemoveDocumento(index)}
                  disabled={required && documentos.length === 1}
                  className="self-start rounded border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <select
                  value={documento.tipoDocumento}
                  onChange={(event) =>
                    onDocumentoChange(
                      index,
                      "tipoDocumento",
                      event.target.value,
                    )
                  }
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {DOCUMENTO_ENTREGA_TIPOS.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={documento.numeroDocumento}
                  onChange={(event) =>
                    onDocumentoChange(
                      index,
                      "numeroDocumento",
                      event.target.value,
                    )
                  }
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Número de documento"
                />

                <input
                  type="date"
                  value={documento.fechaDocumento}
                  onChange={(event) =>
                    onDocumentoChange(
                      index,
                      "fechaDocumento",
                      event.target.value,
                    )
                  }
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                />

                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={(event) =>
                    onDocumentoChange(
                      index,
                      "file",
                      event.target.files?.[0] || null,
                    )
                  }
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <textarea
                value={documento.observaciones}
                onChange={(event) =>
                  onDocumentoChange(index, "observaciones", event.target.value)
                }
                rows="2"
                className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Observaciones del documento"
              />

              {documento.file ? (
                <p className="mt-2 text-xs text-slate-600">
                  Archivo seleccionado: {documento.file.name}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
};

const getOrdenCompraIdFromSearchParams = (searchParams) =>
  searchParams.get("ordenCompraId") || searchParams.get("ocId") || "";

const getOrdenCompraSearchFromSearchParams = (searchParams) =>
  searchParams.get("ordenCompraCodigo") ||
  searchParams.get("codigo") ||
  searchParams.get("search") ||
  searchParams.get("proveedor") ||
  "";

const getBlockingReasonForRecepcion = (ordenCompra) => {
  if (!ordenCompra) {
    return "No se pudo validar la orden de compra seleccionada.";
  }

  if (ordenCompra.estadoAprobacion !== ESTADO_APROBACION_RECEPCIONABLE) {
    return "La orden de compra aun no esta aprobada y por eso no puede recepcionarse.";
  }

  if (!RECEPCION_ESTADOS_VALIDOS.has(ordenCompra.estadoRecepcion)) {
    return `La orden de compra esta en estado ${ordenCompra.estadoRecepcion || "no disponible"} y ya no admite recepcion operativa.`;
  }

  if (Number(ordenCompra?.resumen?.totalPendiente || 0) <= 0) {
    return "La orden de compra ya no tiene saldo pendiente por recepcionar.";
  }

  return "";
};

const getNotaIngresoSuccessMessage = (response) => {
  const notaIngreso = response?.notaIngreso || {};
  const estadoDocumental =
    notaIngreso.estadoDocumentalFormal || notaIngreso.documentoFormal?.estado;
  const inventarioPosteado = Boolean(
    notaIngreso.inventarioPosteadoAt ||
      notaIngreso.inventarioPosteado ||
      response?.movimiento?.id ||
      (Array.isArray(response?.movimientos) && response.movimientos.length > 0),
  );

  if (inventarioPosteado) {
    return "Nota de Ingreso aprobada e ingresada a stock.";
  }

  if (estadoDocumental === "PENDIENTE_CONFORMIDAD_GERENCIA") {
    return "Nota de Ingreso registrada y pendiente de conformidad del gerente del área usuaria.";
  }

  if (estadoDocumental === "PENDIENTE_APROBACION_ALMACEN") {
    return "Nota de Ingreso registrada y pendiente de conformidad del jefe de almacén.";
  }

  return "Nota de Ingreso registrada. El stock disponible se actualizará cuando corresponda.";
};

const InventarioRecepcionesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const ordenCompraIdParam = getOrdenCompraIdFromSearchParams(searchParams);
  const ordenCompraSearchParam =
    getOrdenCompraSearchFromSearchParams(searchParams);
  const hasOrdenCompraQueryParam = Boolean(
    ordenCompraIdParam || ordenCompraSearchParam,
  );
  const { areas } = useAreas();
  const { loading, registrarIngresoPorNota } = useInventario();
  const {
    loading: ordenesCompraLoading,
    obtenerOrdenesCompra,
    obtenerOrdenCompraPorId,
  } = useOrdenesCompra();

  const [mode, setMode] = useState(() =>
    hasOrdenCompraQueryParam ? "ordenCompra" : "simple",
  );
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [simpleForm, setSimpleForm] = useState(createEmptySimpleForm);
  const [ocForm, setOcForm] = useState(createEmptyOcForm());
  const [resultado, setResultado] = useState(null);
  const [ordenesCompraDisponibles, setOrdenesCompraDisponibles] = useState([]);
  const [selectedOrdenCompra, setSelectedOrdenCompra] = useState(null);
  const [ordenesSearch, setOrdenesSearch] = useState(
    ordenCompraSearchParam || ordenCompraIdParam,
  );
  const [temporalLineToValidate, setTemporalLineToValidate] = useState(null);

  const canOperate = canOperateInventoryEffective(user);

  const handleSelectedProduct = (producto) => {
    const mantieneProductoActual =
      Number(selectedProduct?.id || 0) === Number(producto?.id || 0);

    setSelectedProduct(producto);
    setSimpleForm((prev) => ({
      ...prev,
      unidades: esProductoIndividual(producto)
        ? sincronizarUnidadesInventario(
            mantieneProductoActual ? prev.unidades : [],
            prev.cantidad,
          )
        : [],
    }));
  };

  const handleSimpleCantidadChange = (value) => {
    setSimpleForm((prev) => ({
      ...prev,
      cantidad: value,
      unidades: esProductoIndividual(selectedProduct)
        ? sincronizarUnidadesInventario(prev.unidades, value)
        : [],
    }));
  };

  const updateDocumentosEntrega = (setForm) => (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      documentosEntrega: prev.documentosEntrega.map(
        (documento, documentoIndex) =>
          documentoIndex === index
            ? {
                ...documento,
                [field]: value,
              }
            : documento,
      ),
    }));
  };

  const addDocumentoEntrega = (setForm) => {
    setForm((prev) => {
      if (prev.documentosEntrega.length >= MAX_DOCUMENTOS_ENTREGA) {
        toast.info(
          `Solo puedes adjuntar hasta ${MAX_DOCUMENTOS_ENTREGA} documentos sustentatorios.`,
        );
        return prev;
      }

      return {
        ...prev,
        documentosEntrega: [
          ...prev.documentosEntrega,
          createEmptyDocumentoEntrega(),
        ],
      };
    });
  };

  const removeDocumentoEntrega =
    (setForm, { required = false } = {}) =>
    (index) => {
      setForm((prev) => {
        if (required && prev.documentosEntrega.length <= 1) {
          return prev;
        }

        return {
          ...prev,
          documentosEntrega: prev.documentosEntrega.filter(
            (_documento, documentoIndex) => documentoIndex !== index,
          ),
        };
      });
    };

  const recepcionablesOrdenesCompra = useMemo(
    () =>
      ordenesCompraDisponibles.filter(
        (ordenCompra) => !getBlockingReasonForRecepcion(ordenCompra),
      ),
    [ordenesCompraDisponibles],
  );

  const pendingOrdenesCompra = useMemo(() => {
    const search = normalizeText(ordenesSearch);

    const filtered = recepcionablesOrdenesCompra.filter((ordenCompra) => {
      if (!search) {
        return true;
      }

      const codigo = normalizeText(ordenCompra.codigo);
      const proveedor = normalizeText(ordenCompra.proveedor?.razonSocial);
      const ruc = normalizeText(ordenCompra.proveedor?.ruc);
      return (
        codigo.includes(search) ||
        proveedor.includes(search) ||
        ruc.includes(search)
      );
    });

    if (!search) {
      return filtered;
    }

    const exactMatches = filtered.filter(
      (ordenCompra) => normalizeText(ordenCompra.codigo) === search,
    );

    return exactMatches.length > 0 ? exactMatches : filtered;
  }, [recepcionablesOrdenesCompra, ordenesSearch]);

  useEffect(() => {
    setResultado(null);
  }, [mode]);

  useEffect(() => {
    if (mode !== "ordenCompra" || !canOperate) {
      return;
    }

    let active = true;

    const loadOrdenesCompra = async () => {
      try {
        const response = await obtenerOrdenesCompra({
          limit: 200,
          includeInactive: false,
          estadoAprobacion: ESTADO_APROBACION_RECEPCIONABLE,
        });

        if (!active) {
          return;
        }

        setOrdenesCompraDisponibles(
          Array.isArray(response?.data) ? response.data : [],
        );
      } catch (error) {
        if (active) {
          toast.error(
            error.message ||
              "No se pudieron cargar las ordenes de compra recepcionables.",
          );
        }
      }
    };

    loadOrdenesCompra();

    return () => {
      active = false;
    };
  }, [canOperate, mode, obtenerOrdenesCompra]);

  const resetOcSelection = useCallback(() => {
    setSelectedOrdenCompra(null);
    setOcForm(createEmptyOcForm());
  }, []);

  const getPendingCurrentForItem = (itemOrdenCompraId) => {
    const line = selectedOrdenCompra?.items?.find(
      (currentItem) => String(currentItem.id) === String(itemOrdenCompraId),
    );
    return Number(line?.cantidadPendiente || 0);
  };

  const getPendingResultForDraft = (item) => {
    const pendingCurrent = getPendingCurrentForItem(item.itemOrdenCompraId);
    const cantidadAceptada = Number(item.cantidadAceptada || 0);
    return pendingCurrent - cantidadAceptada;
  };

  const refreshOrdenesCompra = async () => {
    const response = await obtenerOrdenesCompra({
      limit: 200,
      includeInactive: false,
      estadoAprobacion: ESTADO_APROBACION_RECEPCIONABLE,
    });

    setOrdenesCompraDisponibles(
      Array.isArray(response?.data) ? response.data : [],
    );
  };

  const reloadSelectedOrdenCompra = async (
    ordenCompraId = selectedOrdenCompra?.id,
  ) => {
    if (!ordenCompraId) {
      return null;
    }

    const ordenCompra = await obtenerOrdenCompraPorId(ordenCompraId);
    const pendingLines = (ordenCompra.items || []).filter(
      (item) => Number(item.cantidadPendiente || 0) > 0,
    );

    setSelectedOrdenCompra(ordenCompra);
    setOcForm((prev) => ({
      ...prev,
      ordenCompraId: String(ordenCompra.id),
      items: buildRecepcionDraftFromOrdenCompra({
        ...ordenCompra,
        items: pendingLines,
      }),
    }));
    return ordenCompra;
  };

  const handleTemporalResolved = async () => {
    try {
      setTemporalLineToValidate(null);
      await reloadSelectedOrdenCompra();
      await refreshOrdenesCompra();
    } catch (error) {
      toast.error(
        error.message ||
          "Producto validado, pero no se pudo refrescar la orden de compra.",
      );
    }
  };

  const handleSimpleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProduct?.id) {
      toast.error("Debes seleccionar un producto.");
      return;
    }

    const unidadesValidationMessage = validateUnidadesInventario({
      producto: selectedProduct,
      cantidad: Number(simpleForm.cantidad),
      unidades: simpleForm.unidades,
    });

    if (unidadesValidationMessage) {
      toast.error(unidadesValidationMessage);
      return;
    }

    const documentosValidationMessage = validateDocumentosEntrega({
      documentosEntrega: simpleForm.documentosEntrega,
      required: false,
      motivoSinDocumentacionEntrega: simpleForm.motivoSinDocumentacionEntrega,
    });

    if (documentosValidationMessage) {
      toast.error(documentosValidationMessage);
      return;
    }

    try {
      const payload = {
        productoId: selectedProduct.id,
        cantidad: Number(simpleForm.cantidad),
        almacenDestinoId: simpleForm.almacenDestinoId || undefined,
        areaId: simpleForm.areaId || undefined,
        fechaMovimiento: simpleForm.fechaMovimiento || undefined,
        fechaDocumento: simpleForm.fechaDocumento || undefined,
        codigoNotaIngreso: simpleForm.codigoNotaIngreso || undefined,
        subtipoMovimiento: simpleForm.subtipoMovimiento || undefined,
        observaciones: simpleForm.observaciones || undefined,
        motivoSinDocumentacionEntrega:
          simpleForm.motivoSinDocumentacionEntrega || undefined,
        documentosEntrega: getDocumentosEntregaConArchivo(
          simpleForm.documentosEntrega,
        ),
        referenciaTipo: simpleForm.referenciaTipo || undefined,
        referenciaId: simpleForm.referenciaId || undefined,
        referenciaCodigo: simpleForm.referenciaCodigo || undefined,
        unidades: esProductoIndividual(selectedProduct)
          ? buildUnidadesInventarioPayload(simpleForm.unidades)
          : [],
      };

      const response = await registrarIngresoPorNota(payload);
      setResultado(response);
      toast.success("Ingreso por nota registrado correctamente.");
      setSimpleForm(createEmptySimpleForm());
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la nota de ingreso.");
    }
  };

  const handleOcItemChange = (index, field, value) => {
    setOcForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field !== "cantidadAceptada") {
          return { ...item, [field]: value };
        }

        const linea = findLineaOrdenCompra(
          selectedOrdenCompra,
          item.itemOrdenCompraId,
        );
        const producto = getLineaProductoReal(linea);

        return {
          ...item,
          cantidadAceptada: value,
          unidades: esProductoIndividual(producto)
            ? sincronizarUnidadesInventario(item.unidades, value)
            : [],
        };
      }),
    }));
  };

  const handleOcUnidadesChange = (index, unidades) => {
    setOcForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, unidades } : item,
      ),
    }));
  };

  const handleOcItemSelectedChange = (index, checked) => {
    setOcForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const linea = findLineaOrdenCompra(
          selectedOrdenCompra,
          item.itemOrdenCompraId,
        );

        if (isLineaProductoTemporalPendiente(linea)) {
          return {
            ...item,
            selected: false,
            cantidadAceptada: "0",
            cantidadRechazada: "0",
            unidades: [],
          };
        }

        if (!checked) {
          return {
            ...item,
            selected: false,
            cantidadAceptada: "0",
            cantidadRechazada: "0",
            unidades: [],
          };
        }

        const cantidadAceptada =
          Number(item.cantidadAceptada || 0) > 0
            ? item.cantidadAceptada
            : String(Number(linea?.cantidadPendiente || 0));
        const producto = getLineaProductoReal(linea);

        return {
          ...item,
          selected: true,
          cantidadAceptada,
          cantidadRechazada: "0",
          unidades: esProductoIndividual(producto)
            ? sincronizarUnidadesInventario(item.unidades, cantidadAceptada)
            : [],
        };
      }),
    }));
  };

  const handleSelectOrdenCompra = useCallback(
    async (ordenCompraId) => {
      if (!ordenCompraId) {
        resetOcSelection();
        return;
      }

      try {
        const ordenCompra = await obtenerOrdenCompraPorId(ordenCompraId);
        const blockingReason = getBlockingReasonForRecepcion(ordenCompra);

        if (blockingReason) {
          resetOcSelection();
          toast.info(blockingReason);
          return;
        }

        const pendingLines = (ordenCompra.items || []).filter(
          (item) => Number(item.cantidadPendiente || 0) > 0,
        );

        if (!pendingLines.length) {
          resetOcSelection();
          toast.info("La orden seleccionada ya no tiene lineas pendientes.");
          return;
        }

        setSelectedOrdenCompra(ordenCompra);
        setOcForm((prev) => ({
          ...prev,
          ordenCompraId: String(ordenCompra.id),
          items: buildRecepcionDraftFromOrdenCompra({
            ...ordenCompra,
            items: pendingLines,
          }),
        }));
      } catch (error) {
        toast.error(
          error.message ||
            "No se pudo cargar el detalle de la orden de compra.",
        );
      }
    },
    [obtenerOrdenCompraPorId, resetOcSelection],
  );

  useEffect(() => {
    const nextOrdenCompraId = getOrdenCompraIdFromSearchParams(searchParams);
    const nextOrdenCompraSearch =
      getOrdenCompraSearchFromSearchParams(searchParams);

    if (!nextOrdenCompraId && !nextOrdenCompraSearch) {
      return;
    }

    setMode("ordenCompra");
    setResultado(null);
    setOrdenesSearch(nextOrdenCompraSearch || nextOrdenCompraId);

    if (!nextOrdenCompraId) {
      return;
    }

    if (String(selectedOrdenCompra?.id || "") === String(nextOrdenCompraId)) {
      return;
    }

    handleSelectOrdenCompra(nextOrdenCompraId);
  }, [handleSelectOrdenCompra, searchParams, selectedOrdenCompra?.id]);

  const handleOcSubmit = async (event) => {
    event.preventDefault();

    if (!selectedOrdenCompra?.id) {
      toast.error("Debes seleccionar una orden de compra.");
      return;
    }

    const validationMessage = validateRecepcionDraft(
      ocForm.items,
      selectedOrdenCompra,
    );

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const documentosValidationMessage = validateDocumentosEntrega({
      documentosEntrega: ocForm.documentosEntrega,
      required: true,
      motivoSinDocumentacionEntrega: ocForm.motivoSinDocumentacionEntrega,
    });

    if (documentosValidationMessage) {
      toast.error(documentosValidationMessage);
      return;
    }

    try {
      const payloadItems = getRecepcionPayloadItems(
        ocForm.items,
        selectedOrdenCompra,
      );
      const payload = {
        ordenCompraId: Number(ocForm.ordenCompraId),
        almacenDestinoId: ocForm.almacenDestinoId || undefined,
        areaId: ocForm.areaId || undefined,
        fechaMovimiento: ocForm.fechaMovimiento || undefined,
        fechaDocumento: ocForm.fechaDocumento || undefined,
        codigoNotaIngreso: ocForm.codigoNotaIngreso || undefined,
        observaciones: ocForm.observaciones || undefined,
        motivoSinDocumentacionEntrega:
          ocForm.motivoSinDocumentacionEntrega || undefined,
        requiereConformidadGerencia: Boolean(
          ocForm.requiereConformidadGerencia,
        ),
        documentosEntrega: getDocumentosEntregaConArchivo(
          ocForm.documentosEntrega,
        ),
        items: payloadItems,
      };

      const response = await registrarIngresoPorNota(payload);
      setResultado(response);
      toast.success(getNotaIngresoSuccessMessage(response));
      resetOcSelection();
      await refreshOrdenesCompra();
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la recepcion.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            Recepciones y notas de ingreso
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Modulo operativo minimo para ingreso simple y recepcion contra orden
            de compra.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <Link
            to="/ordenes-compra"
            className="inline-flex items-center justify-center rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Ordenes de compra
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {!canOperate ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Tu usuario no tiene perfil operativo de almacen u operaciones para
          registrar recepciones.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setMode("simple")}
              className={`rounded px-4 py-2 text-sm font-medium ${
                mode === "simple"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700"
              }`}
            >
              Ingreso simple
            </button>
            <button
              type="button"
              onClick={() => setMode("ordenCompra")}
              className={`rounded px-4 py-2 text-sm font-medium ${
                mode === "ordenCompra"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700"
              }`}
            >
              Recepcion contra OC
            </button>
          </div>

          {mode === "simple" ? (
            <form
              onSubmit={handleSimpleSubmit}
              className="space-y-4 rounded-lg bg-white p-4 shadow"
            >
              <ProductoSearchField
                selectedProduct={selectedProduct}
                onSelect={handleSelectedProduct}
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <input
                  type="number"
                  min="0.01"
                  step={esProductoIndividual(selectedProduct) ? "1" : "0.01"}
                  value={simpleForm.cantidad}
                  name="inventario-recepciones-page-input-366"
                  onChange={(event) =>
                    handleSimpleCantidadChange(event.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Cantidad"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={simpleForm.almacenDestinoId}
                  name="inventario-recepciones-page-input-381"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      almacenDestinoId: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Almacén que recepciona ID (opcional)"
                />
                <select
                  value={simpleForm.areaId}
                  name="inventario-recepciones-page-select-394"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      areaId: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">Area (opcional)</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={simpleForm.fechaMovimiento}
                  name="inventario-recepciones-page-input-411"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      fechaMovimiento: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
                <input
                  type="date"
                  value={simpleForm.fechaDocumento}
                  name="inventario-recepciones-page-input-422"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      fechaDocumento: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
                <input
                  type="text"
                  value={simpleForm.codigoNotaIngreso}
                  name="inventario-recepciones-page-input-433"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      codigoNotaIngreso: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Codigo nota ingreso (opcional)"
                />
                <input
                  type="text"
                  value={simpleForm.subtipoMovimiento}
                  name="inventario-recepciones-page-input-445"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      subtipoMovimiento: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Subtipo movimiento"
                />
                <input
                  type="text"
                  value={simpleForm.referenciaTipo}
                  name="inventario-recepciones-page-input-457"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      referenciaTipo: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Referencia tipo"
                />
                <input
                  type="number"
                  min="1"
                  value={simpleForm.referenciaId}
                  name="inventario-recepciones-page-input-469"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      referenciaId: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Referencia ID"
                />
              </div>
              <UnidadesInventarioEditor
                producto={selectedProduct}
                cantidad={simpleForm.cantidad}
                unidades={simpleForm.unidades}
                onChange={(unidades) =>
                  setSimpleForm((prev) => ({ ...prev, unidades }))
                }
                disabled={loading}
              />
              <textarea
                value={simpleForm.observaciones}
                name="inventario-recepciones-page-textarea-483"
                onChange={(event) =>
                  setSimpleForm((prev) => ({
                    ...prev,
                    observaciones: event.target.value,
                  }))
                }
                rows="3"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Observaciones"
              />
              <DocumentosEntregaSection
                title="Documentación sustentatoria del ingreso"
                description="Puedes adjuntar guía, factura, boleta u otro sustento. Si no adjuntas documento, debes explicar el motivo."
                documentos={simpleForm.documentosEntrega}
                motivoSinDocumentacionEntrega={
                  simpleForm.motivoSinDocumentacionEntrega
                }
                required={false}
                onDocumentoChange={updateDocumentosEntrega(setSimpleForm)}
                onAddDocumento={() => addDocumentoEntrega(setSimpleForm)}
                onRemoveDocumento={removeDocumentoEntrega(setSimpleForm)}
                onMotivoChange={(value) =>
                  setSimpleForm((prev) => ({
                    ...prev,
                    motivoSinDocumentacionEntrega: value,
                  }))
                }
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300 sm:w-auto"
              >
                {loading ? "Registrando…" : "Registrar ingreso"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleOcSubmit}
              className="space-y-4 rounded-lg bg-white p-4 shadow"
            >
              <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                La recepción contra OC registra la recepción física en una Nota
                de Ingreso. Las cantidades aceptadas no ingresan al stock
                disponible hasta completar las conformidades requeridas.
              </div>

              <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Solo se muestran ordenes de compra <strong>aprobadas</strong>,
                con estado de recepcion <strong>pendiente o parcial</strong> y
                con saldo real por recepcionar.
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="space-y-3 rounded border border-gray-200 p-4">
                  <div>
                    <label
                      htmlFor="recepcion-oc-search"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Buscar orden de compra recepcionable
                    </label>
                    <input
                      id="recepcion-oc-search"
                      type="text"
                      value={ordenesSearch}
                      name="inventario-recepciones-page-input-521"
                      onChange={(event) => setOrdenesSearch(event.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Codigo, proveedor o RUC"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {pendingOrdenesCompra.length} orden(es) lista(s) para
                      recepcion con el filtro actual.
                    </p>
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {ordenesCompraLoading ? (
                      <SkeletonSection rows={3} className="shadow-none" />
                    ) : pendingOrdenesCompra.length === 0 ? (
                      <div className="rounded border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                        No hay ordenes de compra aprobadas y con saldo pendiente
                        que cumplan el criterio actual de recepcion.
                      </div>
                    ) : (
                      pendingOrdenesCompra.map((ordenCompra) => {
                        const isSelected =
                          String(ordenCompra.id) ===
                          String(ocForm.ordenCompraId);

                        return (
                          <button
                            key={ordenCompra.id}
                            type="button"
                            onClick={() =>
                              handleSelectOrdenCompra(ordenCompra.id)
                            }
                            className={`w-full rounded border p-3 text-left ${
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-medium text-gray-900">
                                {ordenCompra.codigo}
                              </span>
                              <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                                {ordenCompra.estadoAprobacion}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                                {ordenCompra.estadoRecepcion}
                              </span>
                              <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                                Pendiente:{" "}
                                {Number(
                                  ordenCompra.resumen?.totalPendiente || 0,
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {ordenCompra.proveedor?.razonSocial ||
                                "Proveedor sin nombre"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              RUC:{" "}
                              {ordenCompra.proveedor?.ruc || "Sin RUC visible"}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <input
                      type="text"
                      value={selectedOrdenCompra?.codigo || ""}
                      readOnly
                      className="rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      placeholder="Orden de compra"
                      name="inventario-recepciones-page-input-581"
                    />
                    <input
                      type="number"
                      min="1"
                      value={ocForm.almacenDestinoId}
                      name="inventario-recepciones-page-input-588"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          almacenDestinoId: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Almacén que recepciona ID"
                    />
                    <select
                      value={ocForm.areaId}
                      name="inventario-recepciones-page-select-600"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          areaId: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    >
                      <option value="">Area (opcional)</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={ocForm.fechaMovimiento}
                      name="inventario-recepciones-page-input-618"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          fechaMovimiento: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                    <input
                      type="date"
                      value={ocForm.fechaDocumento}
                      name="inventario-recepciones-page-input-629"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          fechaDocumento: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                    <input
                      type="text"
                      value={ocForm.codigoNotaIngreso}
                      name="inventario-recepciones-page-input-640"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          codigoNotaIngreso: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Codigo nota ingreso"
                    />
                  </div>

                  {selectedOrdenCompra ? (
                    <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Proveedor:</span>{" "}
                        {selectedOrdenCompra.proveedor?.razonSocial ||
                          "Sin proveedor"}
                      </p>
                      <p>
                        <span className="font-medium">Estado recepcion:</span>{" "}
                        {selectedOrdenCompra.estadoRecepcion}
                      </p>
                      <p>
                        <span className="font-medium">Estado aprobacion:</span>{" "}
                        {selectedOrdenCompra.estadoAprobacion}
                      </p>
                      <p>
                        <span className="font-medium">Pendiente total:</span>{" "}
                        {Number(
                          selectedOrdenCompra.resumen?.totalPendiente || 0,
                        )}
                      </p>
                      <Link
                        to={`/ordenes-compra/${selectedOrdenCompra.id}`}
                        className="mt-2 inline-block font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        Abrir detalle de la orden de compra
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      Selecciona una orden de compra para cargar sus lineas
                      pendientes de recepcion.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={ocForm.requiereConformidadGerencia}
                    onChange={(event) =>
                      setOcForm((prev) => ({
                        ...prev,
                        requiereConformidadGerencia: event.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold">
                      Requiere conformidad del gerente del área usuaria
                    </span>
                    <span className="block text-xs leading-relaxed">
                      Márcalo para bienes que requieren validación técnica o
                      conformidad del área que generó el requerimiento. Si no se
                      marca, la Nota de Ingreso seguirá solo la conformidad de
                      almacén.
                    </span>
                  </span>
                </label>
              </div>

              <textarea
                value={ocForm.observaciones}
                name="inventario-recepciones-page-textarea-684"
                onChange={(event) =>
                  setOcForm((prev) => ({
                    ...prev,
                    observaciones: event.target.value,
                  }))
                }
                rows="3"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Observaciones de la recepcion"
              />
              <DocumentosEntregaSection
                title="Documentación sustentatoria obligatoria"
                description="Adjunta como mínimo una guía de remisión, factura, boleta u otro documento sustentatorio de la entrega. Si no cuentas con el archivo al momento de registrar, consigna el motivo excepcional."
                documentos={ocForm.documentosEntrega}
                motivoSinDocumentacionEntrega={
                  ocForm.motivoSinDocumentacionEntrega
                }
                required
                onDocumentoChange={updateDocumentosEntrega(setOcForm)}
                onAddDocumento={() => addDocumentoEntrega(setOcForm)}
                onRemoveDocumento={removeDocumentoEntrega(setOcForm, {
                  required: true,
                })}
                onMotivoChange={(value) =>
                  setOcForm((prev) => ({
                    ...prev,
                    motivoSinDocumentacionEntrega: value,
                  }))
                }
              />
              <div className="space-y-4">
                {!selectedOrdenCompra ? null : ocForm.items.length === 0 ? (
                  <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    La orden seleccionada ya no tiene lineas pendientes.
                  </div>
                ) : (
                  ocForm.items.map((item, index) => {
                    const linea = selectedOrdenCompra.items.find(
                      (currentItem) =>
                        String(currentItem.id) ===
                        String(item.itemOrdenCompraId),
                    );
                    const pendingResult = getPendingResultForDraft(item);
                    const producto = getLineaProductoReal(linea);
                    const productoTemporal = getLineaProductoTemporal(linea);
                    const temporalPendiente =
                      isLineaProductoTemporalPendiente(linea);

                    return (
                      <div
                        key={item.itemOrdenCompraId}
                        className={`space-y-3 rounded border p-3 ${
                          temporalPendiente
                            ? "border-amber-200 bg-amber-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {producto?.nombre ||
                                  productoTemporal?.nombre ||
                                  "Linea de orden"}
                              </p>
                              {temporalPendiente ? (
                                <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                                  Temporal
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-gray-600">
                              {linea?.producto?.codigo || "Sin codigo"} ·
                              {producto?.unidadMedida ||
                                productoTemporal?.unidadMedida ||
                                "Sin unidad"}{" "}
                              · pendiente actual:{" "}
                              {Number(linea?.cantidadPendiente || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Precio O/C:{" "}
                              {Number(linea?.precioUnidad || 0).toLocaleString(
                                "es-PE",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </p>
                            {temporalPendiente ? (
                              <div className="mt-2 rounded border border-amber-300 bg-white px-3 py-2 text-sm text-amber-900">
                                Producto pendiente de validacion. Debe
                                vincularse o crearse en catalogo antes de
                                recepcionarse.
                              </div>
                            ) : null}
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.selected === true}
                              name="inventario-recepciones-page-input-728"
                              disabled={temporalPendiente}
                              onChange={(event) =>
                                handleOcItemSelectedChange(
                                  index,
                                  event.target.checked,
                                )
                              }
                            />
                            Recibir
                          </label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <input
                            type="number"
                            min="0"
                            step={esProductoIndividual(producto) ? "1" : "0.01"}
                            value={item.cantidadAceptada}
                            name="inventario-recepciones-page-input-744"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "cantidadAceptada",
                                event.target.value,
                              )
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2"
                            placeholder="Cantidad aceptada"
                            disabled={
                              item.selected === false || temporalPendiente
                            }
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cantidadRechazada}
                            name="inventario-recepciones-page-input-760"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "cantidadRechazada",
                                event.target.value,
                              )
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2"
                            placeholder="Cantidad rechazada"
                            disabled={
                              item.selected === false || temporalPendiente
                            }
                          />
                          <input
                            type="text"
                            readOnly
                            name="inventario-recepciones-page-input-776"
                            value={
                              pendingResult >= 0
                                ? pendingResult
                                : "Excede saldo"
                            }
                            className="rounded border border-gray-300 bg-gray-50 px-3 py-2"
                            placeholder="Saldo pendiente real"
                          />
                          <input
                            type="text"
                            readOnly
                            value={linea?.estadoRecepcion || "PENDIENTE"}
                            className="rounded border border-gray-300 bg-gray-50 px-3 py-2"
                            placeholder="Estado recepcion"
                            name="inventario-recepciones-page-input-783"
                          />
                          <input
                            type="text"
                            value={item.motivoRechazo}
                            name="inventario-recepciones-page-input-790"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "motivoRechazo",
                                event.target.value,
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
                            placeholder="Motivo de rechazo"
                            disabled={
                              item.selected === false || temporalPendiente
                            }
                          />
                          <input
                            type="text"
                            value={item.motivoIncidencia}
                            name="inventario-recepciones-page-input-804"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "motivoIncidencia",
                                event.target.value,
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
                            placeholder="Motivo de incidencia"
                            disabled={
                              item.selected === false || temporalPendiente
                            }
                          />
                          <input
                            type="date"
                            value={item.fechaReposicionComprometida}
                            name="inventario-recepciones-page-input-818"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "fechaReposicionComprometida",
                                event.target.value,
                              )
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2"
                            disabled={
                              item.selected === false || temporalPendiente
                            }
                          />
                          <input
                            type="text"
                            value={item.decisionSaldoPendiente}
                            name="inventario-recepciones-page-input-831"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "decisionSaldoPendiente",
                                event.target.value,
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2 xl:col-span-3"
                            placeholder="Decision sobre el saldo pendiente"
                            disabled={
                              item.selected === false || temporalPendiente
                            }
                          />
                          {temporalPendiente ? (
                            <button
                              type="button"
                              onClick={() => setTemporalLineToValidate(linea)}
                              className="rounded border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                            >
                              Validar producto
                            </button>
                          ) : null}
                        </div>

                        <UnidadesInventarioEditor
                          producto={producto}
                          cantidad={item.cantidadAceptada}
                          unidades={item.unidades || []}
                          onChange={(unidades) =>
                            handleOcUnidadesChange(index, unidades)
                          }
                          disabled={
                            loading ||
                            item.selected === false ||
                            temporalPendiente
                          }
                        />
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetOcSelection}
                  className="inline-flex items-center justify-center rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Limpiar seleccion
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || !selectedOrdenCompra || ocForm.items.length === 0
                  }
                  className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? "Registrando…" : "Registrar recepcion"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <ValidarProductoTemporalModal
        open={Boolean(temporalLineToValidate)}
        productoTemporal={getLineaProductoTemporal(temporalLineToValidate)}
        onClose={() => setTemporalLineToValidate(null)}
        onResolved={handleTemporalResolved}
      />

      {resultado && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Resultado de la operacion
          </h2>
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            {resultado.notaIngreso?.id ? (
              <Link
                to={`/inventario-notas-ingreso/${resultado.notaIngreso.id}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Abrir nota de ingreso
              </Link>
            ) : null}
            {resultado.ordenCompra?.id ? (
              <Link
                to={`/ordenes-compra/${resultado.ordenCompra.id}`}
                className="font-medium text-slate-600 hover:text-slate-700"
              >
                Abrir orden de compra
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

export default InventarioRecepcionesPage;
