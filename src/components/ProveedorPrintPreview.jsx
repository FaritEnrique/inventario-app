import React from "react";
import {
  collectPrintableHeadMarkup,
  printHtmlInNewWindow,
} from "../utils/printWindow";

const PrintField = ({ label, value }) => (
  <div className="break-inside-avoid py-2">
    <p className="text-sm font-semibold text-gray-600">{label}</p>
    <p className="text-md text-gray-800">{value || "No especificado"}</p>
  </div>
);

const ProveedorPrintPreview = ({ proveedor, onCancel }) => {
  const handlePrint = async () => {
    const printArea = document.getElementById("print-area");

    if (!printArea) {
      console.error("No se encontro el area de impresion.");
      return;
    }

    try {
      const currentStyles = collectPrintableHeadMarkup(document);

      const fullHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Documento de Proveedor</title>
          ${currentStyles}
          <style>
            body {
              font-family: sans-serif;
              margin: 0;
              padding: 0;
            }
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            #print-area {
              padding: 2.5mm 3mm !important;
              box-sizing: border-box !important;
            }
            #print-area h2 {
              margin-top: 0 !important;
              padding-top: 0 !important;
            }
            .columns-2 {
              column-count: 2 !important;
            }
            .gap-x-12 {
              column-gap: 3rem !important;
            }
          </style>
        </head>
        <body>
          <div class="print-document">
            ${printArea.outerHTML}
          </div>
        </body>
        </html>
      `;

      await printHtmlInNewWindow(fullHtmlContent);
    } catch (error) {
      console.error("Error al preparar la impresion:", error);
      alert("Error al preparar la impresion. Por favor, intentalo de nuevo.");
    }
  };

  return (
    <div className="bg-white text-gray-900">
      <div id="print-area" className="px-20">
        <h2 className="text-center text-3xl font-bold text-gray-800">
          Datos de Proveedor
        </h2>

        <h3 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-700">
          Datos de Gestion Interna
        </h3>
        <div className="columns-2 gap-x-12">
          <PrintField label="RUC" value={proveedor.ruc} />
          <PrintField label="Razon Social" value={proveedor.razonSocial} />
          <PrintField label="Direccion Completa" value={proveedor.direccion} />
          <PrintField label="Telefono" value={proveedor.telefono} />
          <PrintField label="Representante" value={proveedor.representante} />
          <PrintField
            label="Persona de Contacto"
            value={proveedor.contacto}
          />
          <PrintField
            label="Correo Electronico"
            value={proveedor.correoElectronico}
          />
          <PrintField
            label="Proveedor Activo"
            value={proveedor.activo ? "Si" : "No"}
          />
        </div>

        <h3 className="mb-4 mt-4 border-b pb-2 text-xl font-semibold text-gray-700">
          Datos Obtenidos de SUNAT
        </h3>
        <div className="columns-2 gap-x-12">
          <PrintField label="Estado" value={proveedor.estado} />
          <PrintField label="Condicion" value={proveedor.condicion} />
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
            label="Periodo Publicacion"
            value={proveedor.periodoPublicacion}
          />
          <PrintField
            label="Tipo Facturacion"
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

      <div className="print:hidden flex justify-end border-t bg-gray-100 p-4">
        <button
          type="button"
          onClick={onCancel}
          className="mr-4 rounded-md bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-300"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
};

export default ProveedorPrintPreview;
