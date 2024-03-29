import type ValueObject from '@/domain/base/ValueObject';
import type SingleAntibioticValue from '@/domain/Antibiogram/AntibioticValue/SingleAntibioticValue';

interface AntibioticValue extends ValueObject {
  getName(): string;
  getAntibiotics(): SingleAntibioticValue[];
  isSameAntibiotic(v: AntibioticValue): boolean;
}

export type { AntibioticValue };
