import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import { CollapsedGroup, ExpandedGroup } from '@/domain/Table/Group';
import type { Group, Range } from '@/domain/Table/Group';

class CollapseBehavior<T extends Cell> {
  #hiddenRanges: Range[];

  constructor(rowGroups: Group[]) {
    this.#hiddenRanges = rowGroups
      .filter((g) => g.isCollapsed())
      .map<[number, number]>((g) => g.getHideableRange());
  }

  filterData(data: T[][]) {
    return data.filter((x, i) => !inRanges(this.#hiddenRanges, i));
  }

  filterLabels(labels: Label[]) {
    return labels.filter((x, i) => !inRanges(this.#hiddenRanges, i));
  }

  findNumberOfCollapsedRows() {
    return this.#hiddenRanges.reduce((ag, r) => findRangeLength(r) + ag, 0);
  }

  collapseGroups(groups: Group[]): Group[] {
    return groups.map((g) =>
      this.#hiddenRanges
        .filter((r) => groupComesAfter(g, r))
        .map((r) => findRangeLength(r))
        .reduce((g, len) => shiftGroupUp(g, len), g)
    );
  }
}

function shiftGroupUp(g: Group, spots: number) {
  const Group = g.isCollapsed() ? CollapsedGroup : ExpandedGroup;
  return new Group({
    range: subtract(g.getRange(), spots),
    expandedRange: subtract(g.getExpandedRange(), spots),
  });
}

function inRanges(ranges: Range[], index: number): boolean {
  return !!ranges.find((r) => inRange(r, index));
}

function inRange(range: Range, index: number): boolean {
  const [low, high] = range;
  return index >= low && index < high;
}

function subtract(range: Range, value: number): [number, number] {
  return [range[0] - value, range[1] - value];
}

function findRangeLength(r: Range): number {
  return r[1] - r[0];
}

function groupComesAfter(g: Group, r2: Range) {
  const r1 = g.getRange();
  return r2[1] <= r1[0];
}

export default CollapseBehavior;
