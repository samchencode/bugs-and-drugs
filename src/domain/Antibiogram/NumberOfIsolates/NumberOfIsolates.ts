import type ValueObject from '@/domain/base/ValueObject';

interface NumberOfIsolates extends ValueObject {
  getValue(): number;
  toString(): string;
  isUnknown(): boolean;
}

export type { NumberOfIsolates };
