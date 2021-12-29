import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';

class TableController {
  showAbg: ShowAntibiogramAction;

  constructor(showAntibiogramAction: ShowAntibiogramAction) {
    this.showAbg = showAntibiogramAction;
  }

  async showTable(id: number) {
    return await this.showAbg.execute({ id: id });
  }
}

export default TableController;
