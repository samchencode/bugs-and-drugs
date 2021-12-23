import type { Cell } from './Cell';
import NoInconsistentRowColumnNumber from './NoInconsistentRowColumnNumber';
import NoUndefinedValue from './NoUndefinedValue';
import TableInputValidator from './TableInputValidator';
import Table from './Table';

function makeTable<T>(data: Cell<T>[][]) {
  const validator = new TableInputValidator([
    new NoUndefinedValue(),
    new NoInconsistentRowColumnNumber(),
  ]);

  validator.validate(data);

  return new Table(data);
}

export default makeTable;
