import Cell from '@/domain/Table/Cell';

class Label extends Cell {
  #title: string;
  constructor(title: string) {
    super();
    this.#title = title;
  }

  toString(): string {
    return this.#title;
  }

  getValue(): string {
    return this.#title;
  }

  protected isIdentical(l: Label): boolean {
    return this.#title === l.toString();
  }
}

class EmptyLabel extends Label {
  constructor() {
    super('');
  }
}

export default Label;
export { EmptyLabel };
