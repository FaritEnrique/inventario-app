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

  it("abre, escribe y dispara print de forma deterministica", async () => {
    let loadHandler = null;
    const documentRef = {
      readyState: "loading",
      open: vi.fn(),
      write: vi.fn(() => {
        documentRef.readyState = "complete";
        loadHandler?.();
      }),
      close: vi.fn(),
      images: [],
      fonts: {
        ready: Promise.resolve(),
      },
    };
    const printWindow = {
      document: documentRef,
      addEventListener: vi.fn((eventName, handler) => {
        if (eventName === "load") {
          loadHandler = handler;
        }
      }),
      requestAnimationFrame: vi.fn((handler) => {
        handler();
        return 1;
      }),
      focus: vi.fn(),
      print: vi.fn(),
    };
    const open = vi.fn(() => printWindow);

    vi.stubGlobal("window", { open });

    await printHtmlInNewWindow("<html><body>demo</body></html>");

    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(documentRef.open).toHaveBeenCalledTimes(1);
    expect(documentRef.write).toHaveBeenCalledWith(
      "<html><body>demo</body></html>",
    );
    expect(documentRef.close).toHaveBeenCalledTimes(1);
    expect(printWindow.focus).toHaveBeenCalledTimes(1);
    expect(printWindow.print).toHaveBeenCalledTimes(1);
  });

  it("falla con un error claro cuando el navegador bloquea el popup", async () => {
    vi.stubGlobal("window", {
      open: vi.fn(() => null),
    });

    await expect(
      printHtmlInNewWindow("<html><body>demo</body></html>"),
    ).rejects.toThrow("No se pudo abrir la ventana de impresion.");
  });
});
