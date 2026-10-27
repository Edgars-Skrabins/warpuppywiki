export const MODEL_NOTES: readonly string[] = [
  "Estimates built from the game files for build <build>. The server can change values; in-game results may differ.",
  "Player health is not in the game files. Results assume the health you set (default 100).",
  "The game combines damage rules in its own code. This model applies falloff, body-part multipliers, the infantry rules and armor in a fixed order.",
  "Armor reduction is scaled by the ammo type's armor effectiveness from the game files.",
  "Time to kill assumes every shot hits at the weapon's full fire rate and ignores reloads, recoil and travel time.",
  "Shotgun pellet counts are not in the game files; set the number of pellets that hit.",
  "Explosive weapons are not modeled.",
];

export function modelNotes(build: string): string[] {
  return MODEL_NOTES.map((note) => note.replace("<build>", build));
}
