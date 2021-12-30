import ValueObject from '@/domain/base/ValueObject';

abstract class QualityValue extends ValueObject {
  abstract toString(): string;
}

export default QualityValue;
