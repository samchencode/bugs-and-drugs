import type Table from '@/domain/Table/Facade/TableFacade';
import type { Group, Range } from '@/domain/Table/Group';

interface GroupHandlers {
  handleCollapse(range: Range): Table;
  // handleExpand(range: Range, newRange: Range): Table;
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

  isCollapsed() {
    return this.#group.isCollapsed();
  }

  collapse(): Table {
    return this.#handlers.handleCollapse(this.getRange());
  }

  expand(): Table {
    // get tableparams from constructor?
    // or make a Table.cloneWithModifiedParams method...
    // and make a new table and return it
    throw Error;
  }

  includes(index: number) {
    const [from, to] = this.getRange();
    return from <= index && to < index;
  }
}

export default TableGroup;
