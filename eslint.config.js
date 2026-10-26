import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const allowTo = (from, types) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: { anyOf: types } } } },
});

export default defineConfig(
  { ignores: ["dist", "coverage", "public", ".claude"] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: ["./tsconfig.json", "./tsconfig.node.json"],
        },
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**", partialMatch: false },
        { type: "core", pattern: "src/core/*", capture: ["module"], partialMatch: false },
        { type: "ui", pattern: "src/ui/**", partialMatch: false },
        { type: "tool", pattern: "src/tools/*", capture: ["toolId"], partialMatch: false },
        { type: "scripts", pattern: "scripts/**", partialMatch: false },
        { type: "test", pattern: "src/test/**", partialMatch: false },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            allowTo("app", ["app", "core", "ui", "tool", "test"]),
            allowTo("core", ["core", "test"]),
            allowTo("ui", ["ui", "core", "test"]),
            allowTo("tool", ["core", "ui", "test"]),
            {
              from: { element: { type: "tool" } },
              allow: {
                to: { element: { type: "tool", captured: { toolId: "{{ from.element.captured.toolId }}" } } },
              },
            },
            allowTo("scripts", ["scripts", "core"]),
            allowTo("test", ["core", "test"]),
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
