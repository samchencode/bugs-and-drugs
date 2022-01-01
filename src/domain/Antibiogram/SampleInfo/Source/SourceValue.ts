import ValueObject from '@/domain/base/ValueObject';

abstract class SourceValue extends ValueObject {
  abstract toString(): string;
}

export default SourceValue;
