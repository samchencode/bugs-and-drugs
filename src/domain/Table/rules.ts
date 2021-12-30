import {
  NoInconsistentRowColumnLabelNumber,
  NoInconsistentRowColumnNumber,
  NoUndefinedValue,
} from '@/domain/Table/Validator';
import type { Cell } from '@/domain/Table/Cell';
import type { LabelParams } from '@/domain/Table/Table';

export default (data: Cell<unknown>[][], labels?: LabelParams) => [
  new NoUndefinedValue(data),
  new NoInconsistentRowColumnNumber(data),
  new NoInconsistentRowColumnLabelNumber(data, labels),
];
