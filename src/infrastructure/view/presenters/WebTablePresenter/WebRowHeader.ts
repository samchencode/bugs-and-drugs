import type { Cell } from '@/domain/Table';
import type TableGroup from '@/domain/Table/Facade/TableGroup';
import WebTableElement from '@/infrastructure/view/presenters/WebTablePresenter/WebTableElement';

class WebRowHeader extends WebTableElement {
  #isCollapsed: boolean | undefined;
  #inGroup: boolean;
  #group: TableGroup | null;
  #firstOfGroup: boolean;

  constructor(id: number, cell: Cell, group: TableGroup | null) {
    super(id, cell);
    this.#group = group;
    this.#inGroup = group !== null;
    this.#isCollapsed = group?.isCollapsed();
    this.#firstOfGroup = id === group?.getRange()[0];
  }

  isCollapsed() {
    return this.#isCollapsed;
  }
  inGroup() {
    return this.#inGroup;
  }
  getGroup() {
    return this.#group;
  }
  isFirstOfGroup() {
    return this.#firstOfGroup;
  }
}
export default WebRowHeader;
