import Cell from '@/domain/Table/Cell/Cell';
import Tooltip from '@/domain/Table/Tooltip';
import type { CellParams } from '@/domain/Table/Cell/CellParams';

class FilledCell extends Cell {
  #value: string;
  #tooltip: Tooltip;

  constructor(value: string, params?: Partial<CellParams>) {
    super();
    this.#value = value;
    this.#tooltip = params?.tooltip ?? new Tooltip();
  }

  getValue(): string {
    return this.#value;
  }

  getTooltip(): Tooltip {
    return this.#tooltip;
  }
}

export default FilledCell;
