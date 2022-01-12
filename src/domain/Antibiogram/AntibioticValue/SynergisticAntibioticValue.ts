import ValueObject from '@/domain/base/ValueObject';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue/AntibioticValue';
import type SingleAntibioticValue from '@/domain/Antibiogram/AntibioticValue/SingleAntibioticValue';

class SynergisticAntibioticValue
  extends ValueObject
  implements AntibioticValue
{
  #antibiotics: SingleAntibioticValue[];

  constructor(antibiotics: SingleAntibioticValue[]) {
    super();
    this.#antibiotics = antibiotics;
  }

  protected isIdentical(v: SynergisticAntibioticValue): boolean {
    if (v.getAntibiotics().length !== this.#antibiotics.length) return false;
    for (const antibiotic of this.#antibiotics) {
      const match = v.getAntibiotics().find((abx) => abx.is(antibiotic));
      if (!match) return false;
    }
    return true;
  }

  getAntibiotics() {
    return this.#antibiotics;
  }

  getName(): string {
    const names = this.#antibiotics.map((abx) => abx.getName());
    return names.join(' + ');
  }
}

export default SynergisticAntibioticValue;
