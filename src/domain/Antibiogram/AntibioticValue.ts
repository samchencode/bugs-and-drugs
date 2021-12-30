import ValueObject from '@/domain/base/ValueObject';
import type Antibiotic from '@/domain/Antibiotic';

class AntibioticValue extends ValueObject {
  #name: string;
  #antibiotic?: Antibiotic;

  constructor(name: string, antibiotic?: Antibiotic) {
    super();
    this.#name = name;
    this.#antibiotic = antibiotic;
  }

  getName() {
    return this.#name;
  }

  getAntibiotic() {
    return this.#antibiotic;
  }

  isIdentical(organismValue: AntibioticValue) {
    return this.#name === organismValue.getName();
  }
}

export default AntibioticValue;
