import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';

class TableController {
  showAbg: ShowAntibiogramAction;

  constructor(showAntibiogramAction: ShowAntibiogramAction) {
    this.showAbg = showAntibiogramAction;
  }

  async showTable(id: string) {
    return await this.showAbg.execute(id);
  }
}

export default TableController;
