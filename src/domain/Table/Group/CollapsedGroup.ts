import ExpandedGroup from '@/domain/Table/Group/ExpandedGroup';
import Group from '@/domain/Table/Group/Group';
import type { Range } from '@/domain/Table/Group/Range';

class CollapsedGroup extends Group {
  collapse(): Group {
    return this;
  }
  expand(): Group {
    return new ExpandedGroup(this.asGroupParams());
  }
  isCollapsed(): boolean {
    return true;
  }
  getRange(): Range {
    return [this.rangeStart, this.rangeStart + 1];
  }
}

export default CollapsedGroup;
