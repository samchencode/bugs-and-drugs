import Tooltip, { EmptyTooltip } from '@/domain/Table/Tooltip';
import Cell from '@/domain/Table/Cell/Cell';

class EmptyCell extends Cell {
  getValue(): string {
    return 'NA';
  }

  getTooltip(): Tooltip {
    return new EmptyTooltip();
  }
}

export default EmptyCell;
