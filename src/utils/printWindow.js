const PRINT_WINDOW_LOAD_TIMEOUT_MS = 4000;
const PRINT_WINDOW_RESOURCE_TIMEOUT_MS = 4000;

const BLOCKED_PRINTABLE_HTML_PATTERNS = [
  /<\s*(?:script|iframe|object|embed|base|form|input|button|textarea|select)\b/i,
  /<\s*meta\b[^>]*http-equiv\s*=/i,
  /\son[a-z]+\s*=/i,
  /\bsrcdoc\s*=/i,
  /\b(?:href|src|xlink:href|action|formaction)\s*=\s*["']?\s*javascript:/i,
  /url\s*\(\s*["']?\s*javascript:/i,
  /expression\s*\(/i,
];

const assertPrintableHtmlIsSafe = (htmlContent) => {
  const normalizedHtml = String(htmlContent ?? "");

  if (!normalizedHtml.trim()) {
    throw new Error("El documento de impresion esta vacio.");
  }

  if (BLOCKED_PRINTABLE_HTML_PATTERNS.some((pattern) => pattern.test(normalizedHtml))) {
    throw new Error("El documento de impresion contiene contenido activo no permitido.");
  }

  return normalizedHtml;
};

const createPrintableHtmlUrl = (htmlContent) => {
  const safeHtmlContent = assertPrintableHtmlIsSafe(htmlContent);
  const blob = new Blob([safeHtmlContent], {
    type: "text/html;charset=utf-8",
  });

  return URL.createObjectURL(blob);
};
const wait = (timeoutMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });

const raceWithTimeout = async (promise, timeoutMs) => {
  await Promise.race([promise, wait(timeoutMs)]);
};

const waitForWindowLoad = (printWindow) =>
  new Promise((resolve) => {
    let settled = false;
    let timeoutId = null;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve();
    };

    timeoutId = setTimeout(finish, PRINT_WINDOW_LOAD_TIMEOUT_MS);

    if (typeof printWindow.addEventListener === "function") {
      printWindow.addEventListener("load", finish, { once: true });
    } else {
      const previousOnLoad = printWindow.onload;
      printWindow.onload = (...args) => {
        previousOnLoad?.apply(printWindow, args);
        finish();
      };
    }

    if (printWindow.document?.readyState === "complete") {
      setTimeout(finish, 0);
    }
  });

const waitForDocumentFonts = async (documentRef) => {
  if (!documentRef?.fonts?.ready) {
    return;
  }

  try {
    await raceWithTimeout(documentRef.fonts.ready, PRINT_WINDOW_RESOURCE_TIMEOUT_MS);
  } catch {
    // noop
  }
};

const waitForDocumentImages = async (documentRef) => {
  const pendingImages = Array.from(documentRef?.images || []).filter(
    (image) => !image.complete,
  );

  if (!pendingImages.length) {
    return;
  }

  await Promise.allSettled(
    pendingImages.map(
      (image) =>
        new Promise((resolve) => {
          let timeoutId = null;

          const finish = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            resolve();
          };

          timeoutId = setTimeout(finish, PRINT_WINDOW_RESOURCE_TIMEOUT_MS);
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
        }),
    ),
  );
};

const waitForStablePaint = async (printWindow) => {
  if (typeof printWindow.requestAnimationFrame === "function") {
    await new Promise((resolve) => {
      printWindow.requestAnimationFrame(() => {
        printWindow.requestAnimationFrame(resolve);
      });
    });
    return;
  }

  await wait(60);
};

export const collectPrintableHeadMarkup = (
  sourceDocument = typeof document !== "undefined" ? document : null,
) => {
  if (!sourceDocument?.querySelectorAll) {
    return "";
  }

  return Array.from(
    sourceDocument.querySelectorAll('link[rel="stylesheet"], style'),
  )
    .map((node) => node.outerHTML)
    .join("\n");
};

export const printHtmlInNewWindow = async (
  htmlContent,
  {
    target = "_blank",
    features = "",
  } = {},
) => {
  if (typeof window === "undefined") {
    throw new Error("La impresion en ventana no esta disponible.");
  }

  const printableUrl = createPrintableHtmlUrl(htmlContent);
  const printWindow = features
    ? window.open(printableUrl, target, features)
    : window.open(printableUrl, target);

  if (!printWindow) {
    URL.revokeObjectURL(printableUrl);
    throw new Error("No se pudo abrir la ventana de impresion.");
  }

  printWindow.opener = null;

  try {
    await waitForWindowLoad(printWindow);
    await waitForDocumentFonts(printWindow.document);
    await waitForDocumentImages(printWindow.document);
    await waitForStablePaint(printWindow);

    printWindow.focus?.();
    printWindow.print?.();

    return printWindow;
  } finally {
    URL.revokeObjectURL(printableUrl);
  }
};
