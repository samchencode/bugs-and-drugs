import ValueObject from '@/domain/base/ValueObject';
import type { AlertLevel } from '@/domain/Table/AlertLevel';

abstract class BaseTooltipBehavior extends ValueObject {
  abstract toString(): string;
  abstract getAlertLevel(): AlertLevel;
}

export default BaseTooltipBehavior;
