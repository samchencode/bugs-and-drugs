import type { Cell } from '@/domain/Table/Cell';
import type { Rule } from '@/domain/Table/Validator/Rule';

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

      const hasEmpty = r.includes(undefined as never);
      if (hasEmpty) throw new UndefinedValueError(i);
    });
  }

  #isUndefined(value: Cell<unknown> | Cell<unknown>[] | undefined) {
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
