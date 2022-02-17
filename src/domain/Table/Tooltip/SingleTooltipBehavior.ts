import BaseTooltipBehavior from '@/domain/Table/Tooltip/BaseTooltipBehavior';

class SingleTooltipBehavior extends BaseTooltipBehavior {
  #content: string;

  constructor(content: string) {
    super();
    this.#content = content;
  }

  toString(): string {
    return this.#content;
  }

  protected isIdentical(t: BaseTooltipBehavior): boolean {
    return this.#content === t.toString();
  }
}

export default SingleTooltipBehavior;
