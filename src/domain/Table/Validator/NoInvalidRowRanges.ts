import type { Rule } from '@/domain/Table/Validator/Rule';
import type { TableParams } from '@/domain/Table/TableParams';

type Range = [number, number];

class NoInvalidRowRanges implements Rule {
  groupInfo?: TableParams['groups']['rows'];

  constructor(groups?: TableParams['groups']) {
    this.groupInfo = groups?.rows;
  }

  check(): void {
    if (!this.groupInfo) return;
    for (const { range } of this.groupInfo) {
      if (firstNumberIsGreaterThanSecond(range))
        throw new InvalidRangeError(range);
      if (rangeIncludesNegativeNumbers(range))
        throw new InvalidRangeError(range);
    }
  }
}

function firstNumberIsGreaterThanSecond(r: Range) {
  return r[0] > r[1];
}

function rangeIncludesNegativeNumbers(r: Range) {
  return r[0] < 0 || r[1] < 0;
}

class InvalidRangeError extends Error {
  constructor(range: Range) {
    super();
    this.message = 'Invalid range: ' + JSON.stringify(range);
  }
}

export default NoInvalidRowRanges;
