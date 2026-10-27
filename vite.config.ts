import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: (id: string) => !/src[\\/]ui[\\/]components[\\/]charts[\\/]/.test(id),
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "charts",
              includeDependenciesRecursively: false,
              test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light|eventemitter3|internmap|tiny-invariant|es-toolkit|immer|reselect|redux|redux-thunk|react-redux|react-is|@reduxjs[\\/]toolkit)[\\/]|src[\\/]ui[\\/]components[\\/]charts[\\/](?!chartTheme\.)/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    exclude: [...configDefaults.exclude, ".claude/**"],
    fsModuleCache: false,
  },
});
