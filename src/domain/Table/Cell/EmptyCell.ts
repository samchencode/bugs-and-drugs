import Tooltip from '@/domain/Table/Tooltip';
import Cell from '@/domain/Table/Cell/Cell';
import { AlertLevels, type AlertLevel } from '@/domain/Table/AlertLevel';

class EmptyCell extends Cell {
  getValue(): string {
    return 'NA';
  }

  getTooltip(): Tooltip {
    return new Tooltip();
  }

  getAlertLevel(): AlertLevel {
    return AlertLevels.NONE;
  }
}

export default EmptyCell;
