import type Cell from '@/domain/Table/Cell';
import type { Table } from '@/domain/Table/Table';
import type { Group } from '@/domain/Table/Group';

class TableGroup {
  #group: Group;
  constructor(group: Group) {
    this.#group = group;
  }

  getRange() {
    return this.#group.range;
  }

  isCollapsed() {
    return this.#group.collapsed;
  }

  collapse(): Table<Cell> {
    // get tableparams from constructor?
    // or make a Table.cloneWithModifiedParams method...
    // and make a new table and return it
    throw Error;
  }

  expand(): Table<Cell> {
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
