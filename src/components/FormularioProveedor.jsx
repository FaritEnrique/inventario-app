import React, { useState, useEffect } from "react";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";
import useDebounce from "../hooks/useDebounce";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import Modal from "./Modal";
import ProveedorPrintPreview from "./ProveedorPrintPreview";

// --- Funciones Auxiliares (Fuera del Componente) ---

const getInitialFormData = () => ({
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
  activo: true,
});

// CORREGIDO: Mapeo completo de los datos de SUNAT
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
  const fieldsToVerify = Object.keys(getInitialFormData());
  return fieldsToVerify.every(field => {
    const value = data[field];
    if (typeof value === 'boolean') return true;
    return value !== null && value !== '' && value !== undefined;
  });
};

// --- Componente Principal ---

const FormularioProveedor = ({ proveedor, onSuccess, onCancel }) => {
  const { crearProveedor, actualizarProveedor } = useProveedores();
  const { consultarPadronSunat, loading: loadingSunat } = useSunat();

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isPrintable, setIsPrintable] = useState(false);

  const debouncedRuc = useDebounce(formData.ruc, 500);

  useEffect(() => {
    if (proveedor) {
      const initialState = getInitialFormData();
      const finalState = { ...initialState, ...proveedor };
      setFormData(finalState);
    } else {
      setFormData(getInitialFormData());
    }
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
      if (!proveedor?.id && debouncedRuc && debouncedRuc.length === 11) {
        const datos = await consultarPadronSunat(debouncedRuc);
        if (datos) {
          const mappedData = mapSunatDataToFormData(datos);
          setFormData((prev) => ({ ...prev, ...mappedData }));
          toast.success("Datos de SUNAT cargados correctamente.");
        } else {
          toast.info(
            "RUC no encontrado en SUNAT. Puede continuar con el registro manual."
          );
        }
      }
    };
    fetchSunatData();
  }, [debouncedRuc, proveedor?.id, consultarPadronSunat]);

  // CORREGIDO: Restaurada la lógica de mayúsculas/minúsculas
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (typeof finalValue === 'string') {
      if (name === 'correoElectronico') {
        finalValue = finalValue.toLowerCase();
      } else {
        finalValue = finalValue.toUpperCase();
      }
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.razonSocial.trim()) {
      toast.error("La Razón Social es obligatoria.");
      setLoading(false);
      return;
    }

    // Prepara el objeto de datos para el envío
    const proveedorData = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value === "") {
        proveedorData[key] = null; // Convierte strings vacíos a null
      } else {
        proveedorData[key] = value;
      }
    }

    // Limpia el número de teléfono para que coincida con la validación del backend
    if (proveedorData.telefono) {
      proveedorData.telefono = proveedorData.telefono.replace(/\s/g, '');
    }

    // NOTA: No se convierte nroTrabajadores a Int, el schema de Joi espera un String.

    try {
      if (proveedor?.id) {
        await actualizarProveedor(proveedor.id, proveedorData);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await crearProveedor(proveedorData);
        toast.success("Proveedor creado correctamente");
      }
      onSuccess();
    } catch (error) {
      console.error("Error en el formulario:", error);
      if (error.validationErrors && error.validationErrors.length > 0) {
        error.validationErrors.forEach(err => toast.error(err));
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
        className="block mb-1 text-sm font-medium text-gray-700"
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
        required={options.required || false}
        className={`w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
          options.readOnly ? "bg-gray-200 cursor-not-allowed" : "bg-white"
        }`}
      />
    </div>
  );

  return (
    <>
      <div className="max-w-6xl p-4 mx-auto bg-white border border-gray-200 rounded-lg shadow-lg sm:p-6 md:p-8">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          {proveedor?.id ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
        </h2>
        {(loading || loadingSunat) && <Loader />}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <fieldset className="p-4 border border-gray-300 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-700">
              Datos de Gestión Interna
            </legend>
            <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2 lg:grid-cols-3">
              {renderInputField("RUC", "ruc", { readOnly: !!proveedor?.id })}
              {renderInputField("Razón Social", "razonSocial", { required: true })}
              {renderInputField("Dirección Completa", "direccion")}
              {renderInputField("Teléfono", "telefono", { type: "tel", required: true })}
              {renderInputField("Representante", "representante")}
              {renderInputField("Persona de Contacto", "contacto")}
              {renderInputField("Correo Electrónico", "correoElectronico", { type: "email", required: true })}
            </div>
          </fieldset>

          <fieldset className="p-4 border border-gray-300 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-700">
              Datos Obtenidos de SUNAT
            </legend>
            <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderInputField("Estado", "estado", { readOnly: true })}
              {renderInputField("Condición", "condicion", { readOnly: true })}
              {renderInputField("Tipo", "tipo", { readOnly: true })}
              {renderInputField("Act. CIIU3 Principal", "actividadCIIU3Principal", { readOnly: true })}
              {renderInputField("Act. CIIU3 Secundaria", "actividadCIIU3Secundaria", { readOnly: true })}
              {renderInputField("Act. CIIU4 Principal", "actividadCIIU4Principal", { readOnly: true })}
              {renderInputField("Nro. Trabajadores", "nroTrabajadores", { readOnly: true })}
              {renderInputField("Periodo Publicación", "periodoPublicacion", { readOnly: true })}
              {renderInputField("Tipo Facturación", "tipoFacturacion", { readOnly: true })}
              {renderInputField("Tipo Contabilidad", "tipoContabilidad", { readOnly: true })}
              {renderInputField("Comercio Exterior", "comercioExterior", { readOnly: true })}
              {renderInputField("Ubigeo", "ubigeo", { readOnly: true })}
              {renderInputField("Departamento", "departamento", { readOnly: true })}
              {renderInputField("Provincia", "provincia", { readOnly: true })}
              {renderInputField("Distrito", "distrito", { readOnly: true })}
            </div>
          </fieldset>

          <div className="pt-6 mt-6 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="activo"
                id="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                Proveedor Activo
              </label>
            </div>
          </div>

          <div className="flex flex-col mt-8 space-y-4 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-4">
            {isPrintable && (
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="w-full px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 bg-green-600 rounded-md sm:w-auto hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Vista Previa Impresión
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-6 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 bg-gray-200 rounded-md sm:w-auto hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingSunat}
              className="w-full px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-md sm:w-auto hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : proveedor?.id ? "Actualizar Proveedor" : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>

      <Modal 
        isOpen={showPrintPreview} 
        onClose={() => setShowPrintPreview(false)} 
        title="Vista Previa de Impresión"
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