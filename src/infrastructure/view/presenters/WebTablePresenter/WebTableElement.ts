import type { Cell } from '@/domain/Table';

class WebTableElement {
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
  setActive() {
    this.#active = true;
  }
  unsetActive() {
    this.#active = false;
  }
  highlight() {
    this.#highlighted = true;
  }
  unHighlight() {
    this.#highlighted = false;
  }
  getValue(): string {
    return this.#value;
  }
  getTooltip(): string {
    return this.#tooltip;
  }
}

export default WebTableElement;
