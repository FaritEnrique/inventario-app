import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import HeaderProcesoLogistico from "./HeaderProcesoLogistico";

describe("HeaderProcesoLogistico", () => {
  it("muestra resumen, alertas y badge sin rutas antiguas", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/cotizaciones/proceso/5"]}>
        <HeaderProcesoLogistico
          id={5}
          detalleGlobal={{
            codigo: "REQ-5",
            alertasSeguimiento: {
              resumen: [
                { tipo: "BUENA_PRO_SIN_OC", cantidad: 2 },
                { tipo: "OC_PENDIENTE_APROBACION", cantidad: 1 },
              ],
            },
          }}
        />
      </MemoryRouter>,
    );

    expect(html).toContain("Resumen");
    expect(html).toContain("Alertas");
    expect(html).toContain("/cotizaciones/proceso/5/alertas");
    expect(html).toContain(">3</span>");
    expect(html).not.toContain("Detalle");
    expect(html).not.toContain("/prueba");
  });
});
