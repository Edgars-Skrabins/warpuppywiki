import { describe, expect, it } from "vitest";
import type { Item } from "@/core/data";
import { fixtureItem, itemsFile } from "./fixtures/gameData";
import { buildVendorIndex, priceOf } from "./pricing";

const index = buildVendorIndex(itemsFile.items);

describe("priceOf", () => {
  it("prices base ammo from its own vendor entry", () => {
    expect(priceOf(index, "Id.Item.545mm")).toEqual({
      price: 15,
      amount: 10,
      unitPrice: 1.5,
      soldWith: "Id.Item.545mm",
      categories: ["Vendor.Category.Ammo.Type", "Vendor.Category.AmmoLoose"],
    });
  });

  it("prices an ammo variant from the base item's vendor list", () => {
    expect(priceOf(index, "ID.Item.545mm.ArmorPiercing")).toMatchObject({
      price: 40,
      amount: 10,
      unitPrice: 4,
      soldWith: "Id.Item.545mm",
    });
  });

  it("prices a pre-loaded magazine variation", () => {
    expect(priceOf(index, "Id.Item.AK74MMagazine.ArmorPiercing")).toMatchObject({
      price: 155,
      amount: 1,
      soldWith: "Id.Item.AK74MMagazine",
    });
  });

  it("returns null for an item not sold in the shop", () => {
    expect(priceOf(index, "Id.Item.AK74M")).toBeNull();
  });

  it("prefers the entry on the item whose id equals the tag", () => {
    const base = fixtureItem("Id.Item.M4");
    const reseller: Item = {
      ...base,
      id: "Id.Item.Reseller",
      vendor: [{ tag: "Id.Item.M4", price: 1, amount: 1, categories: [] }],
    };
    const other: Item = {
      ...base,
      id: "Id.Item.Other",
      vendor: [{ tag: "Id.Item.M4", price: 2, amount: 1, categories: [] }],
    };
    expect(priceOf(buildVendorIndex([reseller, base, other]), "Id.Item.M4")).toMatchObject({
      price: 2800,
      soldWith: "Id.Item.M4",
    });
    expect(priceOf(buildVendorIndex([reseller, other]), "Id.Item.M4")).toMatchObject({
      price: 1,
      soldWith: "Id.Item.Reseller",
    });
  });
});
