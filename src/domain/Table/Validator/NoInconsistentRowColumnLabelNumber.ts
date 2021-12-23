import { Cell } from '../Cell';
import type { Rule } from "./Rule";
import type { LabelParams } from '../Table';

class NoInconsistentRowColumnLabelNumber implements Rule {
  input: Cell<unknown>[][];
  labels?: LabelParams;

  constructor(input: Cell<unknown>[][], labels?: LabelParams) {
    this.input = input;
    this.labels = labels;
  }

  check(): void {
    if (typeof this.labels === 'undefined') return;

    const numRows = this.input.length;
    const numColumns = this.input[0]?.length;
    const unequalRows = numRows !== this.labels.rows.length;
    const unequalColumns = numColumns !== this.labels.columns.length;

    if (unequalRows) throw new InconsistentRowLabelsError();
    if (unequalColumns) throw new InconsistentColumnLabelsError();
  }
}

class InconsistentRowLabelsError extends Error {
  constructor() {
    super();
    this.message = 'Row labels do not match number of rows in data';
  }
}

class InconsistentColumnLabelsError extends Error {
  constructor() {
    super();
    this.message = 'Column labels do not match number of columns in data';
  }
}

export default NoInconsistentRowColumnLabelNumber;
