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

  protected isIdentical(t: CompositeTooltipBehavior): boolean {
    for (const child of t.getChildren()) {
      const match = this.#children.find((c) => c.is(child));
      if (!match) return false;
    }
    return true;
  }
}

export default CompositeTooltipBehavior;
