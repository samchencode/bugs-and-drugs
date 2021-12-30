import type { Cell } from '@/domain/Table/Cell';
import type { Rule } from '@/domain/Table/Validator/Rule';

class NoInconsistentRowColumnNumber implements Rule {
  input: Cell<unknown>[][];

  constructor(input: Cell<unknown>[][]) {
    this.input = input;
  }

  check(): void {
    const { input } = this;
    const rowNumber = input.length;
    if (rowNumber === 0) return;

    const columnNumber = input[0].length;
    input.find((r, i) => {
      if (r.length !== columnNumber)
        throw new InconsistentRowColumnNumberError(i);
    });
  }
}

class InconsistentRowColumnNumberError extends Error {
  constructor(rowNumber: number) {
    super();
    this.message = 'Inconsistent number of columns or rows at row ' + rowNumber;
  }
}

export default NoInconsistentRowColumnNumber;
