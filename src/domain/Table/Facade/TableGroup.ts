import type Table from '@/domain/Table/Facade/TableFacade';
import type { Group } from '@/domain/Table/Group';

interface GroupHandlers {
  handleCollapse(group: Group): Table;
  handleExpand(group: Group): Table;
}

class TableGroup {
  #group: Group;
  #handlers: GroupHandlers;

  constructor(group: Group, handlers: GroupHandlers) {
    this.#group = group;
    this.#handlers = handlers;
  }

  getRange() {
    return this.#group.getRange();
  }

  getExpandedRange() {
    return this.#group.getExpandedRange();
  }

  isCollapsed() {
    return this.#group.isCollapsed();
  }

  collapse(): Table {
    return this.#handlers.handleCollapse(this.#group);
  }

  expand(): Table {
    return this.#handlers.handleExpand(this.#group);
  }

  includes(index: number) {
    const [from, to] = this.getRange();
    return from <= index && to < index;
  }
}

export default TableGroup;
