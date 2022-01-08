import {
  NoInconsistentRowColumnLabelNumber,
  NoInconsistentRowColumnNumber,
  NoUndefinedValue,
  NoIntersectingGroupRanges,
  NoZeroOrOneRowGroups,
  NoInvalidRowRanges,
} from '@/domain/Table/Validator';
import type Cell from '@/domain/Table/Cell';
import type { TableParams } from '@/domain/Table/Table';

export default (data: Cell[][], params?: Partial<TableParams>) => [
  new NoUndefinedValue(data),
  new NoInconsistentRowColumnNumber(data),
  new NoInconsistentRowColumnLabelNumber(data, params?.labels),
  new NoIntersectingGroupRanges(data, params?.groups),
  new NoZeroOrOneRowGroups(params?.groups),
  new NoInvalidRowRanges(params?.groups),
];
