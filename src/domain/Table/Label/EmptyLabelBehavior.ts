import Cell, { EmptyCell } from '@/domain/Table/Cell';
import BaseLabelBehavior from '@/domain/Table/Label/BaseLabelBehavior';

class EmptyLabelBehavior extends BaseLabelBehavior {
  isBold(): boolean {
    return false;
  }
  protected makeCell(): Cell {
    return new EmptyCell();
  }
}

export default EmptyLabelBehavior;
