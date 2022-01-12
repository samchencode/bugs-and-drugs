import Group, { type GroupParams } from '@/domain/Table/Group/Group';
import type { Range } from '@/domain/Table/Group/Range';

abstract class CollapsedGroup extends Group {
  protected abstract makeExpandedGroup(params: GroupParams): Group;

  collapse(): Group {
    return this;
  }
  expand(): Group {
    return this.makeExpandedGroup(this.asGroupParams());
  }
  isCollapsed(): boolean {
    return true;
  }
  getRange(): Range {
    return [this.rangeStart, this.rangeStart + 1];
  }
}

export default CollapsedGroup;
