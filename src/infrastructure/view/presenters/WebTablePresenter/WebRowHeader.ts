import type { Label } from '@/domain/Table';
import type TableGroup from '@/domain/Table/Facade/TableGroup';
import WebTableElement from '@/infrastructure/view/presenters/WebTablePresenter/WebTableElement';

class WebRowHeader extends WebTableElement {
  #isCollapsed: boolean | undefined;
  #inGroup: boolean;
  #group: TableGroup | null;
  #firstOfGroup: boolean;
  #isBold: boolean;

  constructor(id: number, label: Label, group: TableGroup | null) {
    super(id, label);
    this.#group = group;
    this.#inGroup = group !== null;
    this.#isCollapsed = group?.isCollapsed();
    this.#firstOfGroup = id === group?.getRange()[0];
    this.#isBold = label.isBold();
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
  isBold() {
    return this.#isBold;
  }
}
export default WebRowHeader;
