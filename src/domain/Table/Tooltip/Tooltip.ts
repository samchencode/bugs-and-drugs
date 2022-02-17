import BaseTooltipBehavior from '@/domain/Table/Tooltip/BaseTooltipBehavior';
import CompositeTooltipBehavior from '@/domain/Table/Tooltip/CompositeTooltipBehavior';
import SingleTooltipBehavior from '@/domain/Table/Tooltip/SingleTooltipBehavior';
import EmptyTooltipBehavior from '@/domain/Table/Tooltip/EmptyTooltipBehavior';

class Tooltip extends BaseTooltipBehavior {
  #tooltip: BaseTooltipBehavior;

  constructor(tooltips: BaseTooltipBehavior[]);
  constructor(content: string);
  constructor();
  constructor(arg?: BaseTooltipBehavior[] | string) {
    super();

    if (typeof arg === 'string') {
      this.#tooltip = new SingleTooltipBehavior(arg);
    } else if (typeof arg === 'undefined') {
      this.#tooltip = new EmptyTooltipBehavior();
    } else {
      this.#tooltip = new CompositeTooltipBehavior(arg);
    }
  }

  toString(): string {
    return this.#tooltip.toString();
  }

  protected isIdentical(t: Tooltip): boolean {
    return this.#tooltip.is(t);
  }
}

export default Tooltip;
