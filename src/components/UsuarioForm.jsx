import React, { useEffect, useState } from "react";

const rolesList = [
  "GERENTE_GENERAL",
  "GERENTE_ADMINISTRACION",
  "GERENTE_FUNCIONAL",
  "ADMINISTRADOR_SISTEMA",
  "JEFE_AREA",
  "OPERADOR",
];

const additionalRolesList = [
  "JEFE_AREA",
  "GERENTE_FUNCIONAL",
  "GERENTE_ADMINISTRACION",
  "GERENTE_GENERAL",
];

const createEmptyRango = () => ({
  rol: "",
  areaId: "",
  activo: true,
});

const normalizeRangos = (rangos = []) =>
  (Array.isArray(rangos) ? rangos : [])
    .filter((rango) => rango && rango.activo !== false)
    .map((rango) => ({
      rol: rango.rol || "",
      areaId:
        rango.areaId !== null && rango.areaId !== undefined
          ? String(rango.areaId)
          : "",
      activo: rango.activo !== false,
    }));

const formatValidationMessage = (message) =>
  String(message || "")
    .replace(/["]/g, "")
    .replace(/\bnombre\b/g, "nombre")
    .replace(/\bemail\b/g, "correo electrónico")
    .replace(/\bpassword\b/g, "contraseña")
    .replace(/\bcargo\b/g, "cargo")
    .replace(/\bareaId\b/g, "área")
    .replace(/\brol\b/g, "rol")
    .replace(/\brangos\[\d+\]\.rol\b/g, "rol adicional")
    .replace(/\brangos\[\d+\]\.areaId\b/g, "área del rango adicional");

const buildErrorMessage = (error) => {
  if (Array.isArray(error?.validationErrors) && error.validationErrors.length) {
    return error.validationErrors.map(formatValidationMessage).join(" ");
  }

  return error?.message || "No se pudo guardar el usuario.";
};

const UsuarioForm = ({
  initialValues = null,
  areas = [],
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
    activo: true,
    rol: "OPERADOR",
    rangos: [],
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!initialValues) {
      setForm({
        name: "",
        email: "",
        password: "",
        cargo: "",
        areaId: "",
        activo: true,
        rol: "OPERADOR",
        rangos: [],
      });
      setFormError("");
      return;
    }

    setForm({
      name: initialValues.name ?? initialValues.nombre ?? "",
      email: initialValues.email ?? "",
      password: "",
      cargo: initialValues.cargo ?? "",
      areaId:
        initialValues.areaId !== null && initialValues.areaId !== undefined
          ? String(initialValues.areaId)
          : "",
      activo:
        typeof initialValues.activo === "boolean"
          ? initialValues.activo
          : true,
      rol: initialValues.rol ?? "OPERADOR",
      rangos: normalizeRangos(
        initialValues.rangos ?? initialValues.userRangos ?? []
      ),
    });
    setFormError("");
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setFormError("");
  };

  const handleRangoChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      rangos: prev.rangos.map((rango, currentIndex) =>
        currentIndex === index ? { ...rango, [field]: value } : rango
      ),
    }));
    setFormError("");
  };

  const handleAddRango = () => {
    setForm((prev) => ({
      ...prev,
      rangos: [...prev.rangos, createEmptyRango()],
    }));
    setFormError("");
  };

  const handleRemoveRango = (index) => {
    setForm((prev) => ({
      ...prev,
      rangos: prev.rangos.filter((_, currentIndex) => currentIndex !== index),
    }));
    setFormError("");
  };

  const validateForm = () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.cargo.trim() ||
      !form.areaId
    ) {
      return "Completa los campos obligatorios del usuario.";
    }

    const duplicateAssignments = new Set([`${form.rol}::${form.areaId}`]);

    for (const rango of form.rangos) {
      if (!rango.rol || !rango.areaId) {
      return "Completa el rol y el área de cada rango adicional.";
      }

      const key = `${rango.rol}::${rango.areaId}`;
      if (duplicateAssignments.has(key)) {
        return "No se pueden repetir asignaciones de rol y área en el mismo usuario.";
      }

      duplicateAssignments.add(key);
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setFormError("");
      await onSave({
        ...form,
        rangos: form.rangos.map((rango) => ({
          ...rango,
          areaId: rango.areaId,
        })),
      });

      if (!initialValues) {
        setForm({
          name: "",
          email: "",
          password: "",
          cargo: "",
          areaId: "",
          activo: true,
          rol: "OPERADOR",
          rangos: [],
        });
      }
    } catch (error) {
      setFormError(buildErrorMessage(error));
      throw error;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-lg border bg-white p-4 md:grid-cols-3"
    >
      {formError ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-3">
          {formError}
        </div>
      ) : null}

      <div className="md:col-span-3">
        <h2 className="text-sm font-semibold text-gray-900">Datos principales</h2>
        <p className="mt-1 text-xs text-gray-600">
          El rol principal y el área principal se mantienen separados de los rangos adicionales.
        </p>
      </div>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Nombre completo"
        className="rounded border p-2 md:col-span-1"
        required
      />
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Correo electrónico"
        type="email"
        className="rounded border p-2 md:col-span-1"
        required
      />
      <input
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder={initialValues ? "Dejar vacío si no cambia" : "Contraseña"}
        type="password"
        className="rounded border p-2 md:col-span-1"
        {...(initialValues ? {} : { required: true })}
      />
      <input
        name="cargo"
        value={form.cargo}
        onChange={handleChange}
        placeholder="Cargo"
        className="rounded border p-2 md:col-span-1"
        required
      />

      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Área principal
        </label>
        <select
          name="areaId"
          value={form.areaId}
          onChange={handleChange}
          className="w-full rounded border p-2"
          required
        >
          <option value="">-- Área principal --</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Rol principal
        </label>
        <select
          name="rol"
          value={form.rol}
          onChange={handleChange}
          className="w-full rounded border p-2"
          required
        >
          <option value="">-- Rol principal --</option>
          {rolesList.map((rol) => (
            <option
              key={rol}
              value={rol}
              disabled={rol === "ADMINISTRADOR_SISTEMA" && disableAdminRole}
            >
              {rol}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 md:col-span-3">
        <input
          id="activo"
          name="activo"
          type="checkbox"
          checked={Boolean(form.activo)}
          onChange={handleChange}
        />
        <label htmlFor="activo" className="text-sm text-gray-700">
          Usuario activo
        </label>
      </div>

      <div className="md:col-span-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Rangos adicionales
              </h3>
              <p className="text-xs text-gray-600">
                Usa esta sección para asignaciones organizacionales por área, como jefatura o gerencia funcional.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddRango}
              className="rounded bg-slate-800 px-3 py-2 text-sm text-white"
            >
              Agregar rango
            </button>
          </div>

          {form.rangos.length === 0 ? (
            <p className="text-sm text-gray-500">
              Sin rangos adicionales configurados.
            </p>
          ) : (
            <div className="space-y-3">
              {form.rangos.map((rango, index) => (
                <div
                  key={`${rango.rol}-${rango.areaId}-${index}`}
                  className="grid grid-cols-1 gap-3 rounded border border-gray-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <select
                    value={rango.rol}
                    onChange={(event) =>
                      handleRangoChange(index, "rol", event.target.value)
                    }
                    className="rounded border p-2"
                    required
                  >
                    <option value="">-- Rol adicional --</option>
                    {additionalRolesList.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>

                  <select
                    value={rango.areaId}
                    onChange={(event) =>
                      handleRangoChange(index, "areaId", event.target.value)
                    }
                    className="rounded border p-2"
                    required
                  >
                    <option value="">-- Área del rango --</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveRango(index)}
                    className="rounded bg-red-100 px-3 py-2 text-sm font-medium text-red-700"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 md:col-span-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-gray-200 px-4 py-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {initialValues ? "Guardar cambios" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
};

export default UsuarioForm;
