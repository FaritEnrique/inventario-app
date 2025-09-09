import { generateProveedorPDF, generatePdfFromHtml } from '../../services/pdfService.js'; // Import new service function
import { obtenerProveedorPorIdService } from '../../services/proveedorService.js';

const generateProveedorPdfController = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedorData = await obtenerProveedorPorIdService(id);

    if (!proveedorData) {
      return res.status(404).json({ message: 'Proveedor no encontrado.' });
    }

    const pdfBuffer = await generateProveedorPDF(proveedorData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=proveedor_${proveedorData.id}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error in generateProveedorPdfController:', error);
    res.status(500).json({ message: 'Error al generar el PDF del proveedor', error: error.message });
  }
};

// New controller function to generate PDF from HTML content
const generatePdfFromHtmlController = async (req, res) => {
  try {
    const { htmlContent } = req.body; // Expect HTML content in the request body

    if (!htmlContent) {
      return res.status(400).json({ message: 'No se proporcionó contenido HTML para generar el PDF.' });
    }

    const pdfBuffer = await generatePdfFromHtml(htmlContent); // Call new service function

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=document.pdf'); // Generic filename
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error in generatePdfFromHtmlController:', error);
    res.status(500).json({ message: 'Error al generar el PDF desde HTML', error: error.message });
  }
};

export default {
  generateProveedorPdfController,
  generatePdfFromHtmlController, // Export the new function
};