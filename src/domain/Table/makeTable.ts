import validate from '@/domain/Table/Validator';
import rules from '@/domain/Table/rules';
import type { TableParams } from '@/domain/Table/TableParams';
import type Cell from '@/domain/Table/Cell';
import Table from '@/domain/Table/Table';

function makeTable<T extends Cell>(
  data: T[][],
  params?: Partial<TableParams>
): Table<T> {
  validate(rules(data, params));
  return new Table(data, params);
}

export default makeTable;
