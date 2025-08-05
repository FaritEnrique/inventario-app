import { useEffect, useState } from 'react';
import usersApi from '../api/usersApi';
import apiFetch from '../api/apiFetch'; // ✅ Importamos apiFetch para la lógica

const useUsers = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarUsuarios = async () => {
    try {
      const data = await usersApi.obtenerTodos();
      setUsuarios(data);
    } catch (error) {
      // ✅ No hacemos nada aquí porque el 401 es un comportamiento esperado
      // cuando no hay sesión. El componente ya lo manejará.
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const crearUsuario = async (usuario) => {
    // Obtenemos el token para decidir qué ruta usar
    const token = localStorage.getItem('token');
    let nuevo;

    try {
      if (!token) {
        // ✅ Si NO hay token, usamos la ruta pública para crear el primer usuario
        nuevo = await apiFetch('usuarios/primer-usuario', {
          method: 'POST',
          body: JSON.stringify(usuario),
        });
      } else {
        // ✅ Si SÍ hay token, usamos la ruta protegida normal
        nuevo = await usersApi.crear(usuario);
      }
      
      setUsuarios([...usuarios, nuevo]);
      return nuevo;
    } catch (error) {
      // ✅ El hook simplemente lanza el error para que el componente que lo llama lo capture.
      throw error;
    }
  };

  const actualizarUsuario = async (id, usuario) => {
    try {
      const actualizado = await usersApi.actualizar(id, usuario);
      setUsuarios(
        usuarios.map((u) => (u.id === id ? actualizado : u))
      );
    } catch (error) {
      throw error;
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await usersApi.eliminar(id);
      setUsuarios(usuarios.filter((u) => u.id !== id));
    } catch (error) {
      throw error;
    }
  };

  return {
    usuarios,
    cargando,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
  };
};

export default useUsers;