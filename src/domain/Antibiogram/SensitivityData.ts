import ValueObject from '@/domain/base/ValueObject';
import type OrganismValue from '@/domain/Antibiogram/OrganismValue';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue';
import type SensitivityValue from '@/domain/Antibiogram/SensitivityValue';

interface SensitivityDataParams {
  organism: OrganismValue;
  antibiotic: AntibioticValue;
  value: SensitivityValue;
}

class SensitivityData extends ValueObject {
  #organism: OrganismValue;
  #antibiotic: AntibioticValue;
  #value: SensitivityValue;

  constructor({ organism, antibiotic, value }: SensitivityDataParams) {
    super();
    this.#organism = organism;
    this.#antibiotic = antibiotic;
    this.#value = value;
  }

  getOrganism(): OrganismValue {
    return this.#organism;
  }

  getAntibiotic(): AntibioticValue {
    return this.#antibiotic;
  }

  getValue(): SensitivityValue {
    return this.#value;
  }

  protected isIdentical(v: SensitivityData): boolean {
    if (this.#antibiotic !== v.getAntibiotic()) return false;
    if (this.#organism !== v.getOrganism()) return false;
    if (this.#value !== v.getValue()) return false;
    return true;
  }
}

export default SensitivityData;
