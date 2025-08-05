// src/pages/SolicitarRestablecimientoPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiFetch from '../api/apiFetch';

const SolicitarRestablecimientoPage = () => {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      await apiFetch('auth/solicitar-restablecimiento', { // ✅ Endpoint corregido
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      toast.success('Si el correo existe, se ha enviado un enlace para restablecer la contraseña.');
      navigate('/login');
    } catch (error) {
      console.error('Error al solicitar restablecimiento:', error);
      toast.error('Ocurrió un error. Por favor, inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold text-center mb-6 text-indigo-700">Restablecer Contraseña</h2>
        <p className="text-sm text-center text-gray-600 mb-4">
          Ingresa tu dirección de correo electrónico para recibir un enlace de restablecimiento.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400"
            disabled={cargando}
          >
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SolicitarRestablecimientoPage;