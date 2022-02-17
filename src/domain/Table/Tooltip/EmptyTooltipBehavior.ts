import { AlertLevels, type AlertLevel } from '@/domain/Table/AlertLevel';
import BaseTooltipBehavior from '@/domain/Table/Tooltip/BaseTooltipBehavior';

class EmptyTooltipBehavior extends BaseTooltipBehavior {
  toString(): string {
    return '';
  }

  getAlertLevel(): AlertLevel {
    return AlertLevels.NONE;
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default EmptyTooltipBehavior;
