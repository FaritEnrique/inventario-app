import React from "react";

const variantStyles = {
  default: {
    icon: "?",
    iconClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
    confirmClass: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  warning: {
    icon: "!",
    iconClass: "border-amber-200 bg-amber-50 text-amber-700",
    confirmClass: "bg-amber-600 text-white hover:bg-amber-700",
  },
  danger: {
    icon: "!",
    iconClass: "border-rose-200 bg-rose-50 text-rose-700",
    confirmClass: "bg-rose-600 text-white hover:bg-rose-700",
  },
};

const ConfirmToast = ({
  closeToast,
  message,
  onConfirm,
  confirmButtonText,
  cancelButtonText,
  title = "Confirmar accion",
  variant = "default",
}) => {
  const styles = variantStyles[variant] || variantStyles.default;

  const handleConfirm = async () => {
    await onConfirm();
    closeToast();
  };

  const handleCancel = () => {
    closeToast();
  };

  return (
    <div className="w-[min(92vw,420px)] rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-xl">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${styles.iconClass}`}
        >
          {styles.icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-600">{message}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          {cancelButtonText || "Cancelar"}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`rounded px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmClass}`}
        >
          {confirmButtonText || "Confirmar"}
        </button>
      </div>
    </div>
  );
};

export default ConfirmToast;
