interface SensitivityValueBehavior {
  getValue(): number | 'R';
  toString(): string;
  valueOf(): number;
  isResistant(): boolean;
}

export type { SensitivityValueBehavior };
