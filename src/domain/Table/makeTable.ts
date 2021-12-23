import type { Cell } from './Cell';
import NoInconsistentRowColumnNumber from './NoInconsistentRowColumnNumber';
import NoInconsistentRowColumnLabelNumber from './NoInconsistentRowColumnLabelNumber';
import NoUndefinedValue from './NoUndefinedValue';
import TableInputValidator from './TableInputValidator';
import Table, { LabelParams } from './Table';

function makeTable<T>(data: Cell<T>[][], labels?: LabelParams) {
  const validator = new TableInputValidator([
    new NoUndefinedValue(data),
    new NoInconsistentRowColumnNumber(data),
    new NoInconsistentRowColumnLabelNumber(data, labels),
  ]);

  validator.validate();

  return new Table(data, labels);
}

export default makeTable;
