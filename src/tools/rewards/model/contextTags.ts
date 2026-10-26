import type { ChallengeReward } from "@/core/data";

const CONTEXT_PREFIX = "challenges.context.";
const CENTIMETERS_PER_METER = 100;

export interface TagField {
  tag: string;
  label: string;
}

export interface NumberField {
  name: string;
  label: string;
  defaultValue: number;
}

export interface SituationFields {
  tags: TagField[];
  game: NumberField[];
  scaling: NumberField[];
}

function words(text: string): string[] {
  return text
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function sentence(parts: string[]): string {
  return parts
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return /^[A-Z0-9]+$/.test(word) && word.length > 1 ? word : word.toLowerCase();
    })
    .join(" ");
}

export function tagLabel(tag: string): string {
  const stripped = tag.toLowerCase().startsWith(CONTEXT_PREFIX) ? tag.slice(CONTEXT_PREFIX.length) : tag;
  return sentence(stripped.split(".").flatMap(words));
}

export function isDistanceInput(name: string): boolean {
  return name.includes("Distance");
}

export function inputLabel(name: string): string {
  const label = sentence(words(name));
  return isDistanceInput(name) ? `${label} (m)` : label;
}

export function toGameUnits(name: string, value: number): number {
  return isDistanceInput(name) ? value * CENTIMETERS_PER_METER : value;
}

export function defaultGameValue(name: string): number {
  return name === "CrewCount" ? 1 : 0;
}

function addUnique(list: string[], value: string): void {
  if (!list.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
    list.push(value);
  }
}

export function rewardTags(reward: ChallengeReward): string[] {
  const tags: string[] = [];
  for (const resource of reward.resources) {
    for (const input of resource.inputs) {
      for (const option of input.options) {
        for (const tag of option.when.tags ?? []) {
          addUnique(tags, tag);
        }
        for (const group of option.when.of ?? []) {
          for (const tag of group.tags) {
            addUnique(tags, tag);
          }
        }
      }
    }
  }
  return tags;
}

export function situationFields(reward: ChallengeReward): SituationFields {
  const game: string[] = [];
  const scaling: string[] = [];
  for (const resource of reward.resources) {
    for (const variable of resource.variables) {
      if (variable.type === "game") {
        addUnique(game, variable.game);
      } else if (variable.type === "scaling") {
        addUnique(scaling, variable.input);
      }
    }
  }
  return {
    tags: rewardTags(reward).map((tag) => ({ tag, label: tagLabel(tag) })),
    game: game.map((name) => ({ name, label: inputLabel(name), defaultValue: defaultGameValue(name) })),
    scaling: scaling.map((name) => ({ name, label: inputLabel(name), defaultValue: 0 })),
  };
}

export function isCash(resource: string): boolean {
  return resource.toLowerCase() === "currency.cash";
}

export function resourceLabel(resource: string): string {
  if (isCash(resource)) {
    return "Cash";
  }
  const parts = resource.split(".");
  if (parts[0] === "XP" && parts[1] === "Role") {
    return parts.length > 2 ? `${sentence(parts.slice(2).flatMap(words))} XP` : "Role XP";
  }
  return tagLabel(resource);
}
