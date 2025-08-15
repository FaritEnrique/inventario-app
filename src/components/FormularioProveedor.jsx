// src/components/FormularioProveedor.jsx
import React, { useState, useEffect } from 'react';
import useProveedores from '../hooks/useProveedores';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const FormularioProveedor = ({ proveedor, onSuccess }) => {
  const { crearProveedor, actualizarProveedor } = useProveedores();
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        ruc: proveedor.ruc || '',
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
      });
    }
  }, [proveedor]);

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
      if (proveedor) {
        await actualizarProveedor(proveedor.id, formData);
      } else {
        await crearProveedor(formData);
      }
      onSuccess();
    } catch (error) {
      // La notificación de error ya la maneja el hook useProveedores
      console.error('Error en el formulario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {loading && <Loader />}
      
      <div className="mb-4">
        <label htmlFor="nombre" className="block text-gray-700 font-bold mb-2">Nombre</label>
        <input 
          type="text" 
          name="nombre" 
          id="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="ruc" className="block text-gray-700 font-bold mb-2">RUC</label>
        <input 
          type="text" 
          name="ruc" 
          id="ruc"
          value={formData.ruc}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="contacto" className="block text-gray-700 font-bold mb-2">Contacto</label>
        <input 
          type="text" 
          name="contacto" 
          id="contacto"
          value={formData.contacto}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="telefono" className="block text-gray-700 font-bold mb-2">Teléfono</label>
        <input 
          type="text" 
          name="telefono" 
          id="telefono"
          value={formData.telefono}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email</label>
        <input 
          type="email" 
          name="email" 
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="direccion" className="block text-gray-700 font-bold mb-2">Dirección</label>
        <input 
          type="text" 
          name="direccion" 
          id="direccion"
          value={formData.direccion}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="flex items-center justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Guardando...' : (proveedor ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};

export default FormularioProveedor;