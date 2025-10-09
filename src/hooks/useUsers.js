// src/hooks/useUsers.js
import { useEffect, useState, useCallback } from 'react';
import usersApi from '../api/usersApi';
import apiFetch from '../api/apiFetch';

const useUsers = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Paginación y búsqueda
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Helper para normalizar respuesta (backend puede devolver array o objeto)
  const _normalizeListResponse = (res) => {
    if (Array.isArray(res)) {
      return { usuarios: res, totalPages: 1, currentPage: 1 };
    }
    // si el backend ya devuelve { usuarios, totalPages, currentPage } — lo usamos
    // else intentamos mapear variantes comunes
    return {
      usuarios: res.usuarios || res.data || res,
      totalPages: res.totalPages || Math.max(1, Math.ceil((res.totalItems || (Array.isArray(res) ? res.length : (res.data?.length || 0))) / 10)),
      currentPage: res.currentPage || res.page || page,
    };
  };

  const cargarUsuarios = useCallback(
    async (p = 1, q = '') => {
      setCargando(true);
      setError(null);
      try {
        const res = await usersApi.obtenerTodos({ page: p, search: q });
        const normalized = _normalizeListResponse(res);
        setUsuarios(normalized.usuarios || []);
        setTotalPages(normalized.totalPages || 1);
        setPage(normalized.currentPage || p);
        setSearch(q);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
        setError(err);
      } finally {
        setCargando(false);
      }
    },
    []
  );

  useEffect(() => {
    // carga inicial con page y search actuales
    cargarUsuarios(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo on mount

  // crear usuario: si no hay token asumimos crear primer usuario (ruta pública)
  const crearUsuario = useCallback(
    async (usuario) => {
      setCargando(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let nuevo;
        if (!token) {
          // ruta pública para primer usuario
          nuevo = await apiFetch('usuarios/primer-usuario', {
            method: 'POST',
            body: JSON.stringify(usuario),
          });
        } else {
          nuevo = await usersApi.crear(usuario);
        }
        // refetch para mantener consistencia (o podemos optimizar insert)
        await cargarUsuarios(page, search);
        return nuevo;
      } catch (err) {
        console.error('Error creando usuario:', err);
        setError(err);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [cargarUsuarios, page, search]
  );

  const actualizarUsuario = useCallback(
    async (id, datos) => {
      setCargando(true);
      setError(null);
      try {
        const actualizado = await usersApi.actualizar(id, datos);
        // actualizar localmente sin recargar toda la lista
        setUsuarios((prev) => prev.map((u) => (u.id === id ? actualizado : u)));
        return actualizado;
      } catch (err) {
        console.error('Error actualizando usuario:', err);
        setError(err);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    []
  );

  const eliminarUsuario = useCallback(
    async (id) => {
      setCargando(true);
      setError(null);
      try {
        await usersApi.eliminar(id);
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
      } catch (err) {
        console.error('Error eliminando usuario:', err);
        setError(err);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    []
  );

  const toggleActivo = useCallback(
    async (id, activo) => {
      setCargando(true);
      setError(null);
      try {
        const updated = await usersApi.toggleActivo(id, activo);
        // si backend retorna el usuario actualizado, lo aplicamos; si no, recargamos
        if (updated && updated.id) {
          setUsuarios((prev) => prev.map((u) => (u.id === id ? updated : u)));
        } else {
          await cargarUsuarios(page, search);
        }
        return updated;
      } catch (err) {
        console.error('Error cambiando estado activo:', err);
        setError(err);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [cargarUsuarios, page, search]
  );

  return {
    usuarios,
    cargando,
    error,
    page,
    totalPages,
    search,
    setPage,
    setSearch,
    cargarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    toggleActivo,
  };
};

export default useUsers;