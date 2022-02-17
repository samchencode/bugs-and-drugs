import type { AlertLevel } from '@/domain/Table/AlertLevel';
import Cell from '@/domain/Table/Cell';
import type Tooltip from '@/domain/Table/Tooltip';

abstract class BaseLabelBehavior extends Cell {
  #cell: Cell | null = null;

  protected abstract makeCell(): Cell;

  protected getCell() {
    if (!this.#cell) this.#cell = this.makeCell();
    return this.#cell;
  }

  toString(): string {
    return this.getCell().toString();
  }

  getValue(): string {
    return this.getCell().getValue();
  }

  getTooltip(): Tooltip {
    return this.getCell().getTooltip();
  }

  getAlertLevel(): AlertLevel {
    return this.getCell().getAlertLevel();
  }
}

export default BaseLabelBehavior;
