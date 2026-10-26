import { describe, expect, it } from "vitest";
import { IdMap, normalizeId, sameId } from "./ids";

describe("ids", () => {
  it("compares ids regardless of case", () => {
    expect(sameId("Id.Item.SKSBarrel", "ID.Item.SKSBarrel")).toBe(true);
    expect(sameId("Id.Item.SKSBarrel", "Id.Item.SKS")).toBe(false);
    expect(normalizeId("ID.Item.SKSBarrel")).toBe(normalizeId("id.item.sksbarrel"));
  });

  it("finds IdMap entries with a different case", () => {
    const map = new IdMap<number>().set("Id.Item.SKSBarrel", 1);
    expect(map.get("ID.Item.SKSBarrel")).toBe(1);
    expect(map.has("id.item.sksbarrel")).toBe(true);
    expect(map.get("Id.Item.SKS")).toBeUndefined();
  });
});
