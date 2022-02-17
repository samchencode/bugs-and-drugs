import ValueObject from '@/domain/base/ValueObject';

abstract class AlertLevel extends ValueObject {
  abstract readonly level: string;
  abstract valueOf(): number;

  protected isIdentical(level: AlertLevel): boolean {
    return this.valueOf() === level.valueOf();
  }
}

export default AlertLevel;
