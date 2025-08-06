// src/hooks/useUsers.js

import { useEffect, useState } from 'react';
import usersApi from '../api/usersApi';
import apiFetch from '../api/apiFetch';

const useUsers = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarUsuarios = async () => {
    try {
      const data = await usersApi.obtenerTodos();
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const crearUsuario = async (usuario) => {
    const token = localStorage.getItem('token');
    let nuevo;
    try {
      if (!token) {
        // Si NO hay token, usamos la ruta pública para crear el primer usuario
        nuevo = await apiFetch('usuarios/primer-usuario', {
          method: 'POST',
          body: JSON.stringify(usuario),
        });
      } else {
        // Si SÍ hay token, usamos la ruta protegida normal
        nuevo = await usersApi.crear(usuario);
      }
      
      setUsuarios([...usuarios, nuevo]);
      return nuevo;
    } catch (error) {
      throw error;
    }
  };

  const actualizarUsuario = async (id, datos) => {
    try {
      // ✅ PASO 1: Ajustamos el parámetro para enviar solo los datos necesarios
      // Y aseguramos que se envíe el rangoId
      const actualizado = await usersApi.actualizar(id, datos);
      setUsuarios(
        usuarios.map((u) => (u.id === id ? actualizado : u))
      );
      return actualizado; // ✅ Retornamos el objeto actualizado
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
    cargarUsuarios // ✅ Agregamos esta función para poder recargar la lista
  };
};

export default useUsers;