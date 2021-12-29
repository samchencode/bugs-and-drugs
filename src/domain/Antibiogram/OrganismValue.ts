import ValueObject from '@/domain/base/ValueObject';
import type Organism from '@/domain/Organism';

class OrganismValue extends ValueObject {
  #name: string;
  #organism?: Organism;

  constructor(name: string, organism?: Organism) {
    super();
    this.#name = name;
    this.#organism = organism;
  }

  getName() {
    return this.#name;
  }

  getOrganism() {
    return this.#organism;
  }

  protected isIdentical(organismValue: OrganismValue) {
    return this.#name === organismValue.getName();
  }
}

export default OrganismValue;
