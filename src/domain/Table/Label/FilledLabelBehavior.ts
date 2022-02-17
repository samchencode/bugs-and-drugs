import type { LabelParams } from '@/domain/Table/Label/LabelParams';
import type Tooltip from '@/domain/Table/Tooltip';
import type { AlertLevel } from '@/domain/Table/AlertLevel';
import { FilledCell } from '@/domain/Table/Cell';
import BaseLabelBehavior from '@/domain/Table/Label/BaseLabelBehavior';

class FilledLabelBehavior extends BaseLabelBehavior {
  #title: string;
  #tooltip?: Tooltip;
  #alert?: AlertLevel;

  constructor(title: string, params?: Partial<LabelParams>) {
    super();
    this.#title = title;
    this.#alert = params?.alert;
    this.#tooltip = params?.tooltip;
  }

  protected makeCell() {
    return new FilledCell(this.#title, {
      tooltip: this.#tooltip,
      alert: this.#alert,
    });
  }
}

export default FilledLabelBehavior;
