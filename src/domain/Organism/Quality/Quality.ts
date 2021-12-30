import ValueObject from '@/domain/base/ValueObject';
import type QualityValue from '@/domain/Organism/Quality/QualityValue';

abstract class Quality extends ValueObject {
  #name: string;
  #value: QualityValue;

  constructor(name: string, value: QualityValue) {
    super();
    this.#name = name;
    this.#value = value;
  }

  getName() {
    return this.#name;
  }

  getValue() {
    return this.#value;
  }

  abstract toString(): string;

  protected isIdentical(v: Quality): boolean {
    return this.#value.is(v.getValue());
  }
}

export default Quality;
