import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import { CollapsedGroup, ExpandedGroup } from '@/domain/Table/Group';
import type { Group, Range } from '@/domain/Table/Group';

class CollapseBehavior<T extends Cell> {
  #hiddenRanges: Range[];

  constructor(collapseRanges: Range[]) {
    this.#hiddenRanges = collapseRanges;
  }

  filterData(data: T[][]) {
    return data.filter((x, i) => !this.#indexInAnyRange(i));
  }

  filterLabels(labels: Label[]) {
    return labels.filter((x, i) => !this.#indexInAnyRange(i));
  }

  findNumberOfCollapsedRows() {
    return this.#hiddenRanges.reduce(
      (ag, r) => this.#findLengthOfRange(r) + ag,
      0
    );
  }

  collapseGroups(groups: Group[]) {
    const resultGroups = groups.slice();

    for (const range of this.#hiddenRanges) {
      const rangeLength = this.#findLengthOfRange(range);
      if (rangeLength === 0) continue;
      const affectedGroups = resultGroups.filter((g) =>
        this.#rangeComesAfter(g.getRange(), range)
      );

      for (const [i, g] of affectedGroups.entries()) {
        const newRangeParams = {
          ...g.asGroupParams(),
          range: this.#subtractFromRange(g.getRange(), rangeLength),
          expandedRange: this.#subtractFromRange(
            g.getExpandedRange(),
            rangeLength
          ),
        };
        affectedGroups[i] = g.isCollapsed()
          ? new CollapsedGroup(newRangeParams)
          : new ExpandedGroup(newRangeParams);
      }
    }

    return resultGroups;
  }

  #subtractFromRange(range: Range, value: number): [number, number] {
    return [range[0] - value, range[1] - value];
  }

  #findLengthOfRange(r: Range): number {
    return r[1] - r[0];
  }

  #indexInAnyRange(index: number): boolean {
    const inRange = this.#hiddenRanges.find((r) =>
      this.#indexInRange(r, index)
    );
    if (!inRange) return false;
    return true;
  }

  #indexInRange(range: Range, index: number): boolean {
    const [low, high] = range;
    return index >= low && index < high;
  }

  #rangeComesAfter(r1: Range, r2: Range) {
    return r2[1] <= r1[0];
  }
}

export default CollapseBehavior;
