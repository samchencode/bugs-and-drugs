import ValueObject from '@/domain/base/ValueObject';
import type { NumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates/NumberOfIsolates';

class UnknownNumberOfIsolates extends ValueObject implements NumberOfIsolates {
  isUnknown(): boolean {
    return true;
  }

  getValue(): number {
    return NaN;
  }

  toString(): string {
    return 'unknown';
  }

  protected isIdentical(): boolean {
    return false;
  }
}

export default UnknownNumberOfIsolates;
