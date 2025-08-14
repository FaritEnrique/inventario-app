//src/api/apiFetch.js
const baseURL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:3000/api'
    : '';

const apiFetch = async (endpoint, options = {}) => {
  try {
    const token = sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseURL}/${endpoint}`, {
      headers,
      ...options,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.mensaje || 'Error al conectar con el servidor');
    }

    if (res.status === 204) return null;
    return await res.json();
  } catch (error) {
    console.error('❌ Error en apiFetch:', error.message);
    throw error;
  }
};

export default apiFetch;