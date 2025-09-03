import React, { useState, useEffect } from 'react';
import useProveedores from '../hooks/useProveedores';
import useSunat from '../hooks/useSunat';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const FormularioProveedor = ({ proveedor, onSuccess, onCancel }) => {
  const { crearProveedor, actualizarProveedor } = useProveedores();
  const { consultarPadronSunat, loading: loadingSunat } = useSunat();

  const [formData, setFormData] = useState({
    ruc: '',
    razonSocial: '',
    nombreComercial: '',
    direccion: '',
    ubigeo: '',
    contacto: '',
    correoElectronico: '',
    telefono: '',
    activo: true,
  });

  const [loading, setLoading] = useState(false);

  // Cargar proveedor en edición
    useEffect(() => {
    if (proveedor) {
      // Para evitar warnings de "controlled input", nos aseguramos de que el proveedor no sea nulo
      const p = proveedor || {};
      setFormData({
        ruc: p.ruc || '',
        // Usar razonSocial si existe (para editar), si no, usar nombreComercial (para crear desde SUNAT)
        razonSocial: p.razonSocial || p.nombreComercial || '',
        nombreComercial: p.nombreComercial || '',
        contacto: p.contacto || '',
        telefono: p.telefono || '',
        correoElectronico: p.correoElectronico || '',
        direccion: p.direccion || '',
        ubigeo: p.ubigeo || '',
        // Asegurar que 'activo' siempre tenga un valor booleano
        activo: p.activo !== undefined ? p.activo : true,
      });
    }
  }, [proveedor]);

  // Consultar SUNAT automáticamente si es nuevo proveedor
  useEffect(() => {
    const fetchSunatData = async () => {
      if (!proveedor && formData.ruc && formData.ruc.length === 11) {
        const datos = await consultarPadronSunat(formData.ruc);
        if (datos) {
          setFormData((prev) => ({
            ...prev,
            razonSocial: datos.razonSocial || prev.razonSocial,
            nombreComercial: datos.nombreComercial || prev.nombreComercial,
            direccion: datos.direccion || prev.direccion,
            ubigeo: datos.ubigeo || prev.ubigeo,
          }));
          toast.success('Datos cargados desde SUNAT');
        } else {
          toast.info('No se encontró información para este RUC, puedes ingresarlo manualmente');
        }
      }
    };
    fetchSunatData();
  }, [formData.ruc, proveedor, consultarPadronSunat]);

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
      toast.error('Error al guardar proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-sky-200 shadow-xl rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {proveedor?.id ? 'Editar Proveedor' : 'Crear Proveedor'}
      </h2>
      {(loading || loadingSunat) && <Loader />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* RUC */}
          <div>
            <label htmlFor="ruc" className="block text-sm font-medium text-gray-700 mb-1">
              RUC
            </label>
            <input
              type="text"
              name="ruc"
              id="ruc"
              autoComplete="off"
              value={formData.ruc}
              onChange={handleChange}
              readOnly={!!proveedor?.id} 
              className={`w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                !!proveedor?.id ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
              required
            />
          </div>

          {/* Razón Social */}
          <div>
            <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700 mb-1">
              Razón Social
            </label>
            <input
              type="text"
              name="razonSocial"
              id="razonSocial"
              autoComplete="organization"
              value={formData.razonSocial}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Nombre Comercial */}
          <div>
            <label htmlFor="nombreComercial" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Comercial
            </label>
            <input
              type="text"
              name="nombreComercial"
              id="nombreComercial"
              autoComplete="organization-title"
              value={formData.nombreComercial}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Contacto */}
          <div>
            <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-1">
              Contacto
            </label>
            <input
              type="text"
              name="contacto"
              id="contacto"
              autoComplete="name"
              value={formData.contacto}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              id="telefono"
              autoComplete="tel"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Correo */}
          <div>
            <label htmlFor="correoElectronico" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correoElectronico"
              id="correoElectronico"
              autoComplete="email"
              value={formData.correoElectronico}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Dirección */}
          <div className="md:col-span-2">
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              id="direccion"
              autoComplete="street-address"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Ubigeo */}
          <div>
            <label htmlFor="ubigeo" className="block text-sm font-medium text-gray-700 mb-1">
              Ubigeo
            </label>
            <input
              type="text"
              name="ubigeo"
              id="ubigeo"
              value={formData.ubigeo}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
              Activo
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end mt-6 space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : proveedor?.id ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioProveedor;