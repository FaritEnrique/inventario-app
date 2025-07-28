const baseURL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:3000'
    : '';

const apiFetch = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al conectar con el servidor');
    }

    if (res.status === 204) return null;
    return await res.json();
  } catch (error) {
    console.error('❌ Error en apiFetch:', error.message);
    throw error;
  }
};

export default apiFetch;