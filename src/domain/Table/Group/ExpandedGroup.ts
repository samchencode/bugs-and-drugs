import Group, { type GroupParams } from '@/domain/Table/Group/Group';
import type { Range } from '@/domain/Table/Group/Range';

abstract class ExpandedGroup extends Group {
  protected abstract makeCollapsedGroup(params: GroupParams): Group;

  collapse(): Group {
    return this.makeCollapsedGroup(this.asGroupParams());
  }
  expand(): Group {
    return this;
  }
  isCollapsed(): boolean {
    return false;
  }
  getRange(): Range {
    return [this.rangeStart, this.rangeStart + this.rangeLength];
  }
}

export default ExpandedGroup;
