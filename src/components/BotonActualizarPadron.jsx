import React from "react";
import { toast } from "react-toastify";
import ConfirmToast from "./ConfirmToast";
import useSunat from "../hooks/useSunat";

const BotonActualizarPadron = () => {
  const { actualizarPadronSunat, actualizando } = useSunat();

  const handleClick = () => {
    toast(
      ({ closeToast }) => (
        <ConfirmToast
          closeToast={closeToast}
          message="La actualización manual del padrón SUNAT consume recursos y no debe hacerse con frecuencia, ya que el sistema la realiza automáticamente. ¿Desea continuar?"
          confirmButtonText="Sí, actualizar"
          cancelButtonText="No"
          onConfirm={async () => {
            try {
              await actualizarPadronSunat();
              toast.success("Padrón SUNAT actualizado correctamente.");
            } catch {
              toast.error("Error al actualizar el padrón.");
            }
          }}
        />
      ),
      { autoClose: false }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={actualizando}
      className={`rounded bg-yellow-500 px-4 py-2 font-bold text-white hover:bg-yellow-600 ${
        actualizando ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      {actualizando ? "Actualizando..." : "Actualizar padrón SUNAT"}
    </button>
  );
};

export default BotonActualizarPadron;
