import Cell from '@/domain/Table/Cell';
import type Tooltip from '@/domain/Table/Tooltip';
import type TableRow from '@/domain/Table/Facade/TableRow';
import type TableColumn from '@/domain/Table/Facade/TableColumn';
import type TableGroup from '@/domain/Table/Facade/TableGroup';

interface AccessorParams {
  row: TableRow;
  column: TableColumn;
  rowGroup: TableGroup | null;
}

class TableCell extends Cell {
  #cell: Cell;
  #row: TableRow;
  #column: TableColumn;
  #rowGroup: TableGroup | null;

  constructor(cell: Cell, params: AccessorParams) {
    super();
    const { row, column, rowGroup } = params;
    this.#cell = cell;
    this.#row = row;
    this.#column = column;
    this.#rowGroup = rowGroup;
  }

  getRow(): TableRow {
    return this.#row;
  }

  getColumn(): TableColumn {
    return this.#column;
  }

  getGroup(): TableGroup | null {
    return this.#rowGroup;
  }

  getValue(): string {
    return this.#cell.getValue();
  }

  getTooltip(): Tooltip {
    return this.#cell.getTooltip();
  }

  toString(): string {
    return this.#cell.toString();
  }
}

export default TableCell;
