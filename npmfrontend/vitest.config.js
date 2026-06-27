import { defineConfig } from "vitest/config"

// Unit tests live next to source as src/**/*.test.{js,jsx}. The tests/ directory
// holds Playwright E2E specs (*.spec.ts) — those are run by `npm run test:e2e`,
// not Vitest, so they are excluded here.
export default defineConfig({
  test: {
    include: ["src/**/*.test.{js,jsx}"],
    environment: "node",
  },
})
