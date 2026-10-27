import { describe, expect, it } from "vitest";
import { conditionHolds, describeCondition } from "./conditions";

const HEADSHOT = "Challenges.Context.Headshot";
const SNIPER = "Challenges.Context.SniperKill";
const FRIENDLY = "Challenges.Context.FriendlyKill";
const HOT_ZONE = "Challenges.Context.Instigator.InHotZone";

describe("conditionHolds", () => {
  it("needs every tag for all", () => {
    const when = { match: "all" as const, tags: [SNIPER, HOT_ZONE] };
    expect(conditionHolds(when, [SNIPER, HOT_ZONE, HEADSHOT])).toBe(true);
    expect(conditionHolds(when, [SNIPER])).toBe(false);
  });

  it("needs at least one tag for any", () => {
    const when = { match: "any" as const, tags: [SNIPER, FRIENDLY] };
    expect(conditionHolds(when, [FRIENDLY])).toBe(true);
    expect(conditionHolds(when, [HEADSHOT])).toBe(false);
  });

  it("needs no tag for none", () => {
    const when = { match: "none" as const, tags: [SNIPER, FRIENDLY] };
    expect(conditionHolds(when, [HEADSHOT])).toBe(true);
    expect(conditionHolds(when, [HEADSHOT, SNIPER])).toBe(false);
  });

  it("evaluates nested of groups", () => {
    const headshotNotArtillery = {
      match: "all" as const,
      of: [
        { match: "all" as const, tags: [HEADSHOT] },
        { match: "none" as const, tags: ["Challenges.Context.PrecisionArtilleryStrikeKill"] },
      ],
    };
    expect(conditionHolds(headshotNotArtillery, [HEADSHOT])).toBe(true);
    expect(conditionHolds(headshotNotArtillery, [HEADSHOT, "Challenges.Context.PrecisionArtilleryStrikeKill"])).toBe(
      false,
    );
    expect(conditionHolds(headshotNotArtillery, [])).toBe(false);

    const sniperInZone = {
      match: "any" as const,
      of: [
        { match: "all" as const, tags: [SNIPER, HOT_ZONE] },
        { match: "all" as const, tags: [SNIPER, "Challenges.Context.Instigator.InControlZone"] },
      ],
    };
    expect(conditionHolds(sniperInZone, [SNIPER, "Challenges.Context.Instigator.InControlZone"])).toBe(true);
    expect(conditionHolds(sniperInZone, [SNIPER])).toBe(false);
  });

  it("matches tags case-insensitively and lets sub-tags match their parents", () => {
    expect(conditionHolds({ match: "all", tags: ["challenges.context.headshot"] }, [HEADSHOT])).toBe(true);
    expect(conditionHolds({ match: "all", tags: ["Challenges.Context.Instigator"] }, [HOT_ZONE])).toBe(true);
    expect(conditionHolds({ match: "all", tags: ["Challenges.Context.Instig"] }, [HOT_ZONE])).toBe(false);
    expect(conditionHolds({ match: "all", tags: [HOT_ZONE] }, ["Challenges.Context.Instigator"])).toBe(false);
  });
});

describe("describeCondition", () => {
  it("names the tags that must be on or off", () => {
    expect(describeCondition({ match: "all", tags: [HEADSHOT] })).toBe("Headshot is on");
    expect(describeCondition({ match: "all", tags: [SNIPER, HOT_ZONE] })).toBe(
      "Sniper kill and Instigator in hot zone are on",
    );
    expect(describeCondition({ match: "any", tags: [SNIPER, FRIENDLY] })).toBe("Sniper kill or Friendly kill is on");
    expect(describeCondition({ match: "none", tags: [FRIENDLY] })).toBe("Friendly kill is off");
  });

  it("joins nested groups", () => {
    expect(
      describeCondition({
        match: "all",
        of: [
          { match: "any", tags: [SNIPER] },
          { match: "none", tags: [FRIENDLY] },
        ],
      }),
    ).toBe("Sniper kill is on and Friendly kill is off");
  });
});
