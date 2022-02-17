import type { AlertLevel } from '@/domain/Table/AlertLevel';
import type Tooltip from '@/domain/Table/Tooltip';

interface LabelParams {
  tooltip: Tooltip;
  alert: AlertLevel;
}

export type { LabelParams };
