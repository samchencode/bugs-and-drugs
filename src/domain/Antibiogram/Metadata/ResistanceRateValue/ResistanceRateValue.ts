import LessThanOnePercentValue from '@/domain/Antibiogram/Metadata/ResistanceRateValue/LessThanOnePercentValue';
import PercentValue from '@/domain/Antibiogram/Metadata/ResistanceRateValue/PercentValue';
import type { ResistanceRateValueBehavior } from '@/domain/Antibiogram/Metadata/ResistanceRateValue/ResistanceRateValueBehavior';
import ValueObject from '@/domain/base/ValueObject';

class ResistanceRateValue extends ValueObject {
  #value: ResistanceRateValueBehavior;

  constructor(value: string) {
    super();
    this.validateInput(value);

    this.#value =
      value === '<1%'
        ? new LessThanOnePercentValue()
        : new PercentValue(percentToInteger(value));
  }

  toString() {
    return this.#value.toString();
  }

  protected isIdentical(v: ResistanceRateValue): boolean {
    return this.#value.toString() === v.toString();
  }

  validateInput(value: string) {
    if (value === '<1%') return;
    if (!stringContainsNumber(value))
      throw new SensitivityValueValidationError(value);
  }
}

function stringContainsNumber(input: string) {
  if (input.trim().length === 0) return false;
  const coercedToNaN = Number.isNaN(percentToInteger(input));
  if (coercedToNaN) return false;
  return true;
}

function percentToInteger(percent: string) {
  const last = percent.split('').pop();
  return last === '%' ? +percent.slice(0, -1) : +percent;
}

class SensitivityValueValidationError extends Error {
  constructor(inputValue: string) {
    super();
    this.message = 'Invalid resistance rate value: ' + inputValue;
  }
}

export default ResistanceRateValue;
