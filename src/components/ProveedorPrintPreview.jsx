import React from "react";

const PrintField = ({ label, value }) => (
  <div className="py-2 break-inside-avoid">
    <p className="text-sm font-semibold text-gray-600">{label}</p>
    <p className="text-gray-800 text-md">{value || "No especificado"}</p>
  </div>
);

const ProveedorPrintPreview = ({ proveedor, onCancel }) => {
  const handlePrint = async () => { // Make it async
    const printArea = document.getElementById('print-area');
    if (!printArea) {
      console.error("Print area not found!");
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      alert("No hay sesión activa. Por favor, inicia sesión.");
      return;
    }

    try {
      // 1. Find the main stylesheet link and fetch its content
      // Assuming the main compiled CSS is loaded via a <link> tag
      const mainStylesheetLink = document.querySelector('link[rel="stylesheet"]');
      let compiledCss = '';
      if (mainStylesheetLink && mainStylesheetLink.href) {
        try {
          const cssResponse = await fetch(mainStylesheetLink.href);
          if (cssResponse.ok) {
            compiledCss = await cssResponse.text();
          } else {
            console.warn("Failed to load main stylesheet:", mainStylesheetLink.href, cssResponse.statusText);
          }
        } catch (e) {
          console.error("Error fetching main stylesheet:", e);
        }
      } else {
        console.warn("Main stylesheet link not found or has no href.");
      }

      // 2. Construct the full HTML document
      const fullHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Documento de Proveedor</title>
          <style>
            ${compiledCss}
            /* Override any conflicting styles and apply print-specific ones */
            @page {
              size: A4;
              margin: 0; /* Anulamos márgenes de la impresora */
            }
            body {
              margin: 0;
              padding: 0;
            }
            #print-area {
              padding: 2.5mm 3mm !important; /* Top/Bottom 2.5mm, Left/Right 3mm */
              box-sizing: border-box !important;
            }
            #print-area h2 { /* Target the main title */
                margin-top: 0 !important;
                padding-top: 0 !important;
            }
            /* Ensure columns-2 and gap-x-12 work */
            .columns-2 { column-count: 2 !important; }
            .gap-x-12 { column-gap: 3rem !important; } /* 3rem = 48px */
          </style>
        </head>
        <body>
          ${printArea.outerHTML}
        </body>
        </html>
      `;

      // 3. Send the full HTML document to the backend
      const response = await fetch('http://localhost:3000/api/pdf/generate-from-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ htmlContent: fullHtmlContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      URL.revokeObjectURL(pdfUrl);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div className="text-gray-900 bg-white">
      {/* Removed the inline <style> block */}

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