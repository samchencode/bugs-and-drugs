import type { TableParams } from '@/domain/Table/Table';
import type { Rule } from '@/domain/Table/Validator/Rule';

type Range = [number, number];

class NoZeroOrOneRowGroups implements Rule {
  groupInfo?: TableParams['groups']['rows'];

  constructor(groups?: TableParams['groups']) {
    this.groupInfo = groups?.rows;
  }

  check(): void {
    if (!this.groupInfo) return;
    for (const { range } of this.groupInfo) {
      if (!includesMoreThanTwoIntegers(range))
        throw new GroupOfLessThanTwoRowsError(range);
    }
  }
}

function includesMoreThanTwoIntegers(r: Range) {
  return r[1] - r[0] !== 1 && r[1] - r[0] !== 0;
}

class GroupOfLessThanTwoRowsError extends Error {
  constructor(range: Range) {
    super();
    this.message =
      'Group must have at least two rows. Got range: ' + JSON.stringify(range);
  }
}

export default NoZeroOrOneRowGroups;
