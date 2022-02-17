import ValueObject from '@/domain/base/ValueObject';

class Tooltip extends ValueObject {
  #content: string;

  constructor(content: string) {
    super();
    this.#content = content;
  }

  toString(): string {
    return this.#content;
  }

  getContent(): string {
    return this.#content;
  }

  protected isIdentical(t: Tooltip): boolean {
    return this.#content === t.getContent();
  }
}

export default Tooltip;
