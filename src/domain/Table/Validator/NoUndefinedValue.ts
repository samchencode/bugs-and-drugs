import { Cell } from '../Cell';
import type { Rule } from "./Rule";

class NoUndefinedValues implements Rule {

  input: Cell<unknown>[][];

  constructor(input: Cell<unknown>[][]) {
    this.input = input;
  }

  check(): void {
    const { input } = this;
    input.forEach((r, i) => {
      if (this.#isUndefined(r)) throw new UndefinedValueError(i);

      r.forEach((c, j) => {
        if (this.#isUndefined(c)) throw new UndefinedValueError(i, j);
      });

      const hasEmpty = r.includes(undefined as any);
      if (hasEmpty) throw new UndefinedValueError(i);
    });
  }

  #isUndefined(value: any) {
    return typeof value === 'undefined';
  }
}

class UndefinedValueError extends Error {
  constructor(row: number, column?: number) {
    super();
    this.message = 'Undefined value at ' + row;
    this.message += column ? ', ' + column : '';
  }
}

export default NoUndefinedValues;
