import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  isPasswordPolicyValid,
  PASSWORD_POLICY_MESSAGE,
} from "../constants/passwordPolicy";

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

const createEmptyForm = () => ({
  name: "",
  email: "",
  password: "",
  cargo: "",
  areaId: "",
  activo: true,
  rol: "OPERADOR",
  rangos: [],
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
    .replace(/\bemail\b/g, "correo electronico")
    .replace(/\bpassword\b/g, "contrasena")
    .replace(/\bcargo\b/g, "cargo")
    .replace(/\bareaId\b/g, "area")
    .replace(/\brol\b/g, "rol")
    .replace(/\brangos\[\d+\]\.rol\b/g, "rol adicional")
    .replace(/\brangos\[\d+\]\.areaId\b/g, "area del rango adicional");

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
  const [form, setForm] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const hasAreasAvailable = Array.isArray(areas) && areas.length > 0;

  useEffect(() => {
    if (!initialValues) {
      setForm(createEmptyForm());
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
        initialValues.rangos ?? initialValues.userRangos ?? [],
      ),
    });
    setFormError("");
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setFormError("");
  };

  const handleRangoChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      rangos: prev.rangos.map((rango, currentIndex) =>
        currentIndex === index ? { ...rango, [field]: value } : rango,
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
        return "Completa el rol y el area de cada rango adicional.";
      }

      const key = `${rango.rol}::${rango.areaId}`;
      if (duplicateAssignments.has(key)) {
        return "No se pueden repetir asignaciones de rol y area en el mismo usuario.";
      }

      duplicateAssignments.add(key);
    }

    if (form.password && !isPasswordPolicyValid(form.password)) {
      return PASSWORD_POLICY_MESSAGE;
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      toast.error(validationMessage);
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
        setForm(createEmptyForm());
      }
    } catch (error) {
      setFormError(buildErrorMessage(error));
      throw error;
    }
  };

  const handleCancelClick = () => {
    if (!initialValues) {
      setForm(createEmptyForm());
      setFormError("");
    }

    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-lg border bg-white p-4 md:grid-cols-3"
      autoComplete="on"
    >
      {formError ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-3">
          {formError}
        </div>
      ) : null}

      <div className="md:col-span-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Datos principales
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          El rol principal y el area principal se mantienen separados de los
          rangos adicionales.
        </p>
      </div>

      <div className="md:col-span-1">
        <label
          htmlFor="usuario-nombre"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Nombre completo
        </label>
        <input
          id="usuario-nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nombre completo"
          autoComplete="name"
          className="w-full rounded border p-2"
          required
        />
      </div>

      <div className="md:col-span-1">
        <label
          htmlFor="usuario-email"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Correo electronico
        </label>
        <input
          id="usuario-email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Correo electronico"
          type="email"
          autoComplete="email"
          className="w-full rounded border p-2"
          required
        />
      </div>

      <div className="md:col-span-1">
        <label
          htmlFor="usuario-password"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {initialValues ? "Nueva contrasena" : "Contrasena"}
        </label>
        <input
          id="usuario-password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder={initialValues ? "Dejar vacio si no cambia" : "Contrasena"}
          type="password"
          autoComplete="new-password"
          className="w-full rounded border p-2"
          {...(initialValues ? {} : { required: true })}
        />
      </div>

      <p className="text-xs text-gray-500 md:col-span-3">
        {PASSWORD_POLICY_MESSAGE}
      </p>

      <div className="md:col-span-1">
        <label
          htmlFor="usuario-cargo"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Cargo
        </label>
        <input
          id="usuario-cargo"
          name="cargo"
          value={form.cargo}
          onChange={handleChange}
          placeholder="Cargo"
          autoComplete="organization-title"
          className="w-full rounded border p-2"
          required
        />
      </div>

      <div className="md:col-span-1">
        <label
          htmlFor="usuario-area"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Area principal
        </label>
        <select
          id="usuario-area"
          name="areaId"
          value={form.areaId}
          onChange={handleChange}
          autoComplete="organization"
          className="w-full rounded border p-2"
          required
        >
          <option value="">-- Area principal --</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-1">
        <label
          htmlFor="usuario-rol"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Rol principal
        </label>
        <select
          id="usuario-rol"
          name="rol"
          value={form.rol}
          onChange={handleChange}
          autoComplete="off"
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

      {!hasAreasAvailable ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 md:col-span-3">
          No hay areas disponibles para asignar al usuario. Sin un area
          principal valida no se podra crear ni editar el usuario.
        </div>
      ) : null}

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
                Usa esta seccion para asignaciones organizacionales por area,
                como jefatura o gerencia funcional.
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
                  <div>
                    <label
                      htmlFor={`usuario-rango-rol-${index}`}
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Rol adicional
                    </label>
                    <select
                      id={`usuario-rango-rol-${index}`}
                      value={rango.rol}
                      onChange={(event) =>
                        handleRangoChange(index, "rol", event.target.value)
                      }
                      autoComplete="off"
                      className="w-full rounded border p-2"
                      required
                    >
                      <option value="">-- Rol adicional --</option>
                      {additionalRolesList.map((rol) => (
                        <option key={rol} value={rol}>
                          {rol}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`usuario-rango-area-${index}`}
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Area del rango
                    </label>
                    <select
                      id={`usuario-rango-area-${index}`}
                      value={rango.areaId}
                      onChange={(event) =>
                        handleRangoChange(index, "areaId", event.target.value)
                      }
                      autoComplete="off"
                      className="w-full rounded border p-2"
                      required
                    >
                      <option value="">-- Area del rango --</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveRango(index)}
                      className="rounded bg-red-100 px-3 py-2 text-sm font-medium text-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 md:col-span-3">
        <button
          type="button"
          onClick={handleCancelClick}
          className="rounded bg-gray-200 px-4 py-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!hasAreasAvailable}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {initialValues ? "Guardar cambios" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
};

export default UsuarioForm;
