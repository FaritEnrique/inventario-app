// src/components/UsuarioForm.jsx
import React, { useEffect, useState } from "react";

const rolesList = [
  "GERENTE_GENERAL",
  "GERENTE_ADMINISTRACION",
  "GERENTE_FUNCIONAL",
  "ADMINISTRADOR_SISTEMA",
  "JEFE_AREA",
  "OTROS",
];

const UsuarioForm = ({
  initialValues = null,
  areas = [],
  rangos = [],
  onCancel = () => {},
  onSave = async () => {},
  disableAdminRole = false,
}) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cargo: "",
    areaId: "",
    rangoId: "",
    activo: true,
    rol: "OTROS",
  });

  useEffect(() => {
    if (initialValues) {
      setForm((prev) => ({
        ...prev,
        ...initialValues,
        password: "",
        areaId: initialValues.areaId ?? "",
        rangoId: initialValues.rangoId ?? "",
        activo:
          typeof initialValues.activo === "boolean"
            ? initialValues.activo
            : true,
        rol: initialValues.rol ?? "OTROS",
      }));
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === "checkbox" ? checked : value;
    setForm((f) => ({ ...f, [name]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name?.trim() ||
      !form.email?.trim() ||
      !form.cargo?.trim() ||
      !form.areaId ||
      !form.rangoId
    ) {
      return alert("Por favor completa los campos obligatorios.");
    }
    await onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 md:grid-cols-3"
    >
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder=" Nombre Completo "
        className="p-2 border rounded md:col-span-1"
        required
      />
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        type="email"
        className="p-2 border rounded md:col-span-1"
        required
      />
      <input
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder={initialValues ? "Dejar vacío si no cambia" : "Contraseña"}
        type="password"
        className="p-2 border rounded md:col-span-1"
        {...(initialValues ? {} : { required: true })}
      />
      <input
        name="cargo"
        value={form.cargo}
        onChange={handleChange}
        placeholder="Cargo"
        className="p-2 border rounded md:col-span-1"
        required
      />
      <select
        name="areaId"
        value={form.areaId}
        onChange={handleChange}
        className="p-2 border rounded md:col-span-1"
        required
      >
        <option value="">-- Área --</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </select>
      <select
        name="rangoId"
        value={form.rangoId}
        onChange={handleChange}
        className="p-2 border rounded md:col-span-1"
        required
      >
        <option value="">-- Rango --</option>
        {rangos.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nombre}
          </option>
        ))}
      </select>
      <select
        name="rol"
        value={form.rol}
        onChange={handleChange}
        className="p-2 border rounded md:col-span-1"
        required
      >
        <option value="">-- Rol --</option>
        {rolesList.map((r) => (
          <option
            key={r}
            value={r}
            disabled={r === "ADMINISTRADOR_SISTEMA" && disableAdminRole}
          >
            {r}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2 md:col-span-2">
        <input
          id="activo"
          name="activo"
          type="checkbox"
          checked={!!form.activo}
          onChange={handleChange}
          className="mr-2"
        />
        <label htmlFor="activo">Usuario Activo</label>
      </div>
      <div className="flex justify-end gap-2 md:col-span-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded"
        >
          {initialValues ? "Guardar Cambios" : "Crear Usuario"}
        </button>
      </div>
    </form>
  );
};

export default UsuarioForm;
