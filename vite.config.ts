import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";
import { preloadsPlugin } from "./vite/preloads.ts";

export default defineConfig({
  base: "./",
  plugins: [react(), preloadsPlugin()],
  build: {
    rolldownOptions: {
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        sw: fileURLToPath(new URL("./src/sw/sw.ts", import.meta.url)),
      },
      treeshake: {
        moduleSideEffects: (id: string) => !/src[\\/]ui[\\/]components[\\/]charts[\\/]/.test(id),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js"),
        codeSplitting: {
          groups: [
            {
              name: "charts",
              includeDependenciesRecursively: false,
              test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light|eventemitter3|internmap|tiny-invariant|es-toolkit|immer|reselect|redux|redux-thunk|react-redux|react-is|@reduxjs[\\/]toolkit)[\\/]|src[\\/]ui[\\/]components[\\/]charts[\\/](?!chartTheme\.)/,
            },
            {
              name: "index",
              tags: ["$initial"],
              test: /\.css$/,
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
  },
});
