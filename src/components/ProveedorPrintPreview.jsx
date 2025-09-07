import React from 'react';

const PrintField = ({ label, value }) => (
  <div className="py-2 break-inside-avoid">
    <p className="text-sm font-semibold text-gray-600">{label}</p>
    <p className="text-md text-gray-800">{value || 'No especificado'}</p>
  </div>
);

const ProveedorPrintPreview = ({ proveedor, onCancel }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-gray-900">
      {/* Esta hoja simula un A4 y contiene los estilos de impresión */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>

      <div className="p-8" id="print-area">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Datos de Proveedor</h2>

        <div className="columns-2 gap-x-12">
          <PrintField label="RUC" value={proveedor.ruc} />
          <PrintField label="Razón Social" value={proveedor.razonSocial} />
          <PrintField label="Dirección Completa" value={proveedor.direccion} />
          <PrintField label="Teléfono" value={proveedor.telefono} />
          <PrintField label="Representante" value={proveedor.representante} />
          <PrintField label="Persona de Contacto" value={proveedor.contacto} />
          <PrintField label="Correo Electrónico" value={proveedor.correoElectronico} />
          <PrintField label="Estado" value={proveedor.estado} />
          <PrintField label="Condición" value={proveedor.condicion} />
          <PrintField label="Tipo" value={proveedor.tipo} />
          <PrintField label="Act. CIIU3 Principal" value={proveedor.actividadCIIU3Principal} />
          <PrintField label="Act. CIIU3 Secundaria" value={proveedor.actividadCIIU3Secundaria} />
          <PrintField label="Act. CIIU4 Principal" value={proveedor.actividadCIIU4Principal} />
          <PrintField label="Nro. Trabajadores" value={proveedor.nroTrabajadores} />
          <PrintField label="Periodo Publicación" value={proveedor.periodoPublicacion} />
          <PrintField label="Tipo Facturación" value={proveedor.tipoFacturacion} />
          <PrintField label="Tipo Contabilidad" value={proveedor.tipoContabilidad} />
          <PrintField label="Comercio Exterior" value={proveedor.comercioExterior} />
          <PrintField label="Ubigeo" value={proveedor.ubigeo} />
          <PrintField label="Departamento" value={proveedor.departamento} />
          <PrintField label="Provincia" value={proveedor.provincia} />
          <PrintField label="Distrito" value={proveedor.distrito} />
          <PrintField label="Proveedor Activo" value={proveedor.activo ? 'Sí' : 'No'} />
        </div>
      </div>

      {/* Botones de acción - se ocultan al imprimir */}
      <div className="flex justify-end p-4 bg-gray-100 border-t print:hidden">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 mr-4 text-sm font-semibold text-gray-700 transition-colors duration-200 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
};

export default ProveedorPrintPreview;
