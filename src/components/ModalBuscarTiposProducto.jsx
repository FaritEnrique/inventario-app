import { useEffect, useReducer } from "react";
import Modal from "./Modal";
import useSolicitudesTipoProducto from "../hooks/useSolicitudesTipoProducto";

const EMPTY_TIPOS_PRODUCTO = [];
const EMPTY_SELECTED_IDS = [];
const EMPTY_SOLICITUDES_TEMPORALES = [];
const EMPTY_PROVEEDOR_CONTEXT = {};

const createInitialState = () => ({
  searchTerm: "",
  selectedIds: [],
  selectedSolicitudIds: [],
  nombreSolicitud: "",
  descripcionSolicitud: "",
});

const normalizeSelectedIds = (values = []) =>
  Array.from(
    new Set(
      (values || []).reduce((result, value) => {
        const normalizedValue = Number(value);
        if (Number.isInteger(normalizedValue) && normalizedValue > 0) {
          result.push(normalizedValue);
        }
        return result;
      }, [])
    )
  );

const toggleId = (values, id) =>
  values.includes(id) ? values.filter((item) => item !== id) : [...values, id];

const modalStateReducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return {
        ...createInitialState(),
        selectedIds: normalizeSelectedIds(action.initialSelectedIds),
        selectedSolicitudIds: normalizeSelectedIds(
          action.initialSelectedSolicitudIds
        ),
      };
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "toggleTipoProducto":
      return {
        ...state,
        selectedIds: toggleId(state.selectedIds, Number(action.id)),
      };
    case "toggleSolicitudTemporal":
      return {
        ...state,
        selectedSolicitudIds: toggleId(
          state.selectedSolicitudIds,
          Number(action.id)
        ),
      };
    case "setNombreSolicitud":
      return { ...state, nombreSolicitud: action.value };
    case "setDescripcionSolicitud":
      return { ...state, descripcionSolicitud: action.value };
    case "solicitudCreada":
      return {
        ...state,
        nombreSolicitud: "",
        descripcionSolicitud: "",
        selectedSolicitudIds: normalizeSelectedIds([
          ...state.selectedSolicitudIds,
          action.solicitudId,
        ]),
      };
    default:
      return state;
  }
};

const filterTiposProducto = (tiposProducto, searchTerm) => {
  const criterio = searchTerm.trim().toLowerCase();
  if (!criterio) {
    return tiposProducto;
  }

  return tiposProducto.filter(
    (tipoProducto) =>
      tipoProducto.nombre?.toLowerCase().includes(criterio) ||
      tipoProducto.prefijo?.toLowerCase().includes(criterio)
  );
};

const ModalIntro = ({ proveedorLabel }) => (
  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
    Selecciona uno o varios tipos oficiales para{" "}
    <strong>{proveedorLabel}</strong>. Si no encuentras uno adecuado, puedes
    dejar marcado un tipo temporal pendiente para permitir el registro del
    proveedor.
  </div>
);

const SearchField = ({ value, onChange }) => (
  <div>
    <label
      htmlFor="buscar-tipos-producto"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Buscar en el catalogo oficial
    </label>
    <input
      id="buscar-tipos-producto"
      name="buscarTiposProducto"
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Buscar por nombre o prefijo..."
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const LoadingMessage = ({ children }) => (
  <div className="px-4 py-6 text-sm text-gray-500">{children}</div>
);

const EmptyMessage = ({ children, className = "" }) => (
  <div className={className || "px-4 py-6 text-sm text-gray-500"}>
    {children}
  </div>
);

const OfficialTypeOption = ({ tipoProducto, checked, onToggle }) => {
  const inputId = `tipo-producto-oficial-${tipoProducto.id}`;

  return (
    <label
      htmlFor={inputId}
      aria-label={`Seleccionar ${
        tipoProducto.nombre || tipoProducto.prefijo || "tipo de producto"
      }`}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm ${
        checked ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <input
        id={inputId}
        name="tipoProductoIds"
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(tipoProducto.id)}
        className="mt-1"
      />
      <span>
        <span className="block font-medium text-gray-900">
          {tipoProducto.nombre}
        </span>
        <span className="block text-xs text-gray-500">
          {tipoProducto.prefijo}
        </span>
      </span>
    </label>
  );
};

const OfficialTypesSection = ({
  loading,
  tiposFiltrados,
  selectedIds,
  onToggle,
}) => (
  <div className="rounded-lg border border-gray-200">
    <div className="border-b border-gray-200 px-4 py-3">
      <p className="text-sm font-medium text-gray-700">
        Tipos oficiales disponibles
      </p>
      <p className="text-xs text-gray-500">
        Oficiales seleccionados: {selectedIds.length}
      </p>
    </div>

    {loading ? (
      <LoadingMessage>Cargando tipos de producto…</LoadingMessage>
    ) : tiposFiltrados.length > 0 ? (
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        {tiposFiltrados.map((tipoProducto) => (
          <OfficialTypeOption
            key={tipoProducto.id}
            tipoProducto={tipoProducto}
            checked={selectedIds.includes(tipoProducto.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    ) : (
      <EmptyMessage>No hay coincidencias en el catalogo oficial.</EmptyMessage>
    )}
  </div>
);

const TemporaryTypeOption = ({ solicitud, checked, onToggle }) => {
  const inputId = `solicitud-tipo-producto-${solicitud.id}`;

  return (
    <label
      htmlFor={inputId}
      aria-label={`Seleccionar ${solicitud.nombrePropuesto || "tipo temporal"}`}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm ${
        checked ? "border-amber-300 bg-white" : "border-amber-100 bg-white/80"
      }`}
    >
      <input
        id={inputId}
        name="solicitudTipoProductoIds"
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(solicitud.id)}
        className="mt-1"
      />
      <span className="flex-1">
        <span className="block font-medium text-gray-900">
          {solicitud.nombrePropuesto}
        </span>
        <span className="block text-xs text-amber-800">
          {solicitud.estado}
        </span>
      </span>
    </label>
  );
};

const TemporaryTypesList = ({ solicitudes, selectedIds, onToggle }) =>
  solicitudes.length > 0 ? (
    <div className="mt-4 space-y-2">
      {solicitudes.map((solicitud) => (
        <TemporaryTypeOption
          key={solicitud.id}
          solicitud={solicitud}
          checked={selectedIds.includes(solicitud.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  ) : (
    <EmptyMessage className="mt-4 rounded-lg border border-dashed border-amber-200 p-4 text-sm text-amber-900">
      Aun no hay tipos temporales pendientes disponibles para marcar.
    </EmptyMessage>
  );

const CreateSolicitudForm = ({
  nombreSolicitud,
  descripcionSolicitud,
  creatingSolicitud,
  onNombreChange,
  onDescripcionChange,
  onSubmit,
}) => (
  <div className="mt-4 border-t border-amber-200 pt-4">
    <h5 className="text-sm font-semibold text-amber-900">
      No encuentro el tipo que necesito
    </h5>
    <p className="mt-1 text-xs text-amber-800">
      Registra una solicitud y quedara disponible para marcarla en este
      proveedor.
    </p>

    <div className="mt-4 grid grid-cols-1 gap-4">
      <div>
        <label
          htmlFor="nombre-solicitud-tipo"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Nombre propuesto
        </label>
        <input
          id="nombre-solicitud-tipo"
          name="nombreSolicitudTipo"
          type="text"
          value={nombreSolicitud}
          onChange={(event) => onNombreChange(event.target.value)}
          placeholder="Ej. REACTIVOS DE LABORATORIO"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label
          htmlFor="descripcion-solicitud-tipo"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Comentario o referencia
        </label>
        <textarea
          id="descripcion-solicitud-tipo"
          name="descripcionSolicitudTipo"
          rows="3"
          value={descripcionSolicitud}
          onChange={(event) => onDescripcionChange(event.target.value)}
          placeholder="Describe brevemente para que proveedor o proceso se necesita."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onSubmit}
        disabled={creatingSolicitud || !nombreSolicitud.trim()}
        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creatingSolicitud ? "Registrando solicitud…" : "Solicitar tipo"}
      </button>
    </div>
  </div>
);

const TemporaryTypesSection = ({
  solicitudes,
  selectedSolicitudIds,
  nombreSolicitud,
  descripcionSolicitud,
  creatingSolicitud,
  onToggle,
  onNombreChange,
  onDescripcionChange,
  onCreateSolicitud,
}) => (
  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
    <h4 className="text-sm font-semibold text-amber-900">
      Tipos temporales pendientes
    </h4>
    <p className="mt-1 text-xs text-amber-800">
      Estos tipos permiten registrar el proveedor, pero nunca se usaran en
      cotizaciones ni en el flujo operativo hasta ser homologados.
    </p>

    <TemporaryTypesList
      solicitudes={solicitudes}
      selectedIds={selectedSolicitudIds}
      onToggle={onToggle}
    />

    <CreateSolicitudForm
      nombreSolicitud={nombreSolicitud}
      descripcionSolicitud={descripcionSolicitud}
      creatingSolicitud={creatingSolicitud}
      onNombreChange={onNombreChange}
      onDescripcionChange={onDescripcionChange}
      onSubmit={onCreateSolicitud}
    />
  </div>
);

const ModalActions = ({ onClose, onSave }) => (
  <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
    <button
      type="button"
      onClick={onClose}
      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
    >
      Cancelar
    </button>
    <button
      type="button"
      onClick={onSave}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Aplicar seleccion
    </button>
  </div>
);

const ModalBuscarTiposProducto = ({
  isOpen,
  onClose,
  tiposProducto = EMPTY_TIPOS_PRODUCTO,
  loadingTiposProducto = false,
  initialSelectedIds = EMPTY_SELECTED_IDS,
  initialSelectedSolicitudIds = EMPTY_SELECTED_IDS,
  solicitudesTemporalesDisponibles = EMPTY_SOLICITUDES_TEMPORALES,
  onSaveSelection,
  proveedorContext = EMPTY_PROVEEDOR_CONTEXT,
  onSolicitudCreada,
}) => {
  const { crearSolicitud, loading: creatingSolicitud } =
    useSolicitudesTipoProducto();
  const [state, dispatch] = useReducer(modalStateReducer, null, createInitialState);
  const {
    searchTerm,
    selectedIds,
    selectedSolicitudIds,
    nombreSolicitud,
    descripcionSolicitud,
  } = state;

  useEffect(() => {
    if (isOpen) {
      dispatch({
        type: "reset",
        initialSelectedIds,
        initialSelectedSolicitudIds,
      });
    }
  }, [initialSelectedIds, initialSelectedSolicitudIds, isOpen]);

  const tiposFiltrados = filterTiposProducto(tiposProducto, searchTerm);

  const handleGuardarSeleccion = () => {
    onSaveSelection?.({
      tipoProductoIds: normalizeSelectedIds(selectedIds),
      solicitudTipoProductoIds: normalizeSelectedIds(selectedSolicitudIds),
    });
    onClose?.();
  };

  const handleCrearSolicitud = async () => {
    const payload = {
      nombrePropuesto: nombreSolicitud.trim(),
      descripcion: descripcionSolicitud.trim() || null,
      proveedorId: proveedorContext.id || null,
      proveedorRazonSocialSnapshot: proveedorContext.razonSocial?.trim() || null,
      proveedorRucSnapshot: proveedorContext.ruc?.trim() || null,
    };

    const solicitud = await crearSolicitud(payload);
    dispatch({ type: "solicitudCreada", solicitudId: solicitud.id });
    onSolicitudCreada?.(solicitud);
  };

  const proveedorLabel =
    proveedorContext.razonSocial?.trim() ||
    proveedorContext.ruc?.trim() ||
    "Proveedor en registro";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buscar tipos de producto"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <ModalIntro proveedorLabel={proveedorLabel} />

        <SearchField
          value={searchTerm}
          onChange={(value) =>
            dispatch({ type: "setSearchTerm", value })
          }
        />

        <OfficialTypesSection
          loading={loadingTiposProducto}
          tiposFiltrados={tiposFiltrados}
          selectedIds={selectedIds}
          onToggle={(id) => dispatch({ type: "toggleTipoProducto", id })}
        />

        <TemporaryTypesSection
          solicitudes={solicitudesTemporalesDisponibles}
          selectedSolicitudIds={selectedSolicitudIds}
          nombreSolicitud={nombreSolicitud}
          descripcionSolicitud={descripcionSolicitud}
          creatingSolicitud={creatingSolicitud}
          onToggle={(id) => dispatch({ type: "toggleSolicitudTemporal", id })}
          onNombreChange={(value) =>
            dispatch({ type: "setNombreSolicitud", value })
          }
          onDescripcionChange={(value) =>
            dispatch({ type: "setDescripcionSolicitud", value })
          }
          onCreateSolicitud={handleCrearSolicitud}
        />

        <ModalActions onClose={onClose} onSave={handleGuardarSeleccion} />
      </div>
    </Modal>
  );
};

export default ModalBuscarTiposProducto;
