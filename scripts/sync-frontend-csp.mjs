import fs from "node:fs/promises";
import path from "node:path";
import {
  appRootDir,
  buildCommonSecurityHeaders,
  buildFrontendCsp,
  buildNetlifyHeadersFile,
  buildVercelHeadersConfig,
  loadFrontendEnv,
  resolveProductionApiOrigin,
} from "./frontendCsp.mjs";

const productionEnv = loadFrontendEnv("production", appRootDir);
const productionApiOrigin = resolveProductionApiOrigin(productionEnv);
const productionCsp = buildFrontendCsp({
  mode: "production",
  env: productionEnv,
  runtime: "production",
});
const securityHeaders = buildCommonSecurityHeaders(productionCsp);

const vercelConfigPath = path.join(appRootDir, "vercel.json");
const netlifyHeadersPath = path.join(appRootDir, "public", "_headers");

await fs.writeFile(
  vercelConfigPath,
  `${JSON.stringify(buildVercelHeadersConfig(securityHeaders), null, 2)}\n`,
  "utf8",
);

await fs.mkdir(path.dirname(netlifyHeadersPath), { recursive: true });
await fs.writeFile(
  netlifyHeadersPath,
  buildNetlifyHeadersFile(securityHeaders),
  "utf8",
);

console.log(
  `[frontend-csp] CSP productiva sincronizada con VITE_API_URL -> ${productionApiOrigin}`,
);
