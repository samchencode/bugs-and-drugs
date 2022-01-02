import ValueObject from '@/domain/base/ValueObject';

type CellValue = ValueObject | string | number;

abstract class Cell extends ValueObject {
  abstract getValue(): CellValue;
  abstract toString(): string;
}

export default Cell;
