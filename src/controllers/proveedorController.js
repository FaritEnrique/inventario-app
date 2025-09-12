import {
  crearProveedorService,
  obtenerProveedoresService,
  obtenerProveedorPorIdService,
  actualizarProveedorService,
  eliminarProveedorService,
} from "../services/proveedorService.js";

export const crearProveedor = async (req, res) => {
  try {
    const nuevo = await crearProveedorService(req.body, req.user?.id);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error("crearProveedor:", error);
    res.status(400).json({ message: error.message });
  }
};

export const obtenerProveedores = async (req, res) => {
  try {
    const buscar = req.query.buscar || "";
    const proveedores = await obtenerProveedoresService(buscar);
    res.json(proveedores);
  } catch (error) {
    console.error("obtenerProveedores:", error);
    res.status(500).json({ message: error.message });
  }
};

export const obtenerProveedorPorId = async (req, res) => {
  try {
    const proveedor = await obtenerProveedorPorIdService(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(proveedor);
  } catch (error) {
    console.error("obtenerProveedorPorId:", error);
    res.status(500).json({ message: error.message });
  }
};

export const actualizarProveedor = async (req, res) => {
  try {
    const actualizado = await actualizarProveedorService(
      req.params.id,
      req.body,
      req.user?.id
    );
    res.json(actualizado);
  } catch (error) {
    console.error("actualizarProveedor:", error);
    // Check if it's a Joi validation error
    if (error.isJoi) {
      console.error("Joi Validation Error Details:", error.details);
      // You might want to send these details back to the frontend for better user feedback
      return res.status(400).json({
        message: "Validación fallida",
        details: error.details.map(d => d.message) // Send specific messages
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const eliminarProveedor = async (req, res) => {
  try {
    await eliminarProveedorService(req.params.id, req.user?.id);
    res.status(200).json({ message: "Proveedor eliminado correctamente" });
  } catch (error) {
    console.error("eliminarProveedor:", error);
    res.status(400).json({ message: error.message });
  }
};