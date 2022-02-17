import type { AlertLevel } from '@/domain/Table/AlertLevel';
import type Tooltip from '@/domain/Table/Tooltip';
import type { LabelParams } from '@/domain/Table/Label/LabelParams';
import type BaseLabelBehavior from '@/domain/Table/Label/BaseLabelBehavior';
import FilledLabelBehavior from '@/domain/Table/Label/FilledLabelBehavior';
import EmptyLabelBehavior from '@/domain/Table/Label/EmptyLabelBehavior';

class Label {
  #label: BaseLabelBehavior;

  constructor();
  constructor(title: string, params?: Partial<LabelParams>);
  constructor(title?: string, params?: Partial<LabelParams>) {
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
}

export default Label;
