// src/hooks/useUsers.js
import { useEffect, useState } from 'react';
import usersApi from '../api/usersApi';

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
    const nuevo = await usersApi.crear(usuario);
    setUsuarios([...usuarios, nuevo]);
  };

  const actualizarUsuario = async (id, usuario) => {
    const actualizado = await usersApi.actualizar(id, usuario);
    setUsuarios(
      usuarios.map((u) => (u.id === id ? actualizado : u))
    );
  };

  const eliminarUsuario = async (id) => {
    await usersApi.eliminar(id);
    setUsuarios(usuarios.filter((u) => u.id !== id));
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