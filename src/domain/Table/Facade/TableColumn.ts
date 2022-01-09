import type Label from '@/domain/Table/Label';
import type TableCell from '@/domain/Table/Facade/TableCell';

class TableColumn {
  #data: TableCell[] = [];
  #label: Label;

  constructor(label: Label) {
    this.#label = label;
  }

  setData(data: TableCell[]) {
    this.#data = data;
  }

  getData(): TableCell[] {
    throw Error();
  }

  getLabel(): Label {
    return this.#label;
  }

  getLength() {
    return this.#data.length;
  }
}

export default TableColumn;
