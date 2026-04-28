import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import {
  buildCommonSecurityHeaders,
  buildFrontendCsp,
  loadFrontendEnv,
} from "./scripts/frontendCsp.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadFrontendEnv(mode, __dirname);
  const devDocumentCsp = buildFrontendCsp({
    mode,
    env,
    runtime: "development",
  });
  const previewDocumentCsp = buildFrontendCsp({
    mode,
    env,
    runtime: "production",
  });
  const devSecurityHeaders = buildCommonSecurityHeaders(devDocumentCsp);
  const previewSecurityHeaders = buildCommonSecurityHeaders(previewDocumentCsp);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      headers: devSecurityHeaders,
    },
    preview: {
      headers: previewSecurityHeaders,
    },
  };
});
