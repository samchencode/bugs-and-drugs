import type Cell from '@/domain/Table/Cell';
import type { TableParams } from '@/domain/Table/TableParams';
import type { Rule } from '@/domain/Table/Validator/Rule';

type Range = [number, number];

class NoIntersectingGroupRanges implements Rule {
  data: Cell[][];
  groupInfo?: TableParams['groups']['rows'];

  constructor(data: Cell[][], groups?: TableParams['groups']) {
    this.data = data;
    this.groupInfo = groups?.rows;
  }

  check(): void {
    if (!this.groupInfo) return;
    if (this.groupInfo.length < 2) return;

    for (let i = 0; i < this.groupInfo.length; i++) {
      const { range } = this.groupInfo[i];
      for (let j = i + 1; j < this.groupInfo.length; j++) {
        const { range: otherRange } = this.groupInfo[j];
        compareRanges(range, otherRange);
      }
    }
  }
}

class DuplicateGroupRangeError extends Error {
  constructor(r1: Range, r2: Range) {
    super();
    this.message =
      'Duplicate group ranges: ' +
      JSON.stringify(r1) +
      ' and ' +
      JSON.stringify(r2);
  }
}

class IntersectingGroupRangeError extends Error {
  constructor(r1: Range, r2: Range) {
    super();
    this.message =
      'Intersecting group ranges: ' +
      JSON.stringify(r1) +
      ' and ' +
      JSON.stringify(r2);
  }
}

function isInRange(r: Range, num: number) {
  return r[0] <= num && r[1] > num;
}

function isSameRange(r1: Range, r2: Range) {
  return r1[0] === r2[0] && r1[1] === r2[1];
}

function hasOverlapLeft(r1: Range, r2: Range) {
  return isInRange(r2, r1[0]) && !isInRange(r2, r1[1]);
}

function hasOverlapRight(r1: Range, r2: Range) {
  return hasOverlapLeft(r2, r1);
}

function compareRanges(r1: Range, r2: Range) {
  if (isSameRange(r1, r2)) throw new DuplicateGroupRangeError(r1, r2);
  if (hasOverlapLeft(r1, r2) || hasOverlapRight(r1, r2))
    throw new IntersectingGroupRangeError(r1, r2);
}

export default NoIntersectingGroupRanges;
