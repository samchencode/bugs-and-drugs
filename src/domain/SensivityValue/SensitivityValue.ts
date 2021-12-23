import type { SensitivityValueBehavior } from './SensitivityValueBehavior';
import ResistantValue from './ResistantValue';
import NumericValue from './NumericValue';

class SensitivityValue {
  #value: SensitivityValueBehavior;

  constructor(value: string) {
    this.validateInput(value);
    if (value === 'R') this.#value = new ResistantValue();
    else this.#value = new NumericValue(+value);
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

  private validateInput(value: string) {
    const isValid = !Number.isNaN(value) || value === 'R';
    if (!isValid) throw Error('Invalid sensitivity value ' + value);
  }
}

export default SensitivityValue;
