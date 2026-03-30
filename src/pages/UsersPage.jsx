// src/pages/UsersPage.jsx
import React, { useState } from "react";
import useUsers from "../hooks/useUsers";

const UsersPage = () => {
  const { usuarios, cargando, crearUsuario, eliminarUsuario } = useUsers();

  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: "",
    email: "",
    password: "",
    areaId: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await crearUsuario(nuevoUsuario);
    setNuevoUsuario({ name: "", email: "", password: "", areaId: "" });
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Gestión de Usuarios</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <input
          name="name"
          value={nuevoUsuario.name}
          onChange={handleChange}
          placeholder="Nombre"
          className="rounded border p-2"
          required
        />
        <input
          name="email"
          value={nuevoUsuario.email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          className="rounded border p-2"
          required
        />
        <input
          name="password"
          value={nuevoUsuario.password}
          onChange={handleChange}
          placeholder="Contraseña"
          className="rounded border p-2"
          required
        />
        <input
          name="areaId"
          value={nuevoUsuario.areaId}
          onChange={handleChange}
          placeholder="ID de área (opcional)"
          className="rounded border p-2"
        />
        <button
          type="submit"
          className="col-span-1 rounded bg-blue-600 p-2 text-white md:col-span-2"
        >
          Crear usuario
        </button>
      </form>

      {cargando ? (
        <p>Cargando usuarios...</p>
      ) : (
        <ul className="space-y-2">
          {usuarios.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between rounded border p-4"
            >
              <div>
                <p>
                  <strong>{user.name}</strong> - {user.email}
                </p>
                <p className="text-sm text-gray-500">
                  Área: {user.area?.nombre || "Sin área"}
                </p>
              </div>
              <button
                onClick={() => eliminarUsuario(user.id)}
                className="rounded bg-red-500 px-3 py-1 text-white"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UsersPage;
