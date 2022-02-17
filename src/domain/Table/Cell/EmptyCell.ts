import Tooltip from '@/domain/Table/Tooltip';
import Cell from '@/domain/Table/Cell/Cell';

class EmptyCell extends Cell {
  getValue(): string {
    return 'NA';
  }

  getTooltip(): Tooltip {
    return new Tooltip();
  }
}

export default EmptyCell;
