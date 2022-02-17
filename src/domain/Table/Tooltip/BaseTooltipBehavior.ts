import ValueObject from '@/domain/base/ValueObject';

abstract class BaseTooltipBehavior extends ValueObject {
  abstract toString(): string;
}

export default BaseTooltipBehavior;
