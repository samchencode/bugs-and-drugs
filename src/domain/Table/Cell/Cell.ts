import ValueObject from '@/domain/base/ValueObject';
import type { AlertLevel } from '@/domain/Table/AlertLevel';
import type Tooltip from '@/domain/Table/Tooltip';

abstract class Cell extends ValueObject {
  abstract getValue(): string;
  abstract getTooltip(): Tooltip;
  abstract getAlertLevel(): AlertLevel;
  toString(): string {
    return this.getValue();
  }
  protected isIdentical(c: Cell): boolean {
    if (this.getValue() !== c.getValue()) return false;
    if (!this.getTooltip().is(c.getTooltip())) return false;
    return true;
  }
}

export default Cell;
