import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", ".next/**", ".worktrees/**", "tests/e2e/**"],
    globals: false,
    setupFiles: ["./tests/setup.ts"],
  },
});
