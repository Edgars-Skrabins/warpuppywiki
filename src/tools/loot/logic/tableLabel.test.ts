import { describe, expect, it } from "vitest";
import { isOtherTable, tableLabel } from "./tableLabel";

describe("tableLabel", () => {
  it("splits camel case words", () => {
    expect(tableLabel("AbandonedTower")).toBe("Abandoned Tower");
    expect(tableLabel("Bow")).toBe("Bow");
  });

  it("joins dotted parts with a middle dot", () => {
    expect(tableLabel("SniperOnly.HighValue")).toBe("Sniper Only · High Value");
  });

  it("keeps model names with capitals and digits together", () => {
    expect(tableLabel("KH2002")).toBe("KH2002");
    expect(tableLabel("MMGL")).toBe("MMGL");
    expect(tableLabel("SigSpear")).toBe("Sig Spear");
  });
});

describe("isOtherTable", () => {
  it("flags the test tables regardless of case", () => {
    expect(isOtherTable("Test")).toBe(true);
    expect(isOtherTable("prelobby")).toBe(true);
    expect(isOtherTable("AbandonedTower")).toBe(false);
  });
});
