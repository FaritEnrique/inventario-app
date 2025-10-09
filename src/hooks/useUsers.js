import { useEffect, useState, useCallback } from 'react';
import usersApi from '../api/usersApi';
import apiFetch from '../api/apiFetch';

const useUsers = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const _normalizeListResponse = (res) => {
    if (Array.isArray(res)) {
      return { usuarios: res, totalPages: 1, currentPage: 1 };
    }
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
    cargarUsuarios(page, search);
  }, []);

  const crearUsuario = useCallback(
    async (usuario) => {
      setCargando(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let nuevo;
        if (!token) {
          nuevo = await apiFetch('usuarios/primer-usuario', {
            method: 'POST',
            body: JSON.stringify(usuario),
          });
        } else {
          nuevo = await usersApi.crear(usuario);
        }
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