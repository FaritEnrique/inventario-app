import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const HomePage = () => {
  const [cargando, setCargando] = useState(true);
  const [usuariosExisten, setUsuariosExisten] = useState(true); // Inicializamos en true
  const navigate = useNavigate();

  // Estados para el formulario de creación
  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: '',
    email: '',
    password: '',
    areaId: null,
  });

  // useEffect para verificar si hay usuarios
  useEffect(() => {
    const verificarUsuarios = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/usuarios/count');
        if (!response.ok) {
          throw new Error('Error al conectar con el servidor.');
        }
        const data = await response.json();
        
        // Si no hay usuarios, actualizamos el estado
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

  // Manejadores para el formulario de creación
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/usuarios/primer-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoUsuario),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el primer usuario.');
      }
      
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

  // Lógica de renderizado condicional
  if (!usuariosExisten) {
    // Si no existen usuarios, mostramos el formulario de creación
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Crear Primer Usuario Administrador</h1>
          <p className="mb-6 text-center text-gray-600">Este paso solo se puede realizar una vez.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                name="name"
                value={nuevoUsuario.name}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={nuevoUsuario.email}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                name="password"
                value={nuevoUsuario.password}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full p-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Crear Usuario Administrador
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Si ya existen usuarios, mostramos el contenido original de HomePage
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