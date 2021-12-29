import {
  NoInconsistentRowColumnLabelNumber,
  NoInconsistentRowColumnNumber,
  NoUndefinedValue,
} from './Validator';
import type { Cell } from './Cell';
import type { LabelParams } from './Table';

export default (data: Cell<unknown>[][], labels?: LabelParams) => [
  new NoUndefinedValue(data),
  new NoInconsistentRowColumnNumber(data),
  new NoInconsistentRowColumnLabelNumber(data, labels),
];
