import React from "react";

const PrintField = ({ label, value }) => (
  <div className="py-2 break-inside-avoid">
    <p className="text-sm font-semibold text-gray-600">{label}</p>
    <p className="text-gray-800 text-md">{value || "No especificado"}</p>
  </div>
);

const ProveedorPrintPreview = ({ proveedor, onCancel }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="text-gray-900 bg-white">
      {/* Esta hoja simula un A4 y contiene los estilos de impresión */}
      <style>
        {`
          @page {
            size: A4;
            margin: 0; /* Anulamos márgenes de la impresora */
          }
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0 !important;
              padding: 0 !important;
            }
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
              padding: 0 2.5mm; /* 0 arriba/abajo, 2.5mm a los lados */
              box-sizing: border-box;
            }
          }
        `}
      </style>

      <div id="print-area" className="px-20">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Datos de Proveedor
        </h2>

        <h3 className="pb-2 mb-4 text-xl font-semibold text-gray-700 border-b">
          Datos de Gestión Interna
        </h3>
        <div className="columns-2 gap-x-12">
          <PrintField label="RUC" value={proveedor.ruc} />
          <PrintField label="Razón Social" value={proveedor.razonSocial} />
          <PrintField label="Dirección Completa" value={proveedor.direccion} />
          <PrintField label="Teléfono" value={proveedor.telefono} />
          <PrintField label="Representante" value={proveedor.representante} />
          <PrintField label="Persona de Contacto" value={proveedor.contacto} />
          <PrintField
            label="Correo Electrónico"
            value={proveedor.correoElectronico}
          />
          <PrintField
            label="Proveedor Activo"
            value={proveedor.activo ? "Sí" : "No"}
          />
        </div>

        <h3 className="pb-2 mt-4 mb-4 text-xl font-semibold text-gray-700 border-b">
          Datos Obtenidos de SUNAT
        </h3>
        <div className="columns-2 gap-x-12">
          <PrintField label="Estado" value={proveedor.estado} />
          <PrintField label="Condición" value={proveedor.condicion} />
          <PrintField label="Tipo" value={proveedor.tipo} />
          <PrintField
            label="Act. CIIU3 Principal"
            value={proveedor.actividadCIIU3Principal}
          />
          <PrintField
            label="Act. CIIU3 Secundaria"
            value={proveedor.actividadCIIU3Secundaria}
          />
          <PrintField
            label="Act. CIIU4 Principal"
            value={proveedor.actividadCIIU4Principal}
          />
          <PrintField
            label="Nro. Trabajadores"
            value={proveedor.nroTrabajadores}
          />
          <PrintField
            label="Periodo Publicación"
            value={proveedor.periodoPublicacion}
          />
          <PrintField
            label="Tipo Facturación"
            value={proveedor.tipoFacturacion}
          />
          <PrintField
            label="Tipo Contabilidad"
            value={proveedor.tipoContabilidad}
          />
          <PrintField
            label="Comercio Exterior"
            value={proveedor.comercioExterior}
          />
          <PrintField label="Ubigeo" value={proveedor.ubigeo} />
          <PrintField label="Departamento" value={proveedor.departamento} />
          <PrintField label="Provincia" value={proveedor.provincia} />
          <PrintField label="Distrito" value={proveedor.distrito} />
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
