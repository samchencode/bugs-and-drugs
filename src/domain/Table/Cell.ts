import ValueObject from '@/domain/base/ValueObject';

type CellValue = ValueObject | string | number;

abstract class Cell extends ValueObject {
  abstract getValue(): CellValue;
  abstract toString(): string;
  protected isIdentical(c: Cell): boolean {
    const value = c.getValue();
    const ourValue = this.getValue();
    if (typeof value === 'string' || typeof value === 'number')
      return value === ourValue;

    return value.is(ourValue as ValueObject);
  }
}

export default Cell;
