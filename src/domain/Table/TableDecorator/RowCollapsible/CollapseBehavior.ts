import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import type { Group } from '@/domain/Table/Group';

type Range = [number, number];

class CollapseBehavior<T extends Cell> {
  #collapseRanges: Range[];

  constructor(collapseRanges: Range[]) {
    this.#collapseRanges = collapseRanges;
  }

  filterData(data: T[][]) {
    return data.filter((x, i) => !this.#indexInAnyRange(i));
  }

  filterLabels(labels: Label[]) {
    return labels.filter((x, i) => !this.#indexInAnyRange(i));
  }

  findNumberOfCollapsedRows() {
    return this.#collapseRanges.reduce(
      (ag, r) => this.#findLengthOfRange(r) + ag,
      0
    );
  }

  collapseGroups(groups: Group[]) {
    const resultGroups = cloneGroups(groups);

    resultGroups
      .filter((g) => g.collapsed)
      .forEach((g) => {
        g.range[1] = g.range[0] + 1;
      });

    for (const range of this.#collapseRanges) {
      const rangeLength = this.#findLengthOfRange(range);
      if (rangeLength === 0) continue;
      resultGroups
        .filter((g) => this.#rangeComesAfter(g.range, range))
        .forEach((g) => {
          g.range[0] -= rangeLength;
          g.range[1] -= rangeLength;
        });
    }

    return resultGroups;
  }

  #findLengthOfRange(r: Range): number {
    return r[1] - r[0];
  }

  #indexInAnyRange(index: number): boolean {
    const inRange = this.#collapseRanges.find((r) =>
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

function cloneGroups(groups: Group[]) {
  const clone = groups.slice();
  for (const idx in clone) {
    clone[idx] = Object.assign({}, clone[idx]);
    clone[idx].range = clone[idx].range.slice() as [number, number];
  }
  return clone;
}

export default CollapseBehavior;
