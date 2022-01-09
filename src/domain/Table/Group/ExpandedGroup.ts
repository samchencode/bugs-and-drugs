import CollapsedGroup from '@/domain/Table/Group/CollapsedGroup';
import Group from '@/domain/Table/Group/Group';
import type { Range } from '@/domain/Table/Group/Range';

class ExpandedGroup extends Group {
  collapse(): Group {
    return new CollapsedGroup(this.asGroupParams());
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
