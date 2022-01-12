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

  getAntibiotics() {
    return this.#antibiotics;
  }

  getName(): string {
    const names = this.#antibiotics.map((abx) => abx.getName());
    return names.join(' + ');
  }

  isSameAntibiotic(v: AntibioticValue): boolean {
    if (!(v instanceof SynergisticAntibioticValue)) return false;
    return this.#compare((a1, a2) => a1.isSameAntibiotic(a2), v);
  }

  protected isIdentical(v: SynergisticAntibioticValue): boolean {
    return this.#compare((a1, a2) => a1.is(a2), v);
  }

  #compare(
    comparator: (
      abx1: SingleAntibioticValue,
      abx2: SingleAntibioticValue
    ) => boolean,
    value: SynergisticAntibioticValue
  ) {
    if (value.getAntibiotics().length !== this.#antibiotics.length)
      return false;
    for (const antibiotic of this.#antibiotics) {
      const match = value
        .getAntibiotics()
        .find((abx) => comparator(abx, antibiotic));
      if (!match) return false;
    }
    return true;
  }
}

export default SynergisticAntibioticValue;
