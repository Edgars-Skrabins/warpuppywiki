import { describe, expect, it } from "vitest";
import { keysToDelete } from "./trim";

describe("keysToDelete", () => {
  it("deletes nothing under or at the cap", () => {
    expect(keysToDelete(["a", "b"], 3)).toEqual([]);
    expect(keysToDelete(["a", "b", "c"], 3)).toEqual([]);
    expect(keysToDelete([], 3)).toEqual([]);
  });

  it("deletes the oldest keys down to the cap", () => {
    expect(keysToDelete(["a", "b", "c", "d", "e"], 3)).toEqual(["a", "b"]);
  });

  it("deletes everything with a cap of zero", () => {
    expect(keysToDelete(["a", "b"], 0)).toEqual(["a", "b"]);
  });
});
