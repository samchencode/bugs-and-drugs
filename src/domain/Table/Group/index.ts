export type { default as Group } from '@/domain/Table/Group/Group';
export type { Range } from '@/domain/Table/Group/Range';

import { default as AbstractExpandedGroup } from '@/domain/Table/Group/ExpandedGroup';
import { default as AbstractCollapsedGroup } from '@/domain/Table/Group/CollapsedGroup';
import type Group from '@/domain/Table/Group/Group';
import type { GroupParams } from '@/domain/Table/Group/Group';

class ExpandedGroup extends AbstractExpandedGroup {
  protected makeCollapsedGroup(params: GroupParams): Group {
    return new CollapsedGroup(params);
  }
}

class CollapsedGroup extends AbstractCollapsedGroup {
  protected makeExpandedGroup(params: GroupParams): Group {
    return new ExpandedGroup(params);
  }
}

export { ExpandedGroup, CollapsedGroup };
