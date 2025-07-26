// src/pages/UsersPage.jsx
import React, { useState } from 'react';
import useUsers from '../hooks/useUsers';

const UsersPage = () => {
  const {
    usuarios,
    cargando,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
  } = useUsers();

  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: '',
    email: '',
    password: '',
    areaId: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await crearUsuario(nuevoUsuario);
    setNuevoUsuario({ name: '', email: '', password: '', areaId: '' });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" value={nuevoUsuario.name} onChange={handleChange} placeholder="Nombre" className="p-2 border rounded" required />
        <input name="email" value={nuevoUsuario.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" required />
        <input name="password" value={nuevoUsuario.password} onChange={handleChange} placeholder="Contraseña" className="p-2 border rounded" required />
        <input name="areaId" value={nuevoUsuario.areaId} onChange={handleChange} placeholder="ID de Área (opcional)" className="p-2 border rounded" />
        <button type="submit" className="col-span-1 md:col-span-2 bg-blue-600 text-white p-2 rounded">Crear Usuario</button>
      </form>

      {cargando ? (
        <p>Cargando usuarios...</p>
      ) : (
        <ul className="space-y-2">
          {usuarios.map((user) => (
            <li key={user.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <p><strong>{user.name}</strong> - {user.email}</p>
                <p className="text-sm text-gray-500">Área: {user.area?.nombre || 'Sin área'}</p>
              </div>
              <button onClick={() => eliminarUsuario(user.id)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UsersPage;