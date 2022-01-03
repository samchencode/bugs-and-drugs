import Cell from '@/domain/Table/Cell';
import { EmptyTooltip } from '@/domain/Table/Tooltip';
import type Tooltip from '@/domain/Table/Tooltip';

interface LabelParams {
  tooltip: Tooltip;
}

class Label extends Cell {
  #title: string;
  #tooltip: Tooltip;

  constructor(title: string, params?: LabelParams) {
    super();
    this.#title = title;
    this.#tooltip = params?.tooltip ?? new EmptyTooltip();
  }

  toString(): string {
    return this.#title;
  }

  getValue(): string {
    return this.#title;
  }

  getTooltip(): Tooltip {
    return this.#tooltip;
  }

  protected isIdentical(l: Label): boolean {
    return this.#title === l.toString();
  }
}

class EmptyLabel extends Label {
  constructor() {
    super('');
  }
}

export default Label;
export { EmptyLabel };
