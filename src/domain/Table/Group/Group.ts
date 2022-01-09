import ValueObject from '@/domain/base/ValueObject';
import type { Range } from '@/domain/Table/Group/Range';

interface GroupParams {
  range: Range;
  expandedRange?: Range;
}

abstract class Group extends ValueObject {
  protected rangeStart: number;
  protected rangeLength: number;

  constructor(params: GroupParams) {
    super();
    this.rangeStart = params.range[0];
    this.rangeLength = this.#findRangeLength(
      params.expandedRange ?? params.range
    );
  }

  abstract collapse(): Group;
  abstract expand(): Group;
  abstract isCollapsed(): boolean;
  abstract getRange(): Range;

  hasRange(range: Range) {
    if (this.getRange()[0] !== range[0]) return false;
    if (this.getRange()[1] !== range[1]) return false;
    return true;
  }

  getExpandedRange(): Range {
    return [this.rangeStart, this.rangeStart + this.rangeLength];
  }

  getRangeLength(): number {
    return this.#findRangeLength(this.getRange());
  }

  getExpandedRangeLength(): number {
    return this.rangeLength;
  }

  asGroupParams(): GroupParams {
    return {
      range: this.getRange(),
      expandedRange: this.getExpandedRange(),
    };
  }

  protected isIdentical(v: Group): boolean {
    return this.hasRange(v.getRange());
  }

  #findRangeLength(r: Range) {
    return r[1] - r[0];
  }
}

export default Group;
export type { GroupParams };
