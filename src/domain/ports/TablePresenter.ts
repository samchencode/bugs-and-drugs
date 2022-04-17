import type { Table } from '@/domain/Table';

interface TablePresenter {
  setData(t: Table): void;
}

export type { TablePresenter };
