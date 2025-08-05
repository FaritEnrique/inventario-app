// src/pages/RestablecerContrasenaPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiFetch from '../api/apiFetch';

const RestablecerContrasenaPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tokenValido, setTokenValido] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      toast.error('Token no encontrado en la URL.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (!token) {
      toast.error('Token de restablecimiento inválido.');
      return;
    }

    setCargando(true);
    try {
      await apiFetch('auth/restablecer-contraseña', { // ✅ Endpoint corregido
        method: 'POST',
        body: JSON.stringify({ token, nuevaContraseña: password }),
      });

      toast.success('Contraseña restablecida con éxito. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      console.error('Error al restablecer la contraseña:', error);
      toast.error(error.message || 'Error al restablecer la contraseña. El token pudo haber expirado.');
    } finally {
      setCargando(false);
    }
  };

  if (!tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded shadow">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p className="mt-2">El enlace de restablecimiento es inválido o ha expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold text-center mb-6 text-indigo-700">Nueva Contraseña</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Nueva Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Confirmar Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400"
            disabled={cargando}
          >
            {cargando ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RestablecerContrasenaPage;