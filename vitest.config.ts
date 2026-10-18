import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    // Vitest 5 bundles tests through Vite, whose default output dir is "dist" -
    // the same directory the tsup build owns (the npm package's bin lives there).
    // Keep test bundling away from it so `npm test` can never clobber the CLI.
    outDir: "node_modules/.vitest-build",
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
