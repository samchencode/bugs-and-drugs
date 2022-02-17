import BaseTooltipBehavior from '@/domain/Table/Tooltip/BaseTooltipBehavior';

class EmptyTooltipBehavior extends BaseTooltipBehavior {
  toString(): string {
    return '';
  }
  protected isIdentical(): boolean {
    return true;
  }
}

export default EmptyTooltipBehavior;
