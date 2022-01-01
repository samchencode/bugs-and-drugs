import SampleInfoItem from '@/domain/Antibiogram/SampleInfo/SampleInfoItem';
import type SourceValue from '@/domain/Antibiogram/SampleInfo/Source/SourceValue';

class Source extends SampleInfoItem {
  type = 'Infectious Source';
  #value: SourceValue;
  constructor(value: SourceValue) {
    super();
    this.#value = value;
  }

  getValue() {
    return this.#value;
  }

  toString(): string {
    return this.#value.toString();
  }

  protected isIdentical(v: Source): boolean {
    return this.#value.is(v.getValue());
  }
}

export default Source;
