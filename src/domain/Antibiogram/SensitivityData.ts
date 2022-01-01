import ValueObject from '@/domain/base/ValueObject';
import type OrganismValue from '@/domain/Antibiogram/OrganismValue';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue';
import type SensitivityValue from '@/domain/Antibiogram/SensitivityValue';
import type { NumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates';
import { UnknownNumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates';
import SampleInfo from '@/domain/Antibiogram/SampleInfo';

interface SensitivityDataParams {
  organism: OrganismValue;
  antibiotic: AntibioticValue;
  value: SensitivityValue;
  isolates?: NumberOfIsolates;
  sampleInfo?: SampleInfo;
}

class SensitivityData extends ValueObject {
  #organism: OrganismValue;
  #antibiotic: AntibioticValue;
  #value: SensitivityValue;
  #isolates: NumberOfIsolates;
  #sampleInfo: SampleInfo;

  constructor(p: SensitivityDataParams) {
    super();
    this.#organism = p.organism;
    this.#antibiotic = p.antibiotic;
    this.#value = p.value;
    this.#isolates = p.isolates ?? new UnknownNumberOfIsolates();
    this.#sampleInfo = p.sampleInfo ?? new SampleInfo([]);
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

  getSampleInfo(): SampleInfo {
    return this.#sampleInfo;
  }

  protected isIdentical(v: SensitivityData): boolean {
    if (this.#antibiotic !== v.getAntibiotic()) return false;
    if (this.#organism !== v.getOrganism()) return false;
    if (this.#value !== v.getValue()) return false;
    return true;
  }
}

export default SensitivityData;
