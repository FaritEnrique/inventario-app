// src/stores/useDocumentosNotaIngresoStore.js
import { create } from "zustand";
import inventarioApi from "../api/inventarioApi";

export const DOCUMENTO_ENTREGA_TIPOS = [
  { value: "GUIA_REMISION", label: "Guía de remisión" },
  { value: "FACTURA", label: "Factura" },
  { value: "BOLETA", label: "Boleta" },
  { value: "OTRO", label: "Otro documento" },
];

export const createEmptyDocumentoNotaIngresoForm = () => ({
  tipoDocumento: "GUIA_REMISION",
  numeroDocumento: "",
  fechaDocumento: "",
  observaciones: "",
  file: null,
});

const toInputDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const buildEditForm = (documento) => ({
  tipoDocumento: documento?.tipoDocumento || "GUIA_REMISION",
  numeroDocumento: documento?.numeroDocumento || "",
  fechaDocumento: toInputDate(documento?.fechaDocumento),
  observaciones: documento?.observaciones || "",
  file: null,
});

const normalizeDocumentos = (value) => (Array.isArray(value) ? value : []);

const initialState = {
  isOpen: false,
  nota: null,
  documentos: [],
  formMode: null,
  selectedDocumento: null,
  viewerDocumento: null,
  form: createEmptyDocumentoNotaIngresoForm(),
  loading: false,
  submitting: false,
  error: null,
  viewerBlobUrl: "",
  viewerLoading: false,
};

const revokeObjectUrl = (url) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

const useDocumentosNotaIngresoStore = create((set, get) => ({
  ...initialState,

  openModal: async (nota) => {
    set({
      ...initialState,
      isOpen: true,
      nota,
      documentos: normalizeDocumentos(nota?.documentosEntrega),
    });

    if (nota?.id) {
      await get().fetchDocumentos(nota.id);
    }
  },

  closeModal: () => {
    revokeObjectUrl(get().viewerBlobUrl);
    set({ ...initialState });
  },

  setNota: (nota) => {
    set({
      nota,
      documentos: normalizeDocumentos(nota?.documentosEntrega),
    });
  },

  fetchDocumentos: async (notaIngresoIdArg) => {
    const notaIngresoId = notaIngresoIdArg || get().nota?.id;
    if (!notaIngresoId) return [];

    set({ loading: true, error: null });

    try {
      const data =
        await inventarioApi.listarDocumentosNotaIngreso(notaIngresoId);
      const documentos = normalizeDocumentos(data);

      set({
        documentos,
        loading: false,
        nota: get().nota
          ? {
              ...get().nota,
              documentosEntrega: documentos,
            }
          : get().nota,
      });

      return documentos;
    } catch (error) {
      set({
        loading: false,
        error: error.message || "No se pudo cargar los documentos.",
      });
      throw error;
    }
  },

  openCreate: () => {
    revokeObjectUrl(get().viewerBlobUrl);

    set({
      formMode: "create",
      selectedDocumento: null,
      viewerDocumento: null,
      viewerBlobUrl: "",
      viewerLoading: false,
      form: createEmptyDocumentoNotaIngresoForm(),
      error: null,
    });
  },

  openEdit: (documento) => {
    revokeObjectUrl(get().viewerBlobUrl);

    set({
      formMode: "edit",
      selectedDocumento: documento,
      viewerDocumento: null,
      viewerBlobUrl: "",
      viewerLoading: false,
      form: buildEditForm(documento),
      error: null,
    });
  },

  closeForm: () => {
    set({
      formMode: null,
      selectedDocumento: null,
      form: createEmptyDocumentoNotaIngresoForm(),
      error: null,
    });
  },

  setFormField: (field, value) => {
    set((state) => ({
      form: {
        ...state.form,
        [field]: value,
      },
    }));
  },

  setViewerDocumento: async (documento) => {
    const notaIngresoId = get().nota?.id;

    if (!notaIngresoId || !documento?.id) {
      throw new Error("No se pudo identificar el documento.");
    }

    revokeObjectUrl(get().viewerBlobUrl);

    set({
      viewerDocumento: documento,
      viewerBlobUrl: "",
      viewerLoading: true,
      formMode: null,
      selectedDocumento: null,
      error: null,
    });

    try {
      const { blob } = await inventarioApi.obtenerDocumentoNotaIngresoBlob(
        notaIngresoId,
        documento.id,
      );

      const viewerBlobUrl = URL.createObjectURL(blob);

      set({
        viewerBlobUrl,
        viewerLoading: false,
      });

      return viewerBlobUrl;
    } catch (error) {
      set({
        viewerLoading: false,
        error: error.message || "No se pudo cargar el documento.",
      });
      throw error;
    }
  },

  clearViewerDocumento: () => {
    revokeObjectUrl(get().viewerBlobUrl);
    set({
      viewerDocumento: null,
      viewerBlobUrl: "",
      viewerLoading: false,
    });
  },

  subirDocumento: async () => {
    const { nota, form } = get();
    if (!nota?.id) {
      throw new Error("No se pudo identificar la nota de ingreso.");
    }

    set({ submitting: true, error: null });

    try {
      await inventarioApi.subirDocumentoNotaIngreso(nota.id, form);
      const documentos = await get().fetchDocumentos(nota.id);

      set({
        submitting: false,
        formMode: null,
        selectedDocumento: null,
        form: createEmptyDocumentoNotaIngresoForm(),
      });

      return documentos;
    } catch (error) {
      set({
        submitting: false,
        error: error.message || "No se pudo subir el documento.",
      });
      throw error;
    }
  },

  actualizarDocumento: async () => {
    const { nota, selectedDocumento, form } = get();

    if (!nota?.id || !selectedDocumento?.id) {
      throw new Error("No se pudo identificar el documento.");
    }

    set({ submitting: true, error: null });

    try {
      await inventarioApi.actualizarDocumentoNotaIngreso(
        nota.id,
        selectedDocumento.id,
        {
          tipoDocumento: form.tipoDocumento,
          numeroDocumento: form.numeroDocumento || null,
          fechaDocumento: form.fechaDocumento,
          observaciones: form.observaciones || null,
        },
      );

      const documentos = await get().fetchDocumentos(nota.id);

      set({
        submitting: false,
        formMode: null,
        selectedDocumento: null,
        form: createEmptyDocumentoNotaIngresoForm(),
      });

      return documentos;
    } catch (error) {
      set({
        submitting: false,
        error: error.message || "No se pudo actualizar el documento.",
      });
      throw error;
    }
  },

  eliminarDocumento: async (documentoId, payload = {}) => {
    const notaIngresoId = get().nota?.id;

    if (!notaIngresoId || !documentoId) {
      throw new Error("No se pudo identificar el documento.");
    }

    const documentoEnVista = get().viewerDocumento?.id === documentoId;

    if (documentoEnVista) {
      revokeObjectUrl(get().viewerBlobUrl);
    }

    set({ submitting: true, error: null });

    try {
      await inventarioApi.eliminarDocumentoNotaIngreso(
        notaIngresoId,
        documentoId,
        payload,
      );

      const documentos = await get().fetchDocumentos(notaIngresoId);

      set({
        submitting: false,
        viewerDocumento: documentoEnVista ? null : get().viewerDocumento,
        viewerBlobUrl: documentoEnVista ? "" : get().viewerBlobUrl,
        viewerLoading: false,
        formMode: null,
        selectedDocumento: null,
      });

      return documentos;
    } catch (error) {
      set({
        submitting: false,
        error: error.message || "No se pudo eliminar el documento.",
      });
      throw error;
    }
  },
}));

export default useDocumentosNotaIngresoStore;
