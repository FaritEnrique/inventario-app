// src/components/Modal.jsx
import React, { useEffect, useId } from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
  overlayClassName = "",
  panelClassName = "",
  headerClassName = "",
  titleClassName = "",
  bodyClassName = "",
  showCloseButton = true,
  closeOnBackdrop = true,
}) => {
  const titleId = useId();

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      onClose?.();
    }
  };

  const handleBackdropKeyDown = (event) => {
    if (
      event.target === event.currentTarget &&
      closeOnBackdrop &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      onClose?.();
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-gray-600 bg-opacity-50 p-4 ${overlayClassName}`}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        className={`relative mx-auto w-full rounded-md border bg-white shadow-lg ${maxWidth} ${panelClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {title || showCloseButton ? (
          <div
            className={`flex items-center justify-between border-b p-4 ${headerClassName}`}
          >
            {title ? (
              <h3
                id={titleId}
                className={`text-lg font-bold text-gray-800 ${titleClassName}`}
              >
                {title}
              </h3>
            ) : (
              <span />
            )}
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="text-3xl font-light leading-none text-gray-500 hover:text-gray-800"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            ) : null}
          </div>
        ) : null}
        <div
          className={`max-h-[80vh] overflow-y-auto px-4 pb-4 ${
            title || showCloseButton ? "pt-6" : "p-6"
          } ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
