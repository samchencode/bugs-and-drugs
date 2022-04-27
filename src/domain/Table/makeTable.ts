import validate from '@/domain/Table/Validator';
import rules from '@/domain/Table/rules';
import type { TableParams } from '@/domain/Table/TableParams';
import type Cell from '@/domain/Table/Cell';
import BaseTable from '@/domain/Table/BaseTable';
import type { Table as TableInterface } from '@/domain/Table/Table';
import { RowCollapsible, Ordered } from '@/domain/Table/TableDecorator';
import Table from '@/domain/Table/Facade';

function makeTable<T extends Cell>(
  data: T[][],
  params?: Partial<TableParams>
): Table {
  validate(rules(data, params));
  let table: TableInterface<T> = new BaseTable(data, params);
  table = new RowCollapsible(table);
  if (params?.order) table = new Ordered(table, params.order);
  return new Table(table);
}

export default makeTable;
