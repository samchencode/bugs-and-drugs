import ValueObject from '@/domain/base/ValueObject';

abstract class GramValue extends ValueObject {
  protected isIdentical(): boolean {
    return true;
  }
  abstract toString(): string;
}

export default GramValue;
