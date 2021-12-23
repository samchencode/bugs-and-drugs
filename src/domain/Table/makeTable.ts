import type { Cell } from './Cell';
import Validator, {
  NoUndefinedValue,
  NoInconsistentRowColumnLabelNumber,
  NoInconsistentRowColumnNumber,
} from './Validator';
import Table, { LabelParams } from './Table';

function makeTable<T>(data: Cell<T>[][], labels?: LabelParams) {
  const validator = new Validator([
    new NoUndefinedValue(data),
    new NoInconsistentRowColumnNumber(data),
    new NoInconsistentRowColumnLabelNumber(data, labels),
  ]);

  validator.validate();

  return new Table(data, labels);
}

export default makeTable;
