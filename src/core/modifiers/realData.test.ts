import { describe, expect, it } from "vitest";
import { ATTRIBUTES } from "./attributes";

const files: Record<string, unknown> = import.meta.glob(
  [
    "/public/data/builds.json",
    "/public/data/*/attachments.json",
    "/public/data/*/equipment.json",
    "/public/data/*/skills.json",
  ],
  { eager: true, import: "default" },
);

const builds = files["/public/data/builds.json"] as { latest: string } | undefined;

function dataFile(build: string, file: string): unknown {
  return files[`/public/data/${build}/${file}`];
}

function modifierAttributes(node: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(node)) {
    for (const child of node) {
      modifierAttributes(child, found);
    }
  } else if (node !== null && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (typeof record.attribute === "string" && typeof record.op === "string") {
      found.add(record.attribute);
    }
    for (const child of Object.values(record)) {
      modifierAttributes(child, found);
    }
  }
  return found;
}

function skillAttributes(data: unknown): Set<string> {
  const skills = (data as { skills: { effects: { attribute?: string }[] }[] }).skills;
  return new Set(skills.flatMap((skill) => skill.effects.flatMap((effect) => effect.attribute ?? [])));
}

const known = new Set(Object.keys(ATTRIBUTES).map((attribute) => attribute.toLowerCase()));

function missing(attributes: Set<string>): string[] {
  return [...attributes].filter((attribute) => !known.has(attribute.toLowerCase())).sort();
}

describe("attribute table against real data", () => {
  it.skipIf(!builds)("covers every attachment and equipment attribute and lists the skill ones it lacks", () => {
    const latest = builds?.latest ?? "";
    const gear = modifierAttributes([dataFile(latest, "attachments.json"), dataFile(latest, "equipment.json")]);
    const skills = skillAttributes(dataFile(latest, "skills.json"));

    console.log(`Build ${latest} skill attributes without a table entry: ${missing(skills).join(", ") || "none"}`);
    expect(gear.size).toBeGreaterThan(0);
    expect(missing(gear)).toEqual([]);
  });
});
