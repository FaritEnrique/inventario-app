import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import useDebounce from "../hooks/useDebounce";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";
import useTipoProductos from "../hooks/useTipoProductos";
import Modal from "./Modal";
import ModalBuscarTiposProducto from "./ModalBuscarTiposProducto";
import ProveedorPrintPreview from "./ProveedorPrintPreview";

const getInitialFormData = () => ({
  procedencia: "NACIONAL",
  ruc: "",
  razonSocial: "",
  estado: "",
  condicion: "",
  tipo: "",
  actividadCIIU3Principal: "",
  actividadCIIU3Secundaria: "",
  actividadCIIU4Principal: "",
  nroTrabajadores: "",
  tipoFacturacion: "",
  tipoContabilidad: "",
  comercioExterior: "",
  ubigeo: "",
  departamento: "",
  provincia: "",
  distrito: "",
  periodoPublicacion: "",
  direccion: "",
  representante: "",
  contacto: "",
  correoElectronico: "",
  telefono: "",
  tipoProductoIds: [],
  solicitudTipoProductoIds: [],
  activo: true,
});

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
const PHONE_PATTERN = /^\+?\d+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

const normalizeProveedorData = (proveedor = {}) => ({
  ...proveedor,
  procedencia: proveedor.procedencia || "NACIONAL",
  ruc: pickFirstTextValue(proveedor.ruc, proveedor.nroRuc, proveedor.numeroRuc),
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

const mapSunatDataToFormData = (sunatData) => {
  const normalizedData = normalizeProveedorData(sunatData);

  return {
    ruc: normalizedData.ruc || "",
    razonSocial: normalizedData.razonSocial || "",
    estado: normalizedData.estado || "",
    condicion: normalizedData.condicion || "",
    tipo: normalizedData.tipo || "",
    actividadCIIU3Principal: normalizedData.actividadCIIU3Principal || "",
    actividadCIIU3Secundaria: normalizedData.actividadCIIU3Secundaria || "",
    actividadCIIU4Principal: normalizedData.actividadCIIU4Principal || "",
    nroTrabajadores: normalizedData.nroTrabajadores || "",
    tipoFacturacion: normalizedData.tipoFacturacion || "",
    tipoContabilidad: normalizedData.tipoContabilidad || "",
    comercioExterior: normalizedData.comercioExterior || "",
    ubigeo: normalizedData.ubigeo || "",
    departamento: normalizedData.departamento || "",
    provincia: normalizedData.provincia || "",
    distrito: normalizedData.distrito || "",
    periodoPublicacion: normalizedData.periodoPublicacion || "",
    direccion: normalizedData.direccion || "",
  };
};

const areAllFieldsFilled = (data) => {
  const mandatoryFields = [
    "razonSocial",
    "direccion",
    "telefono",
    "correoElectronico",
  ];

  return mandatoryFields.every((field) => {
    const value = data[field];
    return value ? value.trim() !== "" : value !== null && value !== undefined;
  });
};

const getTipoProductoIdsFromProveedor = (proveedor) => {
  if (!proveedor) return [];

  if (Array.isArray(proveedor.tipoProductoIds)) {
    return proveedor.tipoProductoIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
  }

  if (Array.isArray(proveedor.especialidades)) {
    return proveedor.especialidades
      .map((item) => item?.tipoProductoId || item?.tipoProducto?.id)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
  }

  return [];
};

const getSolicitudTipoProductoIdsFromProveedor = (proveedor) => {
  if (!proveedor || !Array.isArray(proveedor.solicitudesTipoProducto)) {
    return [];
  }

  return proveedor.solicitudesTipoProducto
    .filter((solicitud) =>
      ["PENDIENTE", "OBSERVADO"].includes(String(solicitud?.estado || ""))
    )
    .map((solicitud) => Number(solicitud.id))
    .filter((value) => Number.isInteger(value) && value > 0);
};

const buildTipoProductoMap = (tiposProducto, proveedor) => {
  const map = new Map();

  (tiposProducto || []).forEach((tipoProducto) => {
    map.set(Number(tipoProducto.id), tipoProducto);
  });

  (proveedor?.especialidades || []).forEach((especialidad) => {
    if (especialidad?.tipoProducto?.id) {
      map.set(Number(especialidad.tipoProducto.id), especialidad.tipoProducto);
    }
  });

  return map;
};

const FormularioProveedor = ({
  proveedor,
  onSuccess,
  onCancel,
  disableRucField,
}) => {
  const { crearProveedor, actualizarProveedor } = useProveedores();
  const { consultarPadronSunat, loading: loadingSunat } = useSunat();
  const {
    tiposProducto,
    cargando: loadingTiposProducto,
    fetchTiposProducto,
  } = useTipoProductos();

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [isPrintable, setIsPrintable] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isProcedenciaDisabled, setIsProcedenciaDisabled] = useState(false);
  const [solicitudesRegistradas, setSolicitudesRegistradas] = useState([]);

  const debouncedRuc = useDebounce(formData.ruc, 500);

  useEffect(() => {
    if (proveedor) {
      const normalizedProveedor = normalizeProveedorData(proveedor);
      const nextState = {
        ...getInitialFormData(),
        ...normalizedProveedor,
        tipoProductoIds: getTipoProductoIdsFromProveedor(normalizedProveedor),
        solicitudTipoProductoIds:
          getSolicitudTipoProductoIdsFromProveedor(normalizedProveedor),
      };

      setFormData(nextState);
      setSolicitudesRegistradas([]);

      if (normalizedProveedor.procedencia === "NACIONAL" && !normalizedProveedor.ruc) {
        toast.warn(
          "Este proveedor nacional no tiene RUC. Por favor, asigna un RUC o cambia su procedencia a Extranjero.",
          { autoClose: 8000 }
        );
        setIsProcedenciaDisabled(false);
      } else {
        setIsProcedenciaDisabled(Boolean(normalizedProveedor.id));
      }
      return;
    }

    setFormData(getInitialFormData());
    setSolicitudesRegistradas([]);
    setIsProcedenciaDisabled(false);
  }, [proveedor]);

  useEffect(() => {
    if (proveedor?.id && areAllFieldsFilled(formData)) {
      setIsPrintable(true);
    } else {
      setIsPrintable(false);
    }
  }, [formData, proveedor]);

  useEffect(() => {
    const fetchSunatData = async () => {
      if (
        formData.procedencia === "NACIONAL" &&
        !disableRucField &&
        !proveedor?.id &&
        debouncedRuc &&
        debouncedRuc.length === 11
      ) {
        if (proveedor?.ruc === debouncedRuc) {
          return;
        }

        const datos = await consultarPadronSunat(debouncedRuc);
        if (datos) {
          const mappedData = mapSunatDataToFormData(datos);
          setFormData((prev) => ({ ...prev, ...mappedData }));

          if (mappedData.razonSocial || mappedData.direccion) {
            toast.success("Datos de SUNAT cargados correctamente.");
          } else {
            toast.warn(
              "El RUC existe en ProveedoresSunat, pero no tiene razon social o direccion disponibles para autocompletar."
            );
          }
        } else {
          toast.info(
            "RUC no encontrado en SUNAT. Puedes continuar con el registro manual."
          );
        }
      }
    };

    fetchSunatData();
  }, [
    consultarPadronSunat,
    debouncedRuc,
    disableRucField,
    formData.procedencia,
    proveedor?.id,
    proveedor?.ruc,
  ]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (name === "procedencia" && finalValue === "EXTRANJERO") {
      setFormData((prev) => ({
        ...getInitialFormData(),
        procedencia: "EXTRANJERO",
        razonSocial: prev.razonSocial,
        direccion: prev.direccion,
        telefono: prev.telefono,
        correoElectronico: prev.correoElectronico,
        representante: prev.representante,
        contacto: prev.contacto,
        tipoProductoIds: prev.tipoProductoIds,
        activo: prev.activo,
      }));
      return;
    }

    if (name === "ruc") {
      const sanitizedValue = finalValue.replace(/[^0-9]/g, "");
      if (sanitizedValue.length > 11) return;
      finalValue = sanitizedValue;

      if (
        sanitizedValue.length === 11 &&
        !/^(10|20)\d{9}$/.test(sanitizedValue)
      ) {
        setValidationErrors((prev) => ({
          ...prev,
          ruc: "RUC invalido. Debe empezar con 10 o 20.",
        }));
      } else if (validationErrors.ruc) {
        setValidationErrors((prev) => ({ ...prev, ruc: undefined }));
      }
    } else if (typeof finalValue === "string") {
      if (name === "correoElectronico") {
        finalValue = finalValue.toLowerCase();
      } else if (name !== "procedencia") {
        finalValue = finalValue.toUpperCase();
      }
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const razonSocial = formData.razonSocial.trim();
    const direccion = formData.direccion.trim();
    const telefono = formData.telefono.trim();
    const correoElectronico = formData.correoElectronico.trim();

    if (!razonSocial) {
      errors.razonSocial = "El Nombre o Razon Social es obligatorio.";
    } else if (razonSocial.length > 255) {
      errors.razonSocial =
        "El Nombre o Razon Social no puede superar los 255 caracteres.";
    }

    if (!direccion) {
      errors.direccion = "La Direccion es obligatoria.";
    } else if (direccion.length > 255) {
      errors.direccion =
        "La Direccion no puede superar los 255 caracteres.";
    }

    if (!telefono) {
      errors.telefono = "El Telefono es obligatorio.";
    } else if (!PHONE_PATTERN.test(telefono.replace(/\s/g, ""))) {
      errors.telefono =
        "El Telefono solo debe contener numeros y puede iniciar con '+'.";
    }

    if (
      formData.procedencia === "NACIONAL" &&
      !/^(10|20)\d{9}$/.test(formData.ruc)
    ) {
      errors.ruc =
        "El RUC es obligatorio para proveedores nacionales y debe ser valido.";
    }

    if (!correoElectronico) {
      errors.correoElectronico = "El correo electronico es obligatorio.";
    } else if (!EMAIL_PATTERN.test(correoElectronico)) {
      errors.correoElectronico =
        "El correo electronico debe tener un formato valido.";
    }

    if (
      !Array.isArray(formData.tipoProductoIds) ||
      !formData.tipoProductoIds.length
    ) {
      const hasTemporalSelection =
        Array.isArray(formData.solicitudTipoProductoIds) &&
        formData.solicitudTipoProductoIds.length > 0;

      if (!hasTemporalSelection) {
        errors.tipoProductoIds =
          "Debes seleccionar al menos un tipo oficial o un tipo temporal pendiente para el proveedor.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    try {
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        especialidades: _especialidades,
        fechaActualizacionReducido: _fechaActualizacionReducido,
        ...payload
      } = formData;

      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") payload[key] = null;
      });

      if (payload.telefono) {
        payload.telefono = payload.telefono.replace(/\s/g, "");
      }

      payload.tipoProductoIds = Array.isArray(formData.tipoProductoIds)
        ? formData.tipoProductoIds.map((value) => Number(value))
        : [];
      payload.solicitudTipoProductoIds = Array.isArray(
        formData.solicitudTipoProductoIds
      )
        ? formData.solicitudTipoProductoIds.map((value) => Number(value))
        : [];

      if (proveedor?.id) {
        await actualizarProveedor(proveedor.id, payload);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await crearProveedor(payload);
        toast.success("Proveedor creado correctamente");
      }

      onSuccess();
    } catch (error) {
      console.error("Error en el formulario:", error);
      if (
        error.validationErrors &&
        Array.isArray(error.validationErrors) &&
        error.validationErrors.length > 0
      ) {
        toast.error(
          `Validacion fallida: ${error.validationErrors.join(". ")}`,
          { autoClose: 5000 }
        );
      } else {
        toast.error(error.message || "Error al guardar proveedor");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (label, name, options = {}) => (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        type={options.type || "text"}
        name={name}
        id={name}
        autoComplete={options.autoComplete || "off"}
        value={formData[name] || ""}
        onChange={handleChange}
        readOnly={options.readOnly || false}
        disabled={options.disabled || false}
        required={options.required || false}
        className={`w-full rounded-lg border px-3 py-2 text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 ${
          validationErrors[name]
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        } ${options.readOnly || options.disabled ? "cursor-not-allowed bg-gray-200" : "bg-white"}`}
      />
      {validationErrors[name] ? (
        <p className="mt-1 text-xs text-red-500">{validationErrors[name]}</p>
      ) : null}
    </div>
  );

  const renderSelectField = (label, name, options, fieldOptions = {}) => (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <select
        name={name}
        id={name}
        value={formData[name]}
        onChange={handleChange}
        disabled={fieldOptions.disabled || false}
        className={`w-full rounded-lg border px-3 py-2 text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 ${
          validationErrors[name]
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        } ${fieldOptions.disabled ? "cursor-not-allowed bg-gray-200" : "bg-white"}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {validationErrors[name] ? (
        <p className="mt-1 text-xs text-red-500">{validationErrors[name]}</p>
      ) : null}
    </div>
  );

  const tiposProductoActivos = tiposProducto.filter(
    (tipoProducto) => tipoProducto.activo !== false
  );

  const tipoProductoMap = buildTipoProductoMap(tiposProducto, proveedor);
  const tiposSeleccionados = formData.tipoProductoIds
    .map((tipoProductoId) => tipoProductoMap.get(Number(tipoProductoId)))
    .filter(Boolean);
  const solicitudesTemporalesDisponibles = [
    ...(Array.isArray(proveedor?.solicitudesTipoProducto)
      ? proveedor.solicitudesTipoProducto
      : []),
    ...solicitudesRegistradas,
  ].reduce((acc, solicitud) => {
    if (!solicitud?.id) return acc;
    if (
      !["PENDIENTE", "OBSERVADO"].includes(String(solicitud.estado || ""))
    ) {
      return acc;
    }
    if (!acc.some((item) => item.id === solicitud.id)) {
      acc.push(solicitud);
    }
    return acc;
  }, []);
  const solicitudesTemporalesSeleccionadas = formData.solicitudTipoProductoIds
    .map((solicitudId) =>
      solicitudesTemporalesDisponibles.find(
        (solicitud) => Number(solicitud.id) === Number(solicitudId)
      )
    )
    .filter(Boolean);

  const proveedorContext = {
    id: proveedor?.id || null,
    razonSocial: formData.razonSocial,
    ruc: formData.ruc,
  };

  const handleTiposSeleccionados = ({
    tipoProductoIds,
    solicitudTipoProductoIds,
  }) => {
    setFormData((prev) => ({
      ...prev,
      tipoProductoIds,
      solicitudTipoProductoIds,
    }));
    setValidationErrors((prev) => ({ ...prev, tipoProductoIds: undefined }));
  };

  const handleSolicitudCreada = (solicitud) => {
    setSolicitudesRegistradas((prev) => [
      solicitud,
      ...prev.filter((item) => item.id !== solicitud.id),
    ]);
    setFormData((prev) => ({
      ...prev,
      solicitudTipoProductoIds: [
        ...new Set([...(prev.solicitudTipoProductoIds || []), solicitud.id]),
      ],
    }));
    fetchTiposProducto();
    setValidationErrors((prev) => ({ ...prev, tipoProductoIds: undefined }));
  };

  return (
    <>
      <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:p-6 md:p-8">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          {proveedor?.id ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
        </h2>

        {(loading || loadingSunat || loadingTiposProducto) && <Loader />}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <fieldset className="rounded-lg border border-gray-300 p-4">
            <legend className="px-2 text-lg font-semibold text-gray-700">
              Datos de Gestion Interna
            </legend>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {renderSelectField(
                "Procedencia",
                "procedencia",
                [
                  { value: "NACIONAL", label: "Nacional" },
                  { value: "EXTRANJERO", label: "Extranjero" },
                ],
                { disabled: isProcedenciaDisabled }
              )}

              {formData.procedencia === "NACIONAL"
                ? renderInputField("RUC", "ruc", {
                    readOnly: Boolean(proveedor?.id),
                    disabled: disableRucField,
                    required: true,
                  })
                : null}

              {renderInputField("Nombre / Razon Social", "razonSocial", {
                required: true,
              })}
              {renderInputField("Direccion Completa", "direccion", {
                required: true,
              })}
              {renderInputField("Telefono", "telefono", {
                type: "tel",
                required: true,
              })}
              {renderInputField("Representante", "representante")}
              {renderInputField("Persona de Contacto", "contacto")}
              {renderInputField("Correo Electronico", "correoElectronico", {
                type: "email",
                required: true,
              })}
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Tipos de producto que vende
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Puedes usar tipos oficiales o marcar tipos temporales
                    pendientes. Solo los oficiales participan luego en
                    cotizaciones.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTiposModal(true)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Buscar tipos
                  </button>
                  {formData.tipoProductoIds.length > 0 ||
                  formData.solicitudTipoProductoIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleTiposSeleccionados({
                          tipoProductoIds: [],
                          solicitudTipoProductoIds: [],
                        })
                      }
                      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      Limpiar seleccion
                    </button>
                  ) : null}
                </div>
              </div>

              {tiposSeleccionados.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tiposSeleccionados.map((tipoProducto) => (
                    <div
                      key={tipoProducto.id}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-blue-900">
                        {tipoProducto.nombre}
                      </p>
                      <p className="text-xs text-blue-700">
                        {tipoProducto.prefijo || "Sin prefijo"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500">
                  Aun no has seleccionado tipos oficiales para este proveedor.
                </div>
              )}

              {solicitudesTemporalesSeleccionadas.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Tipos temporales marcados
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Estos tipos permiten registrar el proveedor, pero no se
                    usaran en solicitudes de cotizacion ni en el flujo operativo
                    hasta ser homologados.
                  </p>
                  <div className="mt-3 space-y-2">
                    {solicitudesTemporalesSeleccionadas.map((solicitud) => (
                      <div
                        key={solicitud.id}
                        className="flex flex-col gap-1 rounded-md border border-amber-100 bg-white px-3 py-2 text-sm text-gray-700 md:flex-row md:items-center md:justify-between"
                      >
                        <span>{solicitud.nombrePropuesto}</span>
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          {solicitud.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {solicitudesRegistradas.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Solicitudes registradas en esta edicion
                  </p>
                  <div className="mt-3 space-y-2">
                    {solicitudesRegistradas.map((solicitud) => (
                      <div
                        key={solicitud.id}
                        className="flex flex-col gap-1 rounded-md border border-amber-100 bg-white px-3 py-2 text-sm text-gray-700 md:flex-row md:items-center md:justify-between"
                      >
                        <span>{solicitud.nombrePropuesto}</span>
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          {solicitud.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {validationErrors.tipoProductoIds ? (
                <p className="text-xs text-red-500">
                  {validationErrors.tipoProductoIds}
                </p>
              ) : null}
            </div>
          </fieldset>

          {formData.procedencia === "NACIONAL" ? (
            <fieldset className="rounded-lg border border-gray-300 p-4">
              <legend className="px-2 text-lg font-semibold text-gray-700">
                Datos Obtenidos de SUNAT
              </legend>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {renderInputField("Estado", "estado", { readOnly: true })}
                {renderInputField("Condicion", "condicion", { readOnly: true })}
                {renderInputField("Tipo", "tipo", { readOnly: true })}
                {renderInputField("Act. CIIU3 Principal", "actividadCIIU3Principal", {
                  readOnly: true,
                })}
                {renderInputField(
                  "Act. CIIU3 Secundaria",
                  "actividadCIIU3Secundaria",
                  {
                    readOnly: true,
                  }
                )}
                {renderInputField("Act. CIIU4 Principal", "actividadCIIU4Principal", {
                  readOnly: true,
                })}
                {renderInputField("Nro. Trabajadores", "nroTrabajadores", {
                  readOnly: true,
                })}
                {renderInputField("Periodo Publicacion", "periodoPublicacion", {
                  readOnly: true,
                })}
                {renderInputField("Tipo Facturacion", "tipoFacturacion", {
                  readOnly: true,
                })}
                {renderInputField("Tipo Contabilidad", "tipoContabilidad", {
                  readOnly: true,
                })}
                {renderInputField("Comercio Exterior", "comercioExterior", {
                  readOnly: true,
                })}
                {renderInputField("Ubigeo", "ubigeo", { readOnly: true })}
                {renderInputField("Departamento", "departamento", {
                  readOnly: true,
                })}
                {renderInputField("Provincia", "provincia", { readOnly: true })}
                {renderInputField("Distrito", "distrito", { readOnly: true })}
              </div>
            </fieldset>
          ) : null}

          <div className="mt-6 border-t pt-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="activo"
                id="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="activo"
                className="text-sm font-medium text-gray-700"
              >
                Proveedor Activo
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:justify-end sm:space-x-4 sm:space-y-0">
            {isPrintable ? (
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="w-full rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 sm:w-auto"
              >
                Vista Previa Impresion
              </button>
            ) : null}

            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-md bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || loadingSunat || loadingTiposProducto}
              className="w-full rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading
                ? "Guardando..."
                : proveedor?.id
                  ? "Actualizar Proveedor"
                  : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>

      <ModalBuscarTiposProducto
        isOpen={showTiposModal}
        onClose={() => setShowTiposModal(false)}
        tiposProducto={tiposProductoActivos}
        loadingTiposProducto={loadingTiposProducto}
        initialSelectedIds={formData.tipoProductoIds}
        initialSelectedSolicitudIds={formData.solicitudTipoProductoIds}
        solicitudesTemporalesDisponibles={solicitudesTemporalesDisponibles}
        onSaveSelection={handleTiposSeleccionados}
        proveedorContext={proveedorContext}
        onSolicitudCreada={handleSolicitudCreada}
      />

      <Modal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        title="Vista Previa de Impresion"
        maxWidth="max-w-4xl"
      >
        <ProveedorPrintPreview
          proveedor={formData}
          onCancel={() => setShowPrintPreview(false)}
        />
      </Modal>
    </>
  );
};

export default FormularioProveedor;
