import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  css: { postcss: { plugins: [] } },
  test: {
    root,
    environment: "node",
    // Las pruebas de integración (test/integration) requieren una base de
    // datos real y se corren aparte: npx vitest run test/integration
    include: ["test/unit/**/*.test.ts"],
  },
});
