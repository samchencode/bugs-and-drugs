import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';

type Range = [number, number];

class CollapseBehavior {
  ranges: Range[];

  constructor(ranges: Range[]) {
    this.ranges = ranges;
  }

  filterData(data: Cell[][]) {
    return data.filter((x, i) => !this.#indexInAnyRange(i));
  }

  filterLabels(labels: Label[]) {
    return labels.filter((x, i) => !this.#indexInAnyRange(i));
  }

  #indexInAnyRange(index: number) {
    const inRange = this.ranges.find((r) => this.#indexInRange(r, index));
    if (!inRange) return false;
    return true;
  }

  #indexInRange(range: Range, index: number) {
    const [low, high] = range;
    return index >= low && index < high;
  }
}

export default CollapseBehavior;
