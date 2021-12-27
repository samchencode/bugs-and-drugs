import type { SensitivityValueBehavior } from "./SensitivityValueBehavior";

class NumericValue implements SensitivityValueBehavior {
  private value;

  constructor(value: number) {
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return '' + this.value + '%';
  }
  valueOf(): number {
    return this.getValue();
  }
  isResistant(): boolean {
    return false;
  }
}

export default NumericValue;
