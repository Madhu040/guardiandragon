import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    globals: false,
    environment: "node",
    // Unit tests only. `tests/e2e/` is Playwright — vitest's default include would
    // otherwise collect those specs and fail on `test.describe` from the wrong runner.
    include: ["tests/unit/**/*.test.ts"],
  },
});
