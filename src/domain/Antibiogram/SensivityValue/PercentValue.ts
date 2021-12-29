import type { SensitivityValueBehavior } from './SensitivityValueBehavior';

class PercentValue implements SensitivityValueBehavior {
  #value: number;

  constructor(value: number) {
    this.#validateInput(value);
    this.#value = value;
  }

  getValue(): number {
    return this.#value;
  }

  toString(): string {
    return '' + this.#value + '%';
  }
  valueOf(): number {
    return this.getValue();
  }
  isResistant(): boolean {
    return false;
  }

  #validateInput(value: number) {
    if (value > 100) throw new PercentSensitivityValueValidationError(value);
    if (value < 0) throw new PercentSensitivityValueValidationError(value);
  }
}

class PercentSensitivityValueValidationError extends Error {
  constructor(input: number) {
    super();
    this.message = 'Invalid sensitivity value: ' + input + '%';
  }
}

export default PercentValue;
