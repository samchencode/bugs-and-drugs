import type { AlertLevel } from '@/domain/Table/AlertLevel';
import BaseTooltipBehavior from '@/domain/Table/Tooltip/BaseTooltipBehavior';

class SingleTooltipBehavior extends BaseTooltipBehavior {
  #content: string;
  #level: AlertLevel;

  constructor(content: string, level: AlertLevel) {
    super();
    this.#content = content;
    this.#level = level;
  }

  toString(): string {
    return this.#content;
  }

  getAlertLevel(): AlertLevel {
    return this.#level;
  }

  protected isIdentical(t: BaseTooltipBehavior): boolean {
    return this.#content === t.toString();
  }
}

export default SingleTooltipBehavior;
