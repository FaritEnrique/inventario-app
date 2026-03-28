import { useEffect, useState } from "react";
import Modal from "./Modal";
import useSolicitudesTipoProducto from "../hooks/useSolicitudesTipoProducto";

const normalizeSelectedIds = (values = []) =>
  [
    ...new Set(
      (values || [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    ),
  ];

const ModalBuscarTiposProducto = ({
  isOpen,
  onClose,
  tiposProducto = [],
  loadingTiposProducto = false,
  initialSelectedIds = [],
  initialSelectedSolicitudIds = [],
  solicitudesTemporalesDisponibles = [],
  onSaveSelection,
  proveedorContext = {},
  onSolicitudCreada,
}) => {
  const { crearSolicitud, loading: creatingSolicitud } = useSolicitudesTipoProducto();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedSolicitudIds, setSelectedSolicitudIds] = useState([]);
  const [nombreSolicitud, setNombreSolicitud] = useState("");
  const [descripcionSolicitud, setDescripcionSolicitud] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedIds(normalizeSelectedIds(initialSelectedIds));
      setSelectedSolicitudIds(normalizeSelectedIds(initialSelectedSolicitudIds));
      setNombreSolicitud("");
      setDescripcionSolicitud("");
    }
  }, [initialSelectedIds, initialSelectedSolicitudIds, isOpen]);

  const tiposFiltrados = tiposProducto.filter((tipoProducto) => {
    if (!searchTerm.trim()) {
      return true;
    }

    const criterio = searchTerm.trim().toLowerCase();
    return (
      tipoProducto.nombre?.toLowerCase().includes(criterio) ||
      tipoProducto.prefijo?.toLowerCase().includes(criterio)
    );
  });

  const toggleTipoProducto = (tipoProductoId) => {
    setSelectedIds((prev) => {
      const normalizedId = Number(tipoProductoId);
      return prev.includes(normalizedId)
        ? prev.filter((item) => item !== normalizedId)
        : [...prev, normalizedId];
    });
  };

  const toggleSolicitudTemporal = (solicitudId) => {
    setSelectedSolicitudIds((prev) => {
      const normalizedId = Number(solicitudId);
      return prev.includes(normalizedId)
        ? prev.filter((item) => item !== normalizedId)
        : [...prev, normalizedId];
    });
  };

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
    setNombreSolicitud("");
    setDescripcionSolicitud("");
    setSelectedSolicitudIds((prev) => [...new Set([...prev, solicitud.id])]);
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
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Selecciona uno o varios tipos oficiales para <strong>{proveedorLabel}</strong>.
          Si no encuentras uno adecuado, puedes dejar marcado un tipo temporal
          pendiente para permitir el registro del proveedor.
        </div>

        <div>
          <label
            htmlFor="buscar-tipos-producto"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Buscar en el catalogo oficial
          </label>
          <input
            id="buscar-tipos-producto"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre o prefijo..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">
              Tipos oficiales disponibles
            </p>
            <p className="text-xs text-gray-500">
              Oficiales seleccionados: {selectedIds.length}
            </p>
          </div>

          {loadingTiposProducto ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              Cargando tipos de producto...
            </div>
          ) : tiposFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              {tiposFiltrados.map((tipoProducto) => {
                const checked = selectedIds.includes(tipoProducto.id);
                return (
                  <label
                    key={tipoProducto.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm ${
                      checked
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTipoProducto(tipoProducto.id)}
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
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500">
              No hay coincidencias en el catalogo oficial.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-amber-900">
            Tipos temporales pendientes
          </h4>
          <p className="mt-1 text-xs text-amber-800">
            Estos tipos permiten registrar el proveedor, pero nunca se usaran
            en cotizaciones ni en el flujo operativo hasta ser homologados.
          </p>

          {solicitudesTemporalesDisponibles.length > 0 ? (
            <div className="mt-4 space-y-2">
              {solicitudesTemporalesDisponibles.map((solicitud) => {
                const checked = selectedSolicitudIds.includes(solicitud.id);

                return (
                  <label
                    key={solicitud.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm ${
                      checked
                        ? "border-amber-300 bg-white"
                        : "border-amber-100 bg-white/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSolicitudTemporal(solicitud.id)}
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
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-amber-200 px-4 py-4 text-sm text-amber-900">
              Aun no hay tipos temporales pendientes disponibles para marcar.
            </div>
          )}

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
                  type="text"
                  value={nombreSolicitud}
                  onChange={(event) => setNombreSolicitud(event.target.value)}
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
                  rows="3"
                  value={descripcionSolicitud}
                  onChange={(event) => setDescripcionSolicitud(event.target.value)}
                  placeholder="Describe brevemente para que proveedor o proceso se necesita."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCrearSolicitud}
                disabled={creatingSolicitud || !nombreSolicitud.trim()}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingSolicitud ? "Registrando solicitud..." : "Solicitar tipo"}
              </button>
            </div>
          </div>
        </div>

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
            onClick={handleGuardarSeleccion}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Aplicar seleccion
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalBuscarTiposProducto;
