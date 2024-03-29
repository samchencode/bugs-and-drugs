import type { AlertLevel } from '@/domain/Table/AlertLevel';
import type Tooltip from '@/domain/Table/Tooltip';

interface CellParams {
  tooltip: Tooltip;
  alert: AlertLevel;
}

export type { CellParams };
