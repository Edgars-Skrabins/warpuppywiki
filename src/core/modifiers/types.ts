export type ModifierOp = "multiplyCompound" | "multiply" | "add" | "override";

export interface Modifier {
  attribute: string;
  op: ModifierOp;
  value: number;
}

export interface SourcedModifier {
  source: string;
  modifier: Modifier;
}
