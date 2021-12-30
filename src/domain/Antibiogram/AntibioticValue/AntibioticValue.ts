import type ValueObject from '@/domain/base/ValueObject';

interface AntibioticValue extends ValueObject {
  getName(): string;
}

export type { AntibioticValue };
