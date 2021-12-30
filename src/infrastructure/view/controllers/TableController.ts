import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';

class TableController {
  showAbg: ShowAntibiogramAction;

  constructor(showAntibiogramAction: ShowAntibiogramAction) {
    this.showAbg = showAntibiogramAction;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async showTable(id: number) {
    return await this.showAbg.execute();
  }
}

export default TableController;
