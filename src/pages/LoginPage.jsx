// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/authContext';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    const result = await login(email, password);
    
    if (result.success) {
      toast.success('¡Inicio de sesión exitoso!');
      navigate('/dashboard');
    } else {
      // ✅ NUEVO: Limpiamos los campos del formulario al fallar
      setEmail('');
      setPassword('');

      if (result.error && result.error.includes('Credenciales')) {
        setIsErrorModalOpen(true);
      } else {
        toast.error(result.error || 'Ocurrió un error inesperado.');
      }
    }
    setCargando(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold text-center mb-6 text-indigo-700">Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1 font-medium text-gray-700">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1 font-medium text-gray-700">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400"
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/solicitar-restablecimiento"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

      <Modal
        isOpen={isErrorModalOpen}
        onRequestClose={() => setIsErrorModalOpen(false)}
        style={customStyles}
        contentLabel="Error de Credenciales"
      >
        <h3 className="text-xl font-bold mb-4">Error de Credenciales</h3>
        <p className="text-gray-700">
          El usuario o la contraseña que estás ingresando no coincide con la que está almacenada en la base de datos para ese usuario. Sólo pueden acceder a la plataforma usuarios autorizados.
        </p>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setIsErrorModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;