import validate from '@/domain/Table/Validator';
import rules from '@/domain/Table/rules';
import type { TableParams } from '@/domain/Table/TableParams';
import type Cell from '@/domain/Table/Cell';
import BaseTable from '@/domain/Table/BaseTable';
import type { Table } from '@/domain/Table/Table';
import { RowCollapsible } from '@/domain/Table/TableDecorator';

function makeTable<T extends Cell>(
  data: T[][],
  params?: Partial<TableParams>
): Table<T> {
  validate(rules(data, params));
  let table: Table<T> = new BaseTable(data, params);
  table = new RowCollapsible(table);
  return table;
}

export default makeTable;
