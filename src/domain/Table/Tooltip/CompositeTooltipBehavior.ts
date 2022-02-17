import { AlertLevels, type AlertLevel } from '@/domain/Table/AlertLevel';
import BaseTooltipBehavior from '@/domain/Table/Tooltip/BaseTooltipBehavior';

class CompositeTooltipBehavior extends BaseTooltipBehavior {
  #children: BaseTooltipBehavior[];

  constructor(children: BaseTooltipBehavior[]) {
    super();
    this.#children = children;
  }

  toString(): string {
    return this.#children.map((t) => t.toString()).join('\n');
  }

  getChildren(): BaseTooltipBehavior[] {
    return this.#children;
  }

  getAlertLevel(): AlertLevel {
    let max = AlertLevels.NONE;
    for (const child of this.#children) {
      const level = child.getAlertLevel();
      if (level > max) {
        max = level;
      }
    }

    return max;
  }

  protected isIdentical(t: CompositeTooltipBehavior): boolean {
    for (const child of t.getChildren()) {
      const match = this.#children.find((c) => c.is(child));
      if (!match) return false;
    }
    return true;
  }
}

export default CompositeTooltipBehavior;
