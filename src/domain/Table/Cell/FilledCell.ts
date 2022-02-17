import Cell from '@/domain/Table/Cell/Cell';
import Tooltip from '@/domain/Table/Tooltip';
import type { CellParams } from '@/domain/Table/Cell/CellParams';
import { AlertLevels, type AlertLevel } from '@/domain/Table/AlertLevel';

class FilledCell extends Cell {
  #value: string;
  #tooltip: Tooltip;
  #alert: AlertLevel;

  constructor(value: string, params?: Partial<CellParams>) {
    super();
    this.#value = value;
    this.#tooltip = params?.tooltip ?? new Tooltip();
    this.#alert = params?.alert ?? AlertLevels.NONE;
  }

  getValue(): string {
    return this.#value;
  }

  getTooltip(): Tooltip {
    return this.#tooltip;
  }

  getAlertLevel(): AlertLevel {
    return this.#alert;
  }
}

export default FilledCell;
