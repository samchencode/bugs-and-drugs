import LessThanOnePercentValue from '@/domain/Antibiogram/Metadata/ResistanceRateValue/LessThanOnePercentValue';
import PercentValue from '@/domain/Antibiogram/Metadata/ResistanceRateValue/PercentValue';
import type { ResistanceRateValueBehavior } from '@/domain/Antibiogram/Metadata/ResistanceRateValue/ResistanceRateValueBehavior';
import ValueObject from '@/domain/base/ValueObject';

class ResistanceRateValue extends ValueObject {
  #value: ResistanceRateValueBehavior;

  constructor(value: string) {
    super();
    if (value == '<1%') this.#value = new LessThanOnePercentValue(value);
    else this.#value = new PercentValue(+value);
  }
  getValue() {
    return this.#value.getValue();
  }
  protected isIdentical(v: ResistanceRateValue): boolean {
    return this.#value.getValue() == v.getValue();
  }

  validateInput(value: string) {
    if (value == '<1%') return true;
    if (!stringContainsNumber(value))
      throw new SensitivityValueValidationError(value);
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
    this.message = 'Invalid resistance rate value: ' + inputValue;
  }
}
export default ResistanceRateValue;
