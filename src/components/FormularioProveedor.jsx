import React, { useState, useEffect } from 'react';
import useProveedores from '../hooks/useProveedores';
import useSunat from '../hooks/useSunat';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

// Opciones predefinidas basadas en los criterios de SUNAT
const ESTADOS = [
  'ACTIVO',
  'BAJA PROVISIONAL',
  'BAJA DEFINITIVA',
  'SUSPENSION TEMPORAL',
  'INACTIVO',
];

const CONDICIONES = [
  'HABIDO',
  'NO HABIDO'
];

const TIPOS = [
  'PERSONA NATURAL',
  'PERSONA JURIDICA'
];

const FormularioProveedor = ({ proveedor, onSuccess, onCancel }) => {
  const { crearProveedor, actualizarProveedor } = useProveedores();
  const { consultarPadronSunat, loading: loadingSunat } = useSunat();

  const [formData, setFormData] = useState({
    ruc: '',
    nombre: '',
    nombreComercial: '',
    estado: '',
    condicion: '',
    direccion: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    contacto: '',
    telefono: '',
    email: '',
    tipo: '',
    activo: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proveedor) {
      setFormData({
        ruc: proveedor.ruc || '',
        nombre: proveedor.nombre || '',
        nombreComercial: proveedor.nombreComercial || '',
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        activo: proveedor.activo,
        direccion: proveedor.direccion || '',
        estado: proveedor.estado || '',
        condicion: proveedor.condicion || '',
        departamento: proveedor.departamento || '',
        provincia: proveedor.provincia || '',
        distrito: proveedor.distrito || '',
        ubigeo: proveedor.ubigeo || '',
        tipo: proveedor.tipo || '',
      });
    }
  }, [proveedor]);

  useEffect(() => {
    const fetchSunatData = async () => {
      if (!proveedor && formData.ruc && formData.ruc.length === 11) {
        const datos = await consultarPadronSunat(formData.ruc);
        if (datos) {
          setFormData((prev) => ({
            ...prev,
            nombre: datos.nombre || prev.nombre,
            nombreComercial: datos.nombreComercial || prev.nombreComercial,
            estado: datos.estado || prev.estado,
            condicion: datos.condicion || prev.condicion,
            direccion: datos.direccion || prev.direccion,
            departamento: datos.departamento || prev.departamento,
            provincia: datos.provincia || prev.provincia,
            distrito: datos.distrito || prev.distrito,
            ubigeo: datos.ubigeo || prev.ubigeo,
            tipo: datos.tipo || prev.tipo,
          }));
          toast.success("Datos cargados desde SUNAT");
        } else {
          toast.info("No se encontró información para este RUC");
        }
      }
    };
    fetchSunatData();
  }, [formData.ruc, proveedor, consultarPadronSunat]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = { ...formData, nombre: formData.nombre };
      if (proveedor?.id) {
        await actualizarProveedor(proveedor.id, dataToSave);
      } else {
        await crearProveedor(dataToSave);
      }
      onSuccess();
    } catch (error) {
      console.error('Error en el formulario:', error);
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

          <div>
            <label htmlFor="ruc" className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
            <input
              type="text"
              name="ruc"
              id="ruc"
              autoComplete="off"
              value={formData.ruc}
              onChange={handleChange}
              readOnly={!!proveedor?.id && !!formData.nombre}
              className={`w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${!!proveedor?.id && !!formData.nombre ? 'cursor-not-allowed' : 'bg-white'}`}
              required
            />
          </div>

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              autoComplete="organization"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="nombreComercial" className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
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

          <div>
            <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
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

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
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

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
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

          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              id="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <option value="">Seleccione un estado</option>
              {ESTADOS.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condicion" className="block text-sm font-medium text-gray-700 mb-1">Condición</label>
            <select
              name="condicion"
              id="condicion"
              value={formData.condicion}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <option value="">Seleccione una condición</option>
              {CONDICIONES.map(condicion => (
                <option key={condicion} value={condicion}>{condicion}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Proveedor</label>
            <select
              name="tipo"
              id="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <option value="">Seleccione un tipo</option>
              {TIPOS.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

        </div>

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
            {loading ? 'Guardando...' : (proveedor?.id ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioProveedor;