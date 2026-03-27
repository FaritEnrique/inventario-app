import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import useDebounce from "../hooks/useDebounce";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";
import useTipoProductos from "../hooks/useTipoProductos";
import Modal from "./Modal";
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
  activo: true,
});

const mapSunatDataToFormData = (sunatData) => ({
  ruc: sunatData.ruc || "",
  razonSocial: sunatData.razonSocial || "",
  estado: sunatData.estado || "",
  condicion: sunatData.condicion || "",
  tipo: sunatData.tipo || "",
  actividadCIIU3Principal: sunatData.actividadCIIU3Principal || "",
  actividadCIIU3Secundaria: sunatData.actividadCIIU3Secundaria || "",
  actividadCIIU4Principal: sunatData.actividadCIIU4Principal || "",
  nroTrabajadores: sunatData.nroTrabajadores || "",
  tipoFacturacion: sunatData.tipoFacturacion || "",
  tipoContabilidad: sunatData.tipoContabilidad || "",
  comercioExterior: sunatData.comercioExterior || "",
  ubigeo: sunatData.ubigeo || "",
  departamento: sunatData.departamento || "",
  provincia: sunatData.provincia || "",
  distrito: sunatData.distrito || "",
  periodoPublicacion: sunatData.periodoPublicacion || "",
  direccion: sunatData.direccion || "",
});

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

const FormularioProveedor = ({
  proveedor,
  onSuccess,
  onCancel,
  disableRucField,
}) => {
  const { crearProveedor, actualizarProveedor } = useProveedores();
  const { consultarPadronSunat, loading: loadingSunat } = useSunat();
  const { tiposProducto, cargando: loadingTiposProducto } = useTipoProductos();

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isPrintable, setIsPrintable] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isProcedenciaDisabled, setIsProcedenciaDisabled] = useState(false);

  const debouncedRuc = useDebounce(formData.ruc, 500);

  useEffect(() => {
    if (proveedor) {
      const nextState = {
        ...getInitialFormData(),
        ...proveedor,
        tipoProductoIds: getTipoProductoIdsFromProveedor(proveedor),
      };
      setFormData(nextState);

      if (proveedor.procedencia === "NACIONAL" && !proveedor.ruc) {
        toast.warn(
          "Este proveedor nacional no tiene RUC. Por favor, asigna un RUC o cambia su procedencia a Extranjero.",
          { autoClose: 8000 }
        );
        setIsProcedenciaDisabled(false);
      } else {
        setIsProcedenciaDisabled(Boolean(proveedor.id));
      }
      return;
    }

    setFormData(getInitialFormData());
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
        const datos = await consultarPadronSunat(debouncedRuc);
        if (datos) {
          const mappedData = mapSunatDataToFormData(datos);
          setFormData((prev) => ({ ...prev, ...mappedData }));
          toast.success("Datos de SUNAT cargados correctamente.");
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

  const toggleTipoProducto = (tipoProductoId) => {
    setFormData((prev) => {
      const normalizedId = Number(tipoProductoId);
      const alreadySelected = prev.tipoProductoIds.includes(normalizedId);
      return {
        ...prev,
        tipoProductoIds: alreadySelected
          ? prev.tipoProductoIds.filter((item) => item !== normalizedId)
          : [...prev.tipoProductoIds, normalizedId],
      };
    });
    setValidationErrors((prev) => ({ ...prev, tipoProductoIds: undefined }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.razonSocial.trim()) {
      errors.razonSocial = "El Nombre o Razon Social es obligatorio.";
    }

    if (!formData.direccion.trim()) {
      errors.direccion = "La Direccion es obligatoria.";
    }

    if (!formData.telefono.trim()) {
      errors.telefono = "El Telefono es obligatorio.";
    }

    if (
      formData.procedencia === "NACIONAL" &&
      !/^(10|20)\d{9}$/.test(formData.ruc)
    ) {
      errors.ruc = "El RUC es obligatorio para proveedores nacionales y debe ser valido.";
    }

    if (!formData.correoElectronico.trim()) {
      errors.correoElectronico = "El correo electronico es obligatorio.";
    }

    if (!Array.isArray(formData.tipoProductoIds) || !formData.tipoProductoIds.length) {
      errors.tipoProductoIds =
        "Debes seleccionar al menos un tipo de producto para el proveedor.";
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
      const { id, createdAt, updatedAt, especialidades, ...payload } = formData;

      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") payload[key] = null;
      });

      if (payload.telefono) {
        payload.telefono = payload.telefono.replace(/\s/g, "");
      }

      payload.tipoProductoIds = Array.isArray(formData.tipoProductoIds)
        ? formData.tipoProductoIds.map((value) => Number(value))
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
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

            <div className="mt-6">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Tipos de producto que vende
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Este campo es obligatorio y se usara luego para filtrar proveedores en la solicitud de cotizacion.
                </p>
              </div>

              {tiposProductoActivos.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tiposProductoActivos.map((tipoProducto) => {
                    const checked = formData.tipoProductoIds.includes(tipoProducto.id);
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
                <div className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500">
                  No hay tipos de producto activos disponibles.
                </div>
              )}

              {validationErrors.tipoProductoIds ? (
                <p className="mt-2 text-xs text-red-500">
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
                {renderInputField("Act. CIIU3 Secundaria", "actividadCIIU3Secundaria", {
                  readOnly: true,
                })}
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
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">
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
