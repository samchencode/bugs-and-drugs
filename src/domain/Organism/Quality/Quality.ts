import ValueObject from '@/domain/base/ValueObject';
import type QualityValue from '@/domain/Organism/Quality/QualityValue';

abstract class Quality extends ValueObject {
  #value: QualityValue;

  constructor(value: QualityValue) {
    super();
    this.#value = value;
  }

  getName() {
    return this.type;
  }

  getValue() {
    return this.#value;
  }

  abstract readonly type: string;
  abstract toString(): string;

  protected isIdentical(v: Quality): boolean {
    return this.#value.is(v.getValue());
  }
}

export default Quality;
