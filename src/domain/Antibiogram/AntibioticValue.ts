import ValueObject from '@/domain/ValueObject';
import type Antibiotic from '@/domain/Antibiotic';

class OrganismValue extends ValueObject {
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

  isIdentical(organismValue: OrganismValue) {
    return this.#name === organismValue.getName();
  }
}

export default OrganismValue;
