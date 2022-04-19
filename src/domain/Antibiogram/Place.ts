import ValueObject from '@/domain/base/ValueObject';

class Place extends ValueObject {
  #region: string;
  #institution: string;

  constructor(state: string, institution: string) {
    super();
    this.#institution = institution;
    this.#region = state;
  }

  getState() {
    return this.#region;
  }

  getInstitution() {
    return this.#institution;
  }

  toString() {
    return `${this.#institution} \u2212 ${this.#region}`;
  }

  protected isIdentical(that: Place): boolean {
    if (that.getState() !== this.getState()) return false;
    if (that.getInstitution() !== this.getInstitution()) return false;
    return true;
  }
}

class UnknownPlace extends Place {
  constructor() {
    super('Unknown', 'Unknown');
  }
}

export default Place;
export { UnknownPlace };
