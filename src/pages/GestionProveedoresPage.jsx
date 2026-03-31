import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";
import FormularioProveedor from "../components/FormularioProveedor";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import ProveedorDetalleModal from "../components/ProveedorDetalleModal";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";

const RUC_REGEX = /^(10|20)\d{9}$/;

const pickFirstTextValue = (...values) =>
  values.find(
    (value) => typeof value === "string" && value.trim() !== ""
  ) || "";

const TYPE_LABEL_MAP = {
  "AV.": "Av.",
  AV: "Av.",
  "JR.": "Jr.",
  JR: "Jr.",
  "CAL.": "Calle",
  CAL: "Calle",
  "PQ.": "Parque",
  PQ: "Parque",
  "URB.": "Urb.",
  URB: "Urb.",
  "FND.": "Fundo",
  FND: "Fundo",
  "P.J.": "Pueblo Joven",
  PJ: "Pueblo Joven",
  "P J": "Pueblo Joven",
  "COO.": "Cooperativa",
  COO: "Cooperativa",
  "BL.": "Bl.",
  BL: "Bl.",
};

const PRIMARY_ZONE_TYPES = new Set(["URB.", "URB", "FND.", "FND"]);
const SECONDARY_ZONE_TYPES = new Set(["P.J.", "PJ", "P J", "COO.", "COO"]);
const SUSPICIOUS_ZONE_NAMES = new Set([
  "JR",
  "JR.",
  "AV",
  "AV.",
  "CAL",
  "CAL.",
  "MZ",
  "LT",
  "KM",
  "RES",
  "RES.",
  "URB",
  "URB.",
  "FND",
  "FND.",
  "OTR",
  "OTR.",
  "COO",
  "COO.",
]);

const normalizeText = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length ? normalized : null;
};

const nullIfPlaceholder = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return normalized === "-" ? null : normalized;
};

const toTitleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());

const normalizeTypeToken = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

const normalizeBareToken = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .trim();

const formatTypeLabel = (value) => {
  const normalized = normalizeTypeToken(value);
  if (!normalized) return null;
  return TYPE_LABEL_MAP[normalized] || toTitleCase(normalized);
};

const stripDuplicatedTypePrefix = (name, rawType) => {
  const normalizedName = nullIfPlaceholder(name);
  if (!normalizedName) return null;

  const bareType = normalizeBareToken(rawType);
  if (!bareType) return toTitleCase(normalizedName);

  const upperName = normalizedName.toUpperCase();
  const prefixes = [`${bareType} `, `${bareType}. `];
  const matchedPrefix = prefixes.find((prefix) => upperName.startsWith(prefix));

  if (!matchedPrefix) {
    return toTitleCase(normalizedName);
  }

  return toTitleCase(normalizedName.slice(matchedPrefix.length).trim());
};

const buildTypedAddressSegment = (rawType, rawName) => {
  const label = formatTypeLabel(rawType);
  const cleanName = stripDuplicatedTypePrefix(rawName, rawType);

  if (!label && !cleanName) return null;
  if (!label) return cleanName;
  if (!cleanName) return label;

  return `${label} ${cleanName}`.trim();
};

const isNumericLike = (value) =>
  /^[0-9]+([.,][0-9]+)?$/i.test(String(value || "").trim());

const extractLotNumber = (value) => {
  const normalized = nullIfPlaceholder(value);
  if (!normalized) return null;

  const match = normalized.toUpperCase().match(/^LT\.?\s*([A-Z0-9.-]+)$/);
  return match?.[1] || null;
};

const buildReducedAddressComplement = ({
  numero,
  interior,
  lote,
  departamentoDireccion,
  manzana,
  kilometro,
}) => {
  const numeroValue = nullIfPlaceholder(numero);
  const interiorValue = nullIfPlaceholder(interior);
  const loteValue = nullIfPlaceholder(lote);
  const departamentoValue = nullIfPlaceholder(departamentoDireccion);
  const manzanaValue = nullIfPlaceholder(manzana);
  const kilometroValue = nullIfPlaceholder(kilometro);
  const numeroToken = normalizeBareToken(numeroValue);
  const interiorLot = extractLotNumber(interiorValue);
  const loteLot = extractLotNumber(loteValue);

  if (numeroToken === "KM") {
    const kmValue = [
      interiorValue,
      loteValue,
      departamentoValue,
      manzanaValue,
      kilometroValue,
    ].find(Boolean);
    return kmValue ? `Km. ${kmValue}` : null;
  }

  if (numeroToken === "MZ") {
    if (interiorLot) {
      return `Nro. ${interiorLot}`;
    }

    if (interiorValue) {
      return `Mz. ${toTitleCase(interiorValue)}`;
    }

    if (manzanaValue) {
      return `Mz. ${toTitleCase(manzanaValue)}`;
    }
  }

  if (numeroValue && isNumericLike(numeroValue)) {
    return `Nro. ${numeroValue}`;
  }

  if (interiorValue && isNumericLike(interiorValue)) {
    return `Nro. ${interiorValue}`;
  }

  if (!numeroValue && loteValue && isNumericLike(loteValue)) {
    return `Nro. ${loteValue}`;
  }

  if (loteLot) {
    return `Nro. ${loteLot}`;
  }

  if (kilometroValue && isNumericLike(kilometroValue)) {
    return `Km. ${kilometroValue}`;
  }

  if (manzanaValue) {
    return `Mz. ${toTitleCase(manzanaValue)}`;
  }

  return null;
};

const shouldIgnoreZoneSegment = (rawType, rawName) => {
  const zoneName = nullIfPlaceholder(rawName);
  if (!zoneName) return true;

  if (SUSPICIOUS_ZONE_NAMES.has(normalizeTypeToken(zoneName))) {
    return true;
  }

  const zoneType = normalizeTypeToken(rawType);
  return (
    zoneType === "RES." ||
    zoneType === "RES" ||
    zoneType === "OTR." ||
    zoneType === "OTR"
  );
};

const buildSunatAddress = (data = {}) => {
  const viaSegment = buildTypedAddressSegment(data.tipoVia, data.nombreVia);
  const zoneSegment = shouldIgnoreZoneSegment(data.codigoZona, data.tipoZona)
    ? null
    : buildTypedAddressSegment(data.codigoZona, data.tipoZona);
  const complement = buildReducedAddressComplement({
    numero: data.numero,
    interior: data.interior,
    lote: data.lote,
    departamentoDireccion: data.departamentoDireccion,
    manzana: data.manzana,
    kilometro: data.kilometro,
  });
  const zoneTypeToken = normalizeTypeToken(data.codigoZona);

  if (zoneSegment && PRIMARY_ZONE_TYPES.has(zoneTypeToken)) {
    const primary = [zoneSegment, complement].filter(Boolean).join(" ").trim();
    return viaSegment ? `${primary} (${viaSegment})` : primary || "";
  }

  const primary = [viaSegment || zoneSegment, complement]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!primary) {
    return "";
  }

  if (zoneSegment && viaSegment && SECONDARY_ZONE_TYPES.has(zoneTypeToken)) {
    return `${primary} (${zoneSegment})`;
  }

  return primary;
};

const normalizeSunatProveedorDraft = (proveedor = {}, fallbackRuc = "") => ({
  ...proveedor,
  procedencia: proveedor.procedencia || "NACIONAL",
  ruc: pickFirstTextValue(proveedor.ruc, fallbackRuc),
  razonSocial: pickFirstTextValue(
    proveedor.razonSocial,
    proveedor.razonsocial,
    proveedor.nombreORazonSocial,
    proveedor.nombreOrazonSocial,
    proveedor.nombreOrazonSocialDelContribuyente,
    proveedor.nombre
  ),
  direccion: pickFirstTextValue(
    proveedor.direccion,
    proveedor.domicilioFiscal,
    proveedor.direccionCompleta,
    buildSunatAddress(proveedor)
  ),
});

const hasSunatAutofillData = (proveedor = {}) =>
  Boolean(
    pickFirstTextValue(proveedor.razonSocial) ||
      pickFirstTextValue(proveedor.direccion)
  );

const renderEstadoImportacion = (job) => {
  if (!job) {
    return {
      label: "Sin ejecucion reciente",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (job.estado === "EN_PROCESO" || job.estado === "PENDIENTE") {
    return {
      label: "En proceso",
      className: "bg-amber-100 text-amber-800",
    };
  }

  if (job.estado === "COMPLETADO") {
    return {
      label: "Completado",
      className: "bg-green-100 text-green-800",
    };
  }

  return {
    label: "Error",
    className: "bg-red-100 text-red-800",
  };
};

const GestionProveedoresPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [lastAppliedSearchQuery, setLastAppliedSearchQuery] = useState("");
  const [registeredFilterQuery, setRegisteredFilterQuery] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [detailProveedor, setDetailProveedor] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isRucDisabledForNewForm, setIsRucDisabledForNewForm] = useState(false);
  const [resultadoImportacionModal, setResultadoImportacionModal] = useState(null);
  const handledImportResultRef = useRef({
    PADRON_COMPLETO: null,
    PADRON_REDUCIDO: null,
  });

  const {
    proveedores,
    loading: proveedoresLoading,
    fetchProveedores,
    consultarProveedores,
    actualizarEstadoProveedor,
  } = useProveedores({ autoLoad: false });

  const {
    consultarPadronSunat,
    actualizarPadronSunat,
    actualizarPadronReducido,
    obtenerUltimaActualizacion,
    obtenerUltimaActualizacionReducido,
    obtenerEstadoImportacionSunat,
    obtenerEstadoImportacionReducido,
    ultimaActualizacion,
    ultimaActualizacionReducido,
    loading: sunatLoading,
    actualizando: actualizandoSunat,
    actualizandoReducido,
    estadoImportacionSunat,
    estadoImportacionReducido,
  } = useSunat();

  useEffect(() => {
    fetchProveedores(lastAppliedSearchQuery);
  }, [fetchProveedores, lastAppliedSearchQuery]);

  useEffect(() => {
    obtenerUltimaActualizacion();
    obtenerUltimaActualizacionReducido();
    obtenerEstadoImportacionSunat();
    obtenerEstadoImportacionReducido();
  }, [
    obtenerEstadoImportacionReducido,
    obtenerEstadoImportacionSunat,
    obtenerUltimaActualizacion,
    obtenerUltimaActualizacionReducido,
  ]);

  useEffect(() => {
    const jobs = [
      estadoImportacionSunat,
      estadoImportacionReducido,
    ].filter(Boolean);

    jobs.forEach((job) => {
      if (
        job.estado === "COMPLETADO" &&
        job.actualizado === false &&
        job.mensajeResultado &&
        handledImportResultRef.current[job.tipo] !== job.id
      ) {
        handledImportResultRef.current[job.tipo] = job.id;
        setResultadoImportacionModal({
          jobId: job.id,
          tipo: job.tipo,
          mensaje: job.mensajeResultado,
        });
      }
    });
  }, [estadoImportacionReducido, estadoImportacionSunat]);

  const handleSearchChange = (event) => {
    const value = event.target.value;

    if (/[^0-9]/.test(value)) {
      setSearchQuery(value);
      return;
    }

    if (value.length <= 11) {
      setSearchQuery(value);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();

    const isNumericQuery = /^\d+$/.test(query);
    if (isNumericQuery && query.length === 11 && !RUC_REGEX.test(query)) {
      toast.error("El RUC debe tener 11 digitos y empezar con 10 o 20.");
      return;
    }

    setIsRucDisabledForNewForm(false);

    if (!query) {
      toast.info("Ingresa un RUC o nombre para buscar.");
      return;
    }

    const isRuc = RUC_REGEX.test(query);

    setIsFormVisible(false);
    setSelectedProveedor(null);

    const localResults = await consultarProveedores(query);

    if (localResults.length > 0) {
      toast.info(`Se encontraron ${localResults.length} coincidencias locales.`);
      return;
    }

    if (isRuc) {
      const sunatData = await consultarPadronSunat(query);
      const proveedorDraft = normalizeSunatProveedorDraft(sunatData, query);

      if (sunatData) {
        setSelectedProveedor(proveedorDraft);
        setIsFormVisible(true);

        if (hasSunatAutofillData(proveedorDraft)) {
          toast.success(
            "Proveedor encontrado en SUNAT. Completa los datos para registrarlo."
          );
        } else {
          toast.warn(
            "Se encontro el RUC en ProveedoresSunat, pero sin razon social o direccion. Completa esos campos manualmente o actualiza el padron reducido."
          );
        }
      } else {
        setSelectedProveedor(proveedorDraft);
        setIsFormVisible(true);
        toast.info(
          "El RUC no fue encontrado. Puedes registrar un nuevo proveedor con este RUC."
        );
      }
      return;
    }

    toast.info("Proveedor no encontrado. Para buscar en SUNAT, ingresa un RUC.");
  };

  const handleCreateNew = () => {
    setSelectedProveedor(null);
    setIsFormVisible(true);
    setIsRucDisabledForNewForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(
      "Formulario para nuevo proveedor. El RUC depende de la procedencia seleccionada."
    );
  };

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsFormVisible(true);
    setIsRucDisabledForNewForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = (id) => {
    toast.dark(
      ({ closeToast }) => (
        <ConfirmDeleteToast
          closeToast={closeToast}
          message="Estas seguro de que deseas desactivar este proveedor?"
          onConfirm={async () => {
            await actualizarEstadoProveedor(id, false);
            fetchProveedores(lastAppliedSearchQuery);
          }}
        />
      ),
      { autoClose: false, closeButton: false }
    );
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setSelectedProveedor(null);
    setIsRucDisabledForNewForm(false);
    setSearchQuery("");
    fetchProveedores();
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedProveedor(null);
    setIsRucDisabledForNewForm(false);
  };

  const handleActualizarPadron = async () => {
    await actualizarPadronSunat();
  };

  const handleActualizarPadronReducido = async () => {
    await actualizarPadronReducido();
  };

  const handleRegisteredFilterSubmit = async (event) => {
    event.preventDefault();
    const query = registeredFilterQuery.trim();
    setLastAppliedSearchQuery(query);
  };

  const handleClearRegisteredFilter = () => {
    setRegisteredFilterQuery("");
    setLastAppliedSearchQuery("");
  };

  const loading = proveedoresLoading || sunatLoading;
  const estadoSunatUi = renderEstadoImportacion(estadoImportacionSunat);
  const estadoReducidoUi = renderEstadoImportacion(estadoImportacionReducido);

  return (
    <>
      <Helmet>
        <title>Gestion de Proveedores | Sistema de Inventario</title>
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Gestion de Proveedores
        </h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <form onSubmit={handleSearchSubmit}>
            <label
              htmlFor="search-proveedor"
              className="mb-2 block font-medium text-gray-700 text-md"
            >
              Buscar o Registrar Proveedor
            </label>
            <div className="flex">
              <input
                id="search-proveedor"
                type="text"
                className="max-w-96 flex-grow rounded-l-md border border-gray-500 p-3 transition-shadow focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa un RUC o nombre..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-r-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader size="sm" /> : "Buscar / Registrar"}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Busca un proveedor existente por RUC o nombre, o inicia un nuevo
              registro.
            </p>
          </form>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreateNew}
                className="rounded-md bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
              >
                Crear nuevo
              </button>
              <button
                type="button"
                onClick={handleActualizarPadron}
                disabled={actualizandoSunat}
                className="rounded-md bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actualizandoSunat
                  ? "Actualizando padron SUNAT..."
                  : "Actualizar padron SUNAT"}
              </button>
              <button
                type="button"
                onClick={handleActualizarPadronReducido}
                disabled={actualizandoReducido}
                className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actualizandoReducido
                  ? "Actualizando padron reducido..."
                  : "Actualizar padron reducido"}
              </button>
              <Link
                to="/solicitudes-tipo-producto"
                className="rounded-md bg-slate-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Bandeja de solicitudes
              </Link>
            </div>
            <div className="max-w-md text-sm text-gray-600">
              <p className="font-medium text-gray-700">
                Actualizacion manual del padron SUNAT
              </p>
              <p>
                Usala cuando necesites refrescar la base externa para que la
                busqueda por RUC recupere datos recientes del proveedor.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ultima actualizacion padron SUNAT:{" "}
                {ultimaActualizacion || "Sin informacion disponible"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ultima actualizacion padron reducido:{" "}
                {ultimaActualizacionReducido || "Sin informacion disponible"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-amber-900">Padron SUNAT</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${estadoSunatUi.className}`}
                >
                  {estadoSunatUi.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-amber-900">
                {estadoImportacionSunat?.errorMensaje ||
                  estadoImportacionSunat?.mensajeResultado ||
                  (estadoImportacionSunat?.estado === "COMPLETADO"
                    ? `Leidos: ${estadoImportacionSunat?.totalLeidos || 0} | Persistidos: ${estadoImportacionSunat?.totalPersistidos || 0}`
                    : "Cuando inicies la importacion, aqui se mostrara su estado.")}
              </p>
            </div>

            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-teal-900">Padron reducido</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${estadoReducidoUi.className}`}
                >
                  {estadoReducidoUi.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-teal-900">
                {estadoImportacionReducido?.errorMensaje ||
                  estadoImportacionReducido?.mensajeResultado ||
                  (estadoImportacionReducido?.estado === "COMPLETADO"
                    ? `Leidos: ${estadoImportacionReducido?.totalLeidos || 0} | Persistidos: ${estadoImportacionReducido?.totalPersistidos || 0}`
                    : "Cuando inicies la importacion, aqui se mostrara su estado.")}
              </p>
            </div>
          </div>
        </div>

        {isFormVisible ? (
          <div className="mb-6">
            <FormularioProveedor
              key={selectedProveedor?.id || "new"}
              proveedor={selectedProveedor}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              disableRucField={isRucDisabledForNewForm}
            />
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
          <div className="border-b p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Proveedores Registrados
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Filtra manualmente por razon social, RUC o tipo de producto.
                </p>
              </div>

              <form
                onSubmit={handleRegisteredFilterSubmit}
                className="flex w-full flex-col gap-2 md:max-w-2xl md:flex-row"
              >
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm transition-shadow focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por razon social, RUC o tipo de producto..."
                  value={registeredFilterQuery}
                  onChange={(event) => setRegisteredFilterQuery(event.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    disabled={proveedoresLoading}
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={handleClearRegisteredFilter}
                    className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    disabled={proveedoresLoading && !registeredFilterQuery}
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            </div>
          </div>
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Razon Social
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  RUC
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Representante
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Contacto
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Telefono
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Tipos de Producto
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Estado
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50">
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.razonSocial}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.ruc || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.representante || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.contacto || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.telefono || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {(proveedor.especialidades || []).length > 0
                        ? proveedor.especialidades
                            .map((especialidad) => especialidad.tipoProducto?.nombre)
                            .filter(Boolean)
                            .join(", ")
                        : "Sin definir"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold leading-tight ${
                          proveedor.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {proveedor.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="flex gap-3 border-b px-5 py-4 text-sm">
                      <button
                        onClick={() => setDetailProveedor(proveedor)}
                        className="font-medium text-slate-700 hover:text-slate-900"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleEdit(proveedor)}
                        className="font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeactivate(proveedor.id)}
                        className="font-medium text-red-600 hover:text-red-900"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-gray-500">
                    No se encontraron proveedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ProveedorDetalleModal
          isOpen={Boolean(detailProveedor)}
          onClose={() => setDetailProveedor(null)}
          proveedor={detailProveedor}
        />

        <Modal
          isOpen={Boolean(resultadoImportacionModal)}
          onClose={() => setResultadoImportacionModal(null)}
          title="Resultado de actualizacion SUNAT"
          maxWidth="max-w-lg"
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-gray-700">
              {resultadoImportacionModal?.mensaje}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setResultadoImportacionModal(null)}
                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default GestionProveedoresPage;
