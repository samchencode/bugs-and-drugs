import type Cell from '@/domain/Table/Cell';
import type { Table } from '@/domain/Table/Table';

type TableDecorator<T extends Cell> = Table<T>;

export type { TableDecorator };
