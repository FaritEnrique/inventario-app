import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectPrintableHeadMarkup,
  printHtmlInNewWindow,
} from "./printWindow";

describe("printWindow utilities", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recolecta estilos y links del documento actual", () => {
    const querySelectorAll = vi.fn(() => [
      { outerHTML: '<link rel="stylesheet" href="/app.css">' },
      { outerHTML: "<style>.demo { color: red; }</style>" },
    ]);

    const markup = collectPrintableHeadMarkup({ querySelectorAll });

    expect(querySelectorAll).toHaveBeenCalledWith(
      'link[rel="stylesheet"], style',
    );
    expect(markup).toContain('/app.css');
    expect(markup).toContain(".demo");
  });

  it("abre una URL temporal segura y dispara print de forma deterministica", async () => {
    const documentRef = {
      readyState: "complete",
      images: [],
      fonts: {
        ready: Promise.resolve(),
      },
    };
    const printWindow = {
      document: documentRef,
      addEventListener: vi.fn(),
      requestAnimationFrame: vi.fn((handler) => {
        handler();
        return 1;
      }),
      focus: vi.fn(),
      print: vi.fn(),
    };
    const open = vi.fn(() => printWindow);
    const createObjectURL = vi.fn(() => "blob:printable-document");
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("window", { open });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    await printHtmlInNewWindow("<html><body>demo</body></html>");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith("blob:printable-document", "_blank");
    expect(printWindow.opener).toBeNull();
    expect(printWindow.focus).toHaveBeenCalledTimes(1);
    expect(printWindow.print).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:printable-document");
  });

  it("rechaza contenido activo antes de abrir la ventana", async () => {
    vi.stubGlobal("window", { open: vi.fn() });

    await expect(
      printHtmlInNewWindow('<html><body><img src="x" onerror="alert(1)"></body></html>'),
    ).rejects.toThrow("contenido activo no permitido");

    expect(window.open).not.toHaveBeenCalled();
  });

  it("falla con un error claro cuando el navegador bloquea el popup", async () => {
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("window", {
      open: vi.fn(() => null),
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:blocked-document"),
      revokeObjectURL,
    });

    await expect(
      printHtmlInNewWindow("<html><body>demo</body></html>"),
    ).rejects.toThrow("No se pudo abrir la ventana de impresion.");

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:blocked-document");
  });
});
