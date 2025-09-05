import React, { useState, useEffect } from 'react';
import useProveedores from '../hooks/useProveedores';
import useSunat from '../hooks/useSunat';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

// Mapea los datos de la API de SUNAT a la estructura del formulario
const mapSunatDataToFormData = (sunatData) => ({
  ruc: sunatData.ruc || '',
  razonSocial: sunatData.razonSocial || '',
  estado: sunatData.estado || '',
  condicion: sunatData.condicion || '',
  tipo: sunatData.tipo || '',
  actividadCIIU3Principal: sunatData.actividadCIIU3Principal || '',
  actividadCIIU3Secundaria: sunatData.actividadCIIU3Secundaria || '',
  actividadCIIU4Principal: sunatData.actividadCIIU4Principal || '',
  nroTrabajadores: sunatData.nroTrabajadores || '',
  tipoFacturacion: sunatData.tipoFacturacion || '',
  tipoContabilidad: sunatData.tipoContabilidad || '',
  comercioExterior: sunatData.comercioExterior || '',
  ubigeo: sunatData.ubigeo || '',
  departamento: sunatData.departamento || '',
  provincia: sunatData.provincia || '',
  distrito: sunatData.distrito || '',
  periodoPublicacion: sunatData.periodoPublicacion || '',
  direccion: sunatData.direccion || '',
});

const FormularioProveedor = ({ proveedor, onSuccess, onCancel }) => {
  const { crearProveedor, actualizarProveedor } = useProveedores();
  const { consultarPadronSunat, loading: loadingSunat } = useSunat();

  const getInitialFormData = () => ({
    ruc: '',
    razonSocial: '',
    estado: '',
    condicion: '',
    tipo: '',
    actividadCIIU3Principal: '',
    actividadCIIU3Secundaria: '',
    actividadCIIU4Principal: '',
    nroTrabajadores: '',
    tipoFacturacion: '',
    tipoContabilidad: '',
    comercioExterior: '',
    ubigeo: '',
    departamento: '',
    provincia: '',
    distrito: '',
    periodoPublicacion: '',
    direccion: '',
    representante: '',
    contacto: '',
    correoElectronico: '',
    telefono: '',
    activo: true,
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);

  const isRucRequired = !!proveedor?.id;

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
    const fetchSunatData = async () => {
      if (!proveedor?.id && formData.ruc && formData.ruc.length === 11) {
        const datos = await consultarPadronSunat(formData.ruc);
        if (datos) {
          const mappedData = mapSunatDataToFormData(datos);
          setFormData((prev) => ({ ...prev, ...mappedData }));
          toast.success('Datos de SUNAT cargados correctamente.');
        } else {
          toast.info('RUC no encontrado en SUNAT. Puede continuar con el registro manual.');
        }
      }
    };
    fetchSunatData();
  }, [formData.ruc, proveedor?.id, consultarPadronSunat]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.razonSocial.trim()) {
      toast.error('La Razón Social es obligatoria.');
      setLoading(false);
      return;
    }

    try {
      if (proveedor?.id) {
        await actualizarProveedor(proveedor.id, formData);
        toast.success('Proveedor actualizado correctamente');
      } else {
        await crearProveedor(formData);
        toast.success('Proveedor creado correctamente');
      }
      onSuccess();
    } catch (error) {
      console.error('Error en el formulario:', error);
      toast.error(error.message || 'Error al guardar proveedor');
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (label, name, options = {}) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={options.type || 'text'}
        name={name}
        id={name}
        autoComplete={options.autoComplete || 'off'}
        value={formData[name] || ''}
        onChange={handleChange}
        readOnly={options.readOnly || false}
        required={options.required || false}
        className={`w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
          options.readOnly ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
        }`}
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {proveedor?.id ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
      </h2>
      {(loading || loadingSunat) && <Loader />}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {/* --- Columna 1 --- */}
          <div className="flex flex-col space-y-4">
            {renderInputField('RUC', 'ruc', { readOnly: !!proveedor?.id, required: isRucRequired })}
            {renderInputField('Razón Social', 'razonSocial', { required: true })}
            {renderInputField('Representante', 'representante')}
            {renderInputField('Estado', 'estado')}
            {renderInputField('Condición', 'condicion')}
            {renderInputField('Tipo', 'tipo')}
          </div>

          {/* --- Columna 2 --- */}
          <div className="flex flex-col space-y-4">
            {renderInputField('Act. CIIU3 Principal', 'actividadCIIU3Principal')}
            {renderInputField('Act. CIIU3 Secundaria', 'actividadCIIU3Secundaria')}
            {renderInputField('Act. CIIU4 Principal', 'actividadCIIU4Principal')}
            {renderInputField('Nro. Trabajadores', 'nroTrabajadores')}
            {renderInputField('Periodo Publicación', 'periodoPublicacion')}
          </div>

          {/* --- Columna 3 --- */}
          <div className="flex flex-col space-y-4">
            {renderInputField('Tipo Facturación', 'tipoFacturacion')}
            {renderInputField('Tipo Contabilidad', 'tipoContabilidad')}
            {renderInputField('Comercio Exterior', 'comercioExterior')}
            {renderInputField('Ubigeo', 'ubigeo')}
            {renderInputField('Dirección Completa', 'direccion')}
          </div>

          {/* --- Columna 4 --- */}
          <div className="flex flex-col space-y-4">
            {renderInputField('Departamento', 'departamento')}
            {renderInputField('Provincia', 'provincia')}
            {renderInputField('Distrito', 'distrito')}
            {renderInputField('Persona de Contacto', 'contacto')}
            {renderInputField('Teléfono', 'telefono', { type: 'tel' })}
            {renderInputField('Correo Electrónico', 'correoElectronico', { type: 'email' })}
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
              Proveedor Activo
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || loadingSunat}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : proveedor?.id ? 'Actualizar Proveedor' : 'Crear Proveedor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioProveedor;
