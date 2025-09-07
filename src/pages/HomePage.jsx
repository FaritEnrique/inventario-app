import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiFetch from '../api/apiFetch';

// Icono simple para el ojo
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

// Icono para el ojo tachado
const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l16 16a1 1 0 001.414-1.414l-16-16zm.186 6.364A9.957 9.957 0 0110 5c4.478 0 8.268 2.943 9.542 7a1 1 0 01-1.42 1.405C16.91 10.978 13.974 9 10 9c-.198 0-.395.006-.59.018l-1.396-1.396zm.26 6.375l2.673-2.673A9.948 9.948 0 0010 15c4.478 0 8.268-2.943 9.542-7a1 1 0 00-1.42-1.405c-1.236 1.155-2.868 2.062-4.675 2.58l-1.427-1.427 3.32-3.32a1 1 0 00-1.414-1.414l-16 16z" clipRule="evenodd" />
  </svg>
);

const HomePage = () => {
  const [cargando, setCargando] = useState(true);
  const [usuariosExisten, setUsuariosExisten] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: '',
    email: '',
    password: '',
    cargo: '',
  });

  useEffect(() => {
    const verificarUsuarios = async () => {
      try {
        const data = await apiFetch('usuarios/count');

        if (data.count === 0) {
          setUsuariosExisten(false);
        } else {
          setUsuariosExisten(true);
        }
      } catch (error) {
        console.error("Error al verificar usuarios:", error);
        toast.error(error.message || 'Error al conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    };
    verificarUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nuevo = await apiFetch('usuarios/primer-usuario', {
        method: 'POST',
        body: JSON.stringify(nuevoUsuario),
      });

      toast.success('Usuario administrador creado con éxito. Por favor, inicia sesión.');
      navigate('/login');
    } catch (error) {
      console.error("Error al crear el primer usuario:", error);
      toast.error(error.message || 'Error al crear el primer usuario.');
    }
  };

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!usuariosExisten) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-sm w-full mx-auto bg-white rounded-xl shadow-2xl p-6">
          <h1 className="text-2xl font-extrabold text-blue-600 mb-1 text-center">
            Crear cuenta de Administrador del Sistema
          </h1>
          <p className="mb-4 text-center text-gray-500 text-sm">
            Solo se puede realizar una vez para inicializar el sistema.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input
                id="name"
                type="text"
                name="name"
                value={nuevoUsuario.name}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-400 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={nuevoUsuario.email}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">Cargo</label>
              <input
                id="cargo"
                type="text"
                name="cargo"
                value={nuevoUsuario.cargo}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-400 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={nuevoUsuario.password}
                  onChange={handleChange}
                  className="block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
            >
              Crear Usuario Administrador
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">
          Bienvenido al Sistema de Inventario
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Gestiona tus productos, controla tu stock y mantén tu negocio organizado en todo momento.
        </p>
        <img
          src="/images/ImagenInventario.png"
          alt="Inventario"
          className="mx-auto w-96 object-cover mb-6 rounded-lg shadow-md"
        />
        <Link
          to="/login"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 px-6 rounded-xl transition duration-300"
         >
          Ingresar al sistema
        </Link>
      </div>
    </div>
  );
};

export default HomePage;