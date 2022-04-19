import type { TablePresenter } from '@/domain/ports/TablePresenter';
import type { Table } from '@/domain/Table';
import WebTable from '@/infrastructure/view/presenters/WebTablePresenter/WebTable';

class WebTablePresenter implements TablePresenter {
  #table: Table | null = null;

  setData(t: Table): void {
    this.#table = t;
  }

  buildViewModel(): WebTable | null {
    if (!this.#table) return null;
    return new WebTable(this.#table);
  }
}

export default WebTablePresenter;
