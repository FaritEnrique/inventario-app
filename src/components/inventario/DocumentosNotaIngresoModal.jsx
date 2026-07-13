// src/components/inventario/DocumentosNotaIngresoModal.jsx
import { toast } from "react-toastify";
import Modal from "../Modal";
import useAppDialog from "../../hooks/useAppDialog";
import useDocumentosNotaIngresoStore, {
  DOCUMENTO_ENTREGA_TIPOS,
} from "../../stores/useDocumentosNotaIngresoStore";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const formatDateOnly = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-PE", { timeZone: "UTC" });
};

const getTipoDocumentoLabel = (value) =>
  DOCUMENTO_ENTREGA_TIPOS.find((tipo) => tipo.value === value)?.label ||
  value ||
  "-";

const isPdf = (documento) =>
  String(documento?.mimeType || "")
    .toLowerCase()
    .includes("pdf");

const isImage = (documento) =>
  String(documento?.mimeType || "")
    .toLowerCase()
    .startsWith("image/");

const validateForm = (form, formMode) => {
  if (!form.tipoDocumento) {
    return "Selecciona el tipo documental.";
  }

  if (!form.fechaDocumento) {
    return "Indica la fecha del documento.";
  }

  if (formMode === "create" && !form.file) {
    return "Adjunta el archivo PDF o imagen del documento.";
  }

  return "";
};

const getDocumentoNombre = (documento) =>
  documento?.nombreOriginal || documento?.nombreArchivo || "Documento";

const printBlobUrl = (url) => {
  const iframe = document.createElement("iframe");

  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        toast.error("No se pudo enviar el documento a impresión.");
      }
    }, 300);
  };

  document.body.appendChild(iframe);

  setTimeout(() => {
    iframe.remove();
  }, 60_000);
};

const DocumentoActions = ({
  documento,
  submitting,
  onView,
  onPrint,
  onEdit,
  onDelete,
}) => (
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => onView(documento)}
      disabled={submitting}
      className="rounded border border-sky-300 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-60"
    >
      Ver
    </button>

    <button
      type="button"
      onClick={() => onPrint(documento)}
      disabled={submitting}
      className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      Imprimir
    </button>

    <button
      type="button"
      onClick={() => onEdit(documento)}
      disabled={submitting}
      className="rounded border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
    >
      Editar
    </button>

    <button
      type="button"
      onClick={() => onDelete(documento)}
      disabled={submitting}
      className="rounded border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
    >
      Eliminar
    </button>
  </div>
);

const DocumentoMobileCard = ({
  documento,
  submitting,
  onView,
  onPrint,
  onEdit,
  onDelete,
}) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {getTipoDocumentoLabel(documento.tipoDocumento)}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {getDocumentoNombre(documento)}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        {isPdf(documento) ? "PDF" : "Imagen"}
      </span>
    </div>

    <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
      <div>
        <dt className="font-semibold text-slate-500">Número</dt>
        <dd className="mt-0.5 text-slate-800">
          {documento.numeroDocumento || "-"}
        </dd>
      </div>

      <div>
        <dt className="font-semibold text-slate-500">Fecha documento</dt>
        <dd className="mt-0.5 text-slate-800">
          {formatDateOnly(documento.fechaDocumento)}
        </dd>
      </div>

      <div>
        <dt className="font-semibold text-slate-500">Subido por</dt>
        <dd className="mt-0.5 text-slate-800">
          {documento.subidoPor?.nombre || "-"}
        </dd>
        <dd className="text-slate-500">
          {formatDateTime(documento.createdAt)}
        </dd>
      </div>

      {documento.observaciones ? (
        <div>
          <dt className="font-semibold text-slate-500">Observaciones</dt>
          <dd className="mt-0.5 text-slate-800">{documento.observaciones}</dd>
        </div>
      ) : null}
    </dl>

    <div className="mt-4">
      <DocumentoActions
        documento={documento}
        submitting={submitting}
        onView={onView}
        onPrint={onPrint}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  </article>
);

const DocumentosNotaIngresoModal = ({ onDocumentosChange }) => {
  const { confirm, prompt, dialogNode } = useAppDialog();

  const {
    isOpen,
    nota,
    documentos,
    formMode,
    selectedDocumento,
    viewerDocumento,
    viewerBlobUrl,
    viewerLoading,
    form,
    loading,
    submitting,
    closeModal,
    openCreate,
    openEdit,
    closeForm,
    setFormField,
    setViewerDocumento,
    clearViewerDocumento,
    subirDocumento,
    actualizarDocumento,
    eliminarDocumento,
  } = useDocumentosNotaIngresoStore();

  const tieneOrdenCompra = Boolean(
    nota?.ordenCompra?.id || nota?.ordenCompraId,
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = validateForm(form, formMode);
    if (message) {
      toast.error(message);
      return;
    }

    try {
      let documentosActualizados = documentos;

      if (formMode === "create") {
        documentosActualizados = await subirDocumento();
        toast.success("Documento sustentatorio subido.");
      } else if (formMode === "edit" && selectedDocumento?.id) {
        documentosActualizados = await actualizarDocumento();
        toast.success("Documento sustentatorio actualizado.");
      }

      onDocumentosChange?.(documentosActualizados);
    } catch (error) {
      toast.error(error.message || "No se pudo guardar el documento.");
    }
  };

  const handleDelete = async (documento) => {
    if (tieneOrdenCompra && documentos.length <= 1) {
      toast.error(
        "No se puede eliminar el último documento sustentatorio de una recepción vinculada a Orden de Compra.",
      );
      return;
    }

    const confirmed = await confirm({
      title: "Eliminar documento sustentatorio",
      message: `Se eliminará el documento "${getDocumentoNombre(documento)}". Esta acción lo desactivará del expediente.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    let payload = {};

    if (!tieneOrdenCompra && documentos.length <= 1) {
      const motivo = await prompt({
        title: "Motivo sin documentación sustentatoria",
        message:
          "Esta nota quedará sin documentos activos. Indica el motivo por el cual no se cuenta con documentación sustentatoria.",
        placeholder: "Motivo obligatorio",
        defaultValue: nota?.motivoSinDocumentacionEntrega || "",
        confirmText: "Continuar",
        cancelText: "Cancelar",
        variant: "warning",
      });

      if (motivo === null) return;

      if (!String(motivo || "").trim()) {
        toast.error(
          "Debes indicar el motivo por el cual no se cuenta con documentación sustentatoria.",
        );
        return;
      }

      payload = {
        motivoSinDocumentacionEntrega: motivo.trim(),
      };
    }

    try {
      const documentosActualizados = await eliminarDocumento(
        documento.id,
        payload,
      );
      toast.success("Documento sustentatorio eliminado.");
      onDocumentosChange?.(documentosActualizados);
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar el documento.");
    }
  };

  const handleView = async (documento) => {
    try {
      await setViewerDocumento(documento);
    } catch (error) {
      toast.error(error.message || "No se pudo abrir la vista previa.");
    }
  };


  const handlePrint = async (documento) => {
    try {
      let url = "";

      if (viewerDocumento?.id === documento.id && viewerBlobUrl) {
        url = viewerBlobUrl;
      } else {
        url = await setViewerDocumento(documento);
      }

      if (!url) {
        toast.error("No se pudo preparar el documento para impresión.");
        return;
      }

      printBlobUrl(url);
    } catch (error) {
      toast.error(error.message || "No se pudo imprimir el documento.");
    }
  };

  const handleClose = () => {
    closeModal();
  };

  if (!isOpen) return null;

  const viewerUrl = viewerBlobUrl;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Documentación sustentatoria - ${nota?.codigo || ""}`}
      maxWidth="max-w-6xl"
      bodyClassName="max-h-[82vh] space-y-5 overflow-y-auto pr-1"
    >
      {dialogNode}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Documentos adjuntos: {documentos.length}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Este modal muestra primero el listado de documentos
              sustentatorios. Desde cada fila puedes ver, imprimir, editar o
              eliminar.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
          >
            Subir documento
          </button>
        </div>

        {documentos.length === 0 ? (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Motivo sin documentación sustentatoria:{" "}
            {nota?.motivoSinDocumentacionEntrega || "No registrado"}
          </div>
        ) : null}
      </div>

      {formMode ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-indigo-950">
              {formMode === "create"
                ? "Subir documento sustentatorio"
                : "Editar metadata del documento"}
            </h3>

            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <select
              aria-label="Tipo de documento sustentatorio"
              value={form.tipoDocumento}
              onChange={(event) =>
                setFormField("tipoDocumento", event.target.value)
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {DOCUMENTO_ENTREGA_TIPOS.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>

            <input
              aria-label="Número de documento sustentatorio"
              type="text"
              value={form.numeroDocumento}
              onChange={(event) =>
                setFormField("numeroDocumento", event.target.value)
              }
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Número de documento"
            />

            <input
              aria-label="Fecha del documento sustentatorio"
              type="date"
              value={form.fechaDocumento}
              onChange={(event) =>
                setFormField("fechaDocumento", event.target.value)
              }
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />

            {formMode === "create" ? (
              <input
                aria-label="Archivo del documento sustentatorio"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={(event) =>
                  setFormField("file", event.target.files?.[0] || null)
                }
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            ) : (
              <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                El archivo no se reemplaza aquí.
              </div>
            )}
          </div>

          <textarea
            aria-label="Observaciones del documento sustentatorio"
            value={form.observaciones}
            onChange={(event) =>
              setFormField("observaciones", event.target.value)
            }
            rows="2"
            className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Observaciones del documento"
          />

          {form.file ? (
            <p className="mt-2 text-xs text-slate-600">
              Archivo seleccionado: {form.file.name}
            </p>
          ) : null}

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar documento"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {documentos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No hay documentos sustentatorios activos.
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {documentos.map((documento) => (
                <DocumentoMobileCard
                  key={documento.id}
                  documento={documento}
                  submitting={submitting}
                  onView={handleView}
                  onPrint={handlePrint}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[920px] text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Número</th>
                      <th className="px-4 py-3 text-left">Fecha documento</th>
                      <th className="px-4 py-3 text-left">Archivo</th>
                      <th className="px-4 py-3 text-left">Subido por</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documentos.map((documento) => (
                      <tr
                        key={documento.id}
                        className="border-t border-slate-200 align-top"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {getTipoDocumentoLabel(documento.tipoDocumento)}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {documento.numeroDocumento || "-"}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {formatDateOnly(documento.fechaDocumento)}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          <div className="max-w-xs truncate">
                            {getDocumentoNombre(documento)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {documento.mimeType || "-"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          <div>{documento.subidoPor?.nombre || "-"}</div>
                          <div className="text-xs text-slate-500">
                            {formatDateTime(documento.createdAt)}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <DocumentoActions
                            documento={documento}
                            submitting={submitting}
                            onView={handleView}
                            onPrint={handlePrint}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* IMPLEMENTACIÓN MEJORADA DEL VISOR DE DOCUMENTOS */}
      {viewerDocumento ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Vista previa
              </h3>
              <p className="text-xs text-slate-500">
                {getDocumentoNombre(viewerDocumento)}
              </p>
            </div>

            <button
              type="button"
              onClick={clearViewerDocumento}
              className="self-start rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar visor
            </button>
          </div>

          {/* 1. Bloque de Carga (Sólo si está procesando el Blob) */}
          {viewerLoading ? (
            <div className="rounded border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 animate-pulse">
              Cargando vista previa del documento...
            </div>
          ) : null}

          {/* 2. Renderizado del PDF (Sólo si terminó de cargar, es PDF y hay Blob URL) */}
          {!viewerLoading && isPdf(viewerDocumento) && viewerUrl ? (
            <iframe
              title={getDocumentoNombre(viewerDocumento)}
              src={viewerUrl}
              sandbox="allow-same-origin"
              referrerPolicy="no-referrer"
              className="h-[65vh] w-full rounded border border-slate-200"
            />
          ) : null}

          {/* 3. Renderizado de la Imagen (Sólo si terminó de cargar, es imagen y hay Blob URL) */}
          {!viewerLoading && isImage(viewerDocumento) && viewerUrl ? (
            <div className="flex justify-center rounded border border-slate-200 bg-slate-50 p-3">
              <img
                src={viewerUrl}
                alt={getDocumentoNombre(viewerDocumento)}
                title={getDocumentoNombre(viewerDocumento)}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>
          ) : null}

          {/* 4. Caso Alternativo: Formato no soportado */}
          {!viewerLoading &&
          !isPdf(viewerDocumento) &&
          !isImage(viewerDocumento) ? (
            <div className="rounded border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              Este formato no tiene vista previa.
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-xs text-slate-500">Procesando documentos...</p>
      ) : null}
    </Modal>
  );
};

export default DocumentosNotaIngresoModal;
