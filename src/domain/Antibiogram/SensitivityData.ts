import ValueObject from '@/domain/base/ValueObject';
import type OrganismValue from '@/domain/Antibiogram/OrganismValue';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue';
import type SensitivityValue from '@/domain/Antibiogram/SensitivityValue';
import type { NumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates';
import { UnknownNumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates';

interface SensitivityDataParams {
  organism: OrganismValue;
  antibiotic: AntibioticValue;
  value: SensitivityValue;
  isolates?: NumberOfIsolates;
}

class SensitivityData extends ValueObject {
  #organism: OrganismValue;
  #antibiotic: AntibioticValue;
  #value: SensitivityValue;
  #isolates: NumberOfIsolates;

  constructor({
    organism,
    antibiotic,
    value,
    isolates,
  }: SensitivityDataParams) {
    super();
    this.#organism = organism;
    this.#antibiotic = antibiotic;
    this.#value = value;
    this.#isolates = isolates ?? new UnknownNumberOfIsolates();
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

  getIsolates(): NumberOfIsolates {
    return this.#isolates;
  }

  protected isIdentical(v: SensitivityData): boolean {
    if (this.#antibiotic !== v.getAntibiotic()) return false;
    if (this.#organism !== v.getOrganism()) return false;
    if (this.#value !== v.getValue()) return false;
    return true;
  }
}

export default SensitivityData;
