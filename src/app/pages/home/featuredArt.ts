export const FEATURED = ["loadout", "ttk", "map"] as const;

export const HERO_ART_PATH = "icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_001v2.png";

export const ART: Record<string, { path: string; kind: "render" | "map" }> = {
  loadout: { path: HERO_ART_PATH, kind: "render" },
  ttk: { path: "icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_008.png", kind: "render" },
  map: { path: "maps/kavkazi/tiles/2/1/2.webp", kind: "map" },
};
