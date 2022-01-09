import type Label from '@/domain/Table/Label';
import type TableCell from '@/domain/Table/Facade/TableCell';

class TableColumn {
  #data: TableCell[] = [];
  #label: Label;

  constructor(label: Label) {
    this.#label = label;
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

  getLength() {
    return this.#data.length;
  }
}

export default TableColumn;
