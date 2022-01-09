import type { Group } from '@/domain/Table/Group';

interface TableParams {
  labels: {
    rows: string[];
    columns: string[];
  };
  groups: {
    rows: Group[];
  };
}

export type { TableParams };
