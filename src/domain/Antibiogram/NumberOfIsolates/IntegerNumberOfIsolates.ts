import ValueObject from '@/domain/base/ValueObject';
import type { NumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates/NumberOfIsolates';

class IntegerNumberOfIsolates extends ValueObject implements NumberOfIsolates {
  #value: number;

  constructor(value: number) {
    super();
    validateNumberOfIsolates(value);
    this.#value = value;
  }

  getValue(): number {
    return this.#value;
  }

  isEnough(): boolean {
    return this.#value >= 30;
  }

  toString(): string {
    return '' + this.#value;
  }

  isUnknown(): boolean {
    return false;
  }

  protected isIdentical(v: NumberOfIsolates): boolean {
    return this.#value === v.getValue();
  }
}

function validateNumberOfIsolates(value: number) {
  const hasDecimal = Math.round(value) !== value;
  if (hasDecimal) throw new DecimalNumberOfIsolatesError(value);
  const isNegative = value < 0;
  if (isNegative) throw new NegativeNumberOfIsolatesError(value);
}

class DecimalNumberOfIsolatesError extends Error {
  constructor(value: number) {
    super();
    this.message = 'Non-integer number of isolates: ' + value;
  }
}

class NegativeNumberOfIsolatesError extends Error {
  constructor(value: number) {
    super();
    this.message = 'Negative number of isolates: ' + value;
  }
}

export default IntegerNumberOfIsolates;
