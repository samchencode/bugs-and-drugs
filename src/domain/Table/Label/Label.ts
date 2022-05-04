import type { AlertLevel } from '@/domain/Table/AlertLevel';
import type Tooltip from '@/domain/Table/Tooltip';
import type { LabelParams } from '@/domain/Table/Label/LabelParams';
import type BaseLabelBehavior from '@/domain/Table/Label/BaseLabelBehavior';
import FilledLabelBehavior from '@/domain/Table/Label/FilledLabelBehavior';
import EmptyLabelBehavior from '@/domain/Table/Label/EmptyLabelBehavior';
import Cell from '@/domain/Table/Cell';

class Label extends Cell {
  #label: BaseLabelBehavior;

  constructor();
  constructor(title: string, params?: Partial<LabelParams>);
  constructor(title?: string, params?: Partial<LabelParams>) {
    super();

    if (title) {
      this.#label = new FilledLabelBehavior(title, params);
    } else this.#label = new EmptyLabelBehavior();
  }
  toString(): string {
    return this.#label.toString();
  }

  getValue(): string {
    return this.#label.getValue();
  }

  getTooltip(): Tooltip {
    return this.#label.getTooltip();
  }

  getAlertLevel(): AlertLevel {
    return this.#label.getAlertLevel();
  }

  isBold(): boolean {
    return this.#label.isBold();
  }
}

export default Label;
