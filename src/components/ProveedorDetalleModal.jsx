import React from "react";
import Modal from "./Modal";

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return "No registrado";
  }

  const normalizedValue = String(value).trim();
  return normalizedValue ? normalizedValue : "No registrado";
};

const DetailRow = ({ label, value }) => (
  <div className="grid gap-1 border-b border-gray-100 py-3 md:grid-cols-[220px_1fr]">
    <dt className="text-sm font-semibold text-gray-700">{label}</dt>
    <dd className="text-sm text-gray-600">{formatValue(value)}</dd>
  </div>
);

const Tag = ({ children, tone = "slate" }) => {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
};

const ProveedorDetalleModal = ({ isOpen, onClose, proveedor }) => {
  if (!proveedor) {
    return null;
  }

  const tiposOficiales = (proveedor.especialidades || [])
    .map((especialidad) => especialidad.tipoProducto?.nombre)
    .filter(Boolean);

  const tiposTemporales = (proveedor.solicitudesTipoProducto || []).filter(
    (solicitud) =>
      solicitud &&
      ["PENDIENTE", "OBSERVADO"].includes(String(solicitud.estado || ""))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del proveedor"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Proveedor operativo
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {formatValue(proveedor.razonSocial)}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              RUC: {formatValue(proveedor.ruc)}
            </p>
          </div>
          <Tag tone={proveedor.activo ? "green" : "red"}>
            {proveedor.activo ? "Activo" : "Inactivo"}
          </Tag>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h4 className="mb-4 text-lg font-semibold text-gray-800">
              Datos generales
            </h4>
            <dl>
              <DetailRow label="Procedencia" value={proveedor.procedencia} />
              <DetailRow label="Direccion" value={proveedor.direccion} />
              <DetailRow label="Telefono" value={proveedor.telefono} />
              <DetailRow label="Correo electronico" value={proveedor.correoElectronico} />
              <DetailRow label="Representante" value={proveedor.representante} />
              <DetailRow label="Contacto" value={proveedor.contacto} />
              <DetailRow label="Creado" value={proveedor.createdAt ? new Date(proveedor.createdAt).toLocaleString("es-PE") : null} />
              <DetailRow label="Actualizado" value={proveedor.updatedAt ? new Date(proveedor.updatedAt).toLocaleString("es-PE") : null} />
            </dl>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h4 className="mb-4 text-lg font-semibold text-gray-800">
              Datos SUNAT y ubicacion
            </h4>
            <dl>
              <DetailRow label="Estado" value={proveedor.estado} />
              <DetailRow label="Condicion" value={proveedor.condicion} />
              <DetailRow label="Tipo" value={proveedor.tipo} />
              <DetailRow label="Actividad CIIU 3 principal" value={proveedor.actividadCIIU3Principal} />
              <DetailRow label="Actividad CIIU 3 secundaria" value={proveedor.actividadCIIU3Secundaria} />
              <DetailRow label="Actividad CIIU 4 principal" value={proveedor.actividadCIIU4Principal} />
              <DetailRow label="Nro. trabajadores" value={proveedor.nroTrabajadores} />
              <DetailRow label="Ubigeo" value={proveedor.ubigeo} />
              <DetailRow label="Departamento" value={proveedor.departamento} />
              <DetailRow label="Provincia" value={proveedor.provincia} />
              <DetailRow label="Distrito" value={proveedor.distrito} />
              <DetailRow label="Periodo publicacion" value={proveedor.periodoPublicacion} />
            </dl>
          </section>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h4 className="mb-4 text-lg font-semibold text-gray-800">
            Clasificacion del proveedor
          </h4>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Tipos oficiales
              </p>
              {tiposOficiales.length ? (
                <div className="flex flex-wrap gap-2">
                  {tiposOficiales.map((tipo) => (
                    <Tag key={tipo}>{tipo}</Tag>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin tipos oficiales registrados.</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Tipos temporales pendientes
              </p>
              {tiposTemporales.length ? (
                <div className="space-y-2">
                  {tiposTemporales.map((solicitud) => (
                    <div
                      key={solicitud.id}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold text-amber-900">
                            {formatValue(solicitud.nombrePropuesto)}
                          </p>
                          <p className="mt-1 text-sm text-amber-800">
                            {formatValue(solicitud.descripcion)}
                          </p>
                          {solicitud.comentarioRevision ? (
                            <p className="mt-1 text-xs text-amber-700">
                              Revision: {solicitud.comentarioRevision}
                            </p>
                          ) : null}
                        </div>
                        <Tag tone="amber">{solicitud.estado}</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No tiene tipos temporales pendientes.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default ProveedorDetalleModal;
