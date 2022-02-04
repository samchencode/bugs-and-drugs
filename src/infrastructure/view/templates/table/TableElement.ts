import type { Cell } from '@/domain/Table';

class TableElement {
  id: number;
  #highlighted = false;
  #active = false;
  #value: string;
  #tooltip: string;

  constructor(id: number, cell: Cell) {
    this.id = id;
    this.#value = cell.getValue();
    this.#tooltip = cell.getTooltip().toString();
  }

  getHighlighted() {
    return this.#highlighted;
  }
  getActive() {
    return this.#active;
  }
  toggleActive() {
    this.#active = !this.#active;
  }
  toggleHighlighted() {
    this.#highlighted = !this.#highlighted;
  }
  getValue(): string {
    return this.#value;
  }
  getTooltip(): string {
    return this.#tooltip;
  }
}

export { TableElement };
