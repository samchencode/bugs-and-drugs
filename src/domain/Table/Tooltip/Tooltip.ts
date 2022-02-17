import type BaseTooltipBehavior from '@/domain/Table/Tooltip/BaseTooltipBehavior';
import CompositeTooltipBehavior from '@/domain/Table/Tooltip/CompositeTooltipBehavior';
import SingleTooltipBehavior from '@/domain/Table/Tooltip/SingleTooltipBehavior';
import EmptyTooltipBehavior from '@/domain/Table/Tooltip/EmptyTooltipBehavior';
import ValueObject from '@/domain/base/ValueObject';
import { AlertLevel, AlertLevels } from '@/domain/Table/AlertLevel';

class Tooltip extends ValueObject {
  #tooltip: BaseTooltipBehavior;

  constructor();
  constructor(tooltips: BaseTooltipBehavior[]);
  constructor(content: string, level?: AlertLevel);
  constructor(arg?: BaseTooltipBehavior[] | string, level?: AlertLevel) {
    super();

    if (typeof arg === 'string') {
      this.#tooltip = new SingleTooltipBehavior(arg, level ?? AlertLevels.NONE);
    } else if (typeof arg === 'undefined') {
      this.#tooltip = new EmptyTooltipBehavior();
    } else {
      this.#tooltip = new CompositeTooltipBehavior(arg);
    }
  }

  toString(): string {
    return this.#tooltip.toString();
  }

  getAlertLevel() {
    return this.#tooltip.getAlertLevel();
  }

  protected isIdentical(t: Tooltip): boolean {
    return this.#tooltip.is(t);
  }
}

export default Tooltip;
