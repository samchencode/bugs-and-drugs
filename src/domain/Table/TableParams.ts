import type { Group } from '@/domain/Table/Group';
import type Label from '@/domain/Table/Label';

interface TableParams {
  labels: {
    rows: Label[];
    columns: Label[];
  };
  groups: {
    rows: Group[];
  };
}

export type { TableParams };
