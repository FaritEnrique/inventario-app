import { useCallback, useState } from "react";
import Modal from "../components/Modal";

const variantButtonClass = {
  default: "bg-indigo-600 hover:bg-indigo-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  danger: "bg-rose-600 hover:bg-rose-700",
  neutral: "bg-slate-700 hover:bg-slate-800",
};

const normalizeOptions = (options, defaultValue = "") =>
  typeof options === "string" ? { message: options, defaultValue } : options;

const useAppDialog = () => {
  const [dialog, setDialog] = useState(null);

  const closeDialog = useCallback((fallbackValue) => {
    setDialog((current) => {
      current?.resolve?.(fallbackValue);
      return null;
    });
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        const normalized = normalizeOptions(options);
        setDialog({
          type: "confirm",
          title: normalized.title || "Confirmar accion",
          message: normalized.message || "",
          confirmText: normalized.confirmText || "Confirmar",
          cancelText: normalized.cancelText || "Cancelar",
          variant: normalized.variant || "default",
          resolve,
        });
      }),
    [],
  );

  const prompt = useCallback(
    (options, defaultValue = "") =>
      new Promise((resolve) => {
        const normalized = normalizeOptions(options, defaultValue);
        setDialog({
          type: "prompt",
          title: normalized.title || "Registrar informacion",
          message: normalized.message || "",
          value: normalized.defaultValue || "",
          multiline: normalized.multiline !== false,
          confirmText: normalized.confirmText || "Aceptar",
          cancelText: normalized.cancelText || "Cancelar",
          placeholder: normalized.placeholder || "",
          variant: normalized.variant || "default",
          resolve,
        });
      }),
    [],
  );

  const alert = useCallback(
    (options) =>
      new Promise((resolve) => {
        const normalized = normalizeOptions(options);
        setDialog({
          type: "alert",
          title: normalized.title || "Aviso",
          message: normalized.message || "",
          confirmText: normalized.confirmText || "Entendido",
          variant: normalized.variant || "default",
          resolve,
        });
      }),
    [],
  );

  const handleConfirm = () => {
    if (!dialog) return;

    const value =
      dialog.type === "confirm"
        ? true
        : dialog.type === "prompt"
          ? dialog.value
          : undefined;

    closeDialog(value);
  };

  const handleCancel = () => {
    if (!dialog) return;
    closeDialog(dialog.type === "confirm" ? false : null);
  };

  const dialogNode = (
    <Modal
      isOpen={Boolean(dialog)}
      onClose={handleCancel}
      title={dialog?.title}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {dialog?.message ? (
          <p className="text-sm leading-6 text-slate-600">{dialog.message}</p>
        ) : null}

        {dialog?.type === "prompt" ? (
          dialog.multiline ? (
            <textarea
              value={dialog.value}
              onChange={(event) =>
                setDialog((current) =>
                  current ? { ...current, value: event.target.value } : current,
                )
              }
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder={dialog.placeholder}
              autoFocus
            />
          ) : (
            <input
              value={dialog.value}
              onChange={(event) =>
                setDialog((current) =>
                  current ? { ...current, value: event.target.value } : current,
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder={dialog.placeholder}
              autoFocus
            />
          )
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {dialog?.type !== "alert" ? (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {dialog?.cancelText || "Cancelar"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleConfirm}
            className={`rounded px-4 py-2 text-sm font-semibold text-white ${
              variantButtonClass[dialog?.variant] || variantButtonClass.default
            }`}
          >
            {dialog?.confirmText || "Aceptar"}
          </button>
        </div>
      </div>
    </Modal>
  );

  return { confirm, prompt, alert, dialogNode };
};

export default useAppDialog;
