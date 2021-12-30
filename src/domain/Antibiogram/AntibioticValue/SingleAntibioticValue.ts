import ValueObject from '@/domain/base/ValueObject';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue/AntibioticValue';

class SingleAntibioticValue extends ValueObject implements AntibioticValue {
  #name: string;

  constructor(name: string) {
    super();
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  isIdentical(organismValue: SingleAntibioticValue) {
    return this.#name === organismValue.getName();
  }
}

export default SingleAntibioticValue;
