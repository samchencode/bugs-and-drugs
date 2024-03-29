import type Label from '@/domain/Table/Label';
import type TableCell from '@/domain/Table/Facade/TableCell';
import type TableGroup from '@/domain/Table/Facade/TableGroup';

class TableRow {
  #data: TableCell[] = [];
  #group: TableGroup | null;
  #label: Label;

  constructor(label: Label, group?: TableGroup) {
    this.#label = label;
    this.#group = group ?? null;
  }

  setCells(data: TableCell[]) {
    this.#data = data;
  }

  getCells(): TableCell[] {
    return this.#data;
  }

  getLabel(): Label {
    return this.#label;
  }

  getLength(): number {
    return this.#data.length;
  }

  getGroup(): TableGroup | null {
    return this.#group;
  }
}

export default TableRow;
