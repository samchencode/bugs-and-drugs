import ValueObject from '@/domain/base/ValueObject';
import type { SensitivityValueBehavior } from './SensitivityValueBehavior';
import ResistantValue from './ResistantValue';
import PercentValue from './PercentValue';

class SensitivityValue extends ValueObject {
  #value: SensitivityValueBehavior;

  constructor(value: string) {
    super();
    this.#validateInput(value);
    if (value === 'R') this.#value = new ResistantValue();
    else this.#value = new PercentValue(+value);
  }

  isResistent() {
    return this.#value.isResistant();
  }

  getValue() {
    return this.#value.getValue();
  }

  toString() {
    return this.#value.toString();
  }

  valueOf() {
    return this.#value.valueOf();
  }

  #validateInput(value: string) {
    if (value === 'R') return;
    if (!stringContainsNumber(value))
      throw new SensitivityValueValidationError(value);
  }

  protected isIdentical(v: SensitivityValue): boolean {
    return this.#value.getValue() === v.getValue();
  }
}

function stringContainsNumber(input: string) {
  const trimmedInput = input.trim();
  if (trimmedInput.length === 0) return false;
  const coercedToNaN = Number.isNaN(+trimmedInput);
  if (coercedToNaN) return false;
  return true;
}

class SensitivityValueValidationError extends Error {
  constructor(inputValue: string) {
    super();
    this.message = 'Invalid sensitivity value: ' + inputValue;
  }
}

export default SensitivityValue;
