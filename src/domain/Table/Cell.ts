import ValueObject from '@/domain/base/ValueObject';

abstract class Cell extends ValueObject {
  abstract getValue(): string;
  toString(): string {
    return this.getValue();
  }
  protected isIdentical(c: Cell): boolean {
    return this.getValue() === c.getValue();
  }
}

export default Cell;
