import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({
  cwd: import.meta.dirname,
  overrideConfig: tseslint.configs.disableTypeChecked,
});

async function boundaryErrors(filePath: string, source: string) {
  const [result] = await eslint.lintText(`import { value } from "${source}";\nexport { value };\n`, { filePath });
  return (result?.messages ?? []).filter((message) => message.ruleId === "boundaries/dependencies");
}

const cases: Array<{ name: string; from: string; alias: string; relative: string; allowed: boolean }> = [
  {
    name: "tool to another tool",
    from: "src/tools/__fixture_alpha/importer.ts",
    alias: "@/tools/__fixture_beta/b",
    relative: "../__fixture_beta/b",
    allowed: false,
  },
  {
    name: "tool to its own file",
    from: "src/tools/__fixture_alpha/importer.ts",
    alias: "@/tools/__fixture_alpha/a",
    relative: "./a",
    allowed: true,
  },
  {
    name: "tool to core",
    from: "src/tools/__fixture_alpha/importer.ts",
    alias: "@/core/__fixture/sample",
    relative: "../../core/__fixture/sample",
    allowed: true,
  },
  {
    name: "tool to ui",
    from: "src/tools/__fixture_alpha/importer.ts",
    alias: "@/ui/__fixture",
    relative: "../../ui/__fixture",
    allowed: true,
  },
  {
    name: "tool to app",
    from: "src/tools/__fixture_alpha/importer.ts",
    alias: "@/app/__fixture",
    relative: "../../app/__fixture",
    allowed: false,
  },
  {
    name: "core to ui",
    from: "src/core/__fixture/importer.ts",
    alias: "@/ui/__fixture",
    relative: "../../ui/__fixture",
    allowed: false,
  },
  {
    name: "core to tool",
    from: "src/core/__fixture/importer.ts",
    alias: "@/tools/__fixture_alpha/a",
    relative: "../../tools/__fixture_alpha/a",
    allowed: false,
  },
  {
    name: "ui to tool",
    from: "src/ui/importer.ts",
    alias: "@/tools/__fixture_alpha/a",
    relative: "../tools/__fixture_alpha/a",
    allowed: false,
  },
  {
    name: "ui to core",
    from: "src/ui/importer.ts",
    alias: "@/core/__fixture/sample",
    relative: "../core/__fixture/sample",
    allowed: true,
  },
  {
    name: "app to tool",
    from: "src/app/importer.ts",
    alias: "@/tools/__fixture_alpha/a",
    relative: "../tools/__fixture_alpha/a",
    allowed: true,
  },
];

describe("import boundaries", () => {
  describe.each(cases)("$name", ({ from, alias, relative, allowed }) => {
    it.each([
      ["alias", alias],
      ["relative", relative],
    ])(`is ${allowed ? "allowed" : "reported"} with a %s import`, async (_kind, source) => {
      const errors = await boundaryErrors(from, source);

      expect(errors).toHaveLength(allowed ? 0 : 1);
    });
  });
});
