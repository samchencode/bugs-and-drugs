import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import type { Presenter } from '@/domain/ports/Presenter';

type Table = Parameters<ShowAntibiogramAction['execute']>[1];

class TableController {
  showAbg: ShowAntibiogramAction;

  constructor(showAntibiogramAction: ShowAntibiogramAction) {
    this.showAbg = showAntibiogramAction;
  }

  showTable(callback: Table) {
    this.showAbg.execute({ id: 0 }, callback);
  }
}

export default TableController;
