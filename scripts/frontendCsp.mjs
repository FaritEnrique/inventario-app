import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const appRootDir = path.resolve(__dirname, "..");

const DEV_CONNECT_SOURCES = Object.freeze([
  "'self'",
  "ws:",
  "wss:",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const DEV_IMAGE_SOURCES = Object.freeze([
  "'self'",
  "data:",
  "blob:",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export const parseApiOrigin = (apiUrl) => {
  const normalizedValue = String(apiUrl || "").trim();

  if (!normalizedValue) {
    return null;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch (error) {
    throw new Error(
      `VITE_API_URL no es una URL válida para CSP: ${normalizedValue}`,
    );
  }

  if (!/^https?:$/.test(parsedUrl.protocol)) {
    throw new Error(
      `VITE_API_URL debe usar http o https para CSP: ${normalizedValue}`,
    );
  }

  return parsedUrl.origin;
};

export const loadFrontendEnv = (mode, rootDir = appRootDir) =>
  loadEnv(mode, rootDir, "");

export const resolveProductionApiOrigin = (env) => {
  const apiOrigin = parseApiOrigin(env?.VITE_API_URL);

  if (!apiOrigin) {
    throw new Error(
      "VITE_API_URL es obligatoria para construir la CSP productiva del frontend.",
    );
  }

  return apiOrigin;
};

export const buildFrontendCsp = ({ mode, env, runtime = "production" }) => {
  const isDevelopment = runtime === "development";
  const configuredApiOrigin = parseApiOrigin(env?.VITE_API_URL);

  const connectSources = isDevelopment
    ? [
        ...DEV_CONNECT_SOURCES,
        ...(configuredApiOrigin ? [configuredApiOrigin] : []),
      ]
    : ["'self'", resolveProductionApiOrigin(env)];

  const imageSources = isDevelopment
    ? [
        ...DEV_IMAGE_SOURCES,
        ...(configuredApiOrigin ? [configuredApiOrigin] : []),
      ]
    : ["'self'", "data:", "blob:", resolveProductionApiOrigin(env)];

  const scriptSources = isDevelopment
    ? ["'self'", "'unsafe-inline'"]
    : ["'self'"];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
  ].join("; ");
};

export const buildCommonSecurityHeaders = (cspValue) => ({
  "Content-Security-Policy": cspValue,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
});

export const buildNetlifyHeadersFile = (headers) => {
  const lines = ["/*"];

  for (const [headerName, headerValue] of Object.entries(headers)) {
    lines.push(`  ${headerName}: ${headerValue}`);
  }

  return `${lines.join("\n")}\n`;
};

export const buildVercelHeadersConfig = (headers) => ({
  headers: [
    {
      source: "/(.*)",
      headers: Object.entries(headers).map(([key, value]) => ({ key, value })),
    },
  ],
});
