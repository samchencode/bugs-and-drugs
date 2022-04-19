import {
  FilledCell as C,
  Label as L,
  makeTable,
  type Table,
} from '@/domain/Table';
import WebRowHeader from '@/infrastructure/view/presenters/WebTablePresenter/WebRowHeader';
import WebTable from '@/infrastructure/view/presenters/WebTablePresenter/WebTable';
import WebTableElement from '@/infrastructure/view/presenters/WebTablePresenter/WebTableElement';

describe('WebTable', () => {
  let table: Table;

  beforeEach(() => {
    table = makeTable(
      [
        [new C('1'), new C('2'), new C('3')],
        [new C('4'), new C('5'), new C('6')],
        [new C('7'), new C('8'), new C('9')],
        [new C('10'), new C('11'), new C('12')],
      ],
      {
        labels: {
          rows: [new L('1'), new L('2'), new L('3'), new L('4')],
          columns: [new L('A'), new L('B'), new L('C')],
        },
      }
    );
  });

  describe('instantiation', () => {
    it('creates a new webTable', () => {
      new WebTable(table);
    });

    it('should make grid of TableElement', () => {
      const { grid } = new WebTable(table);
      expect(grid).toEqual(
        expect.arrayContaining([
          expect.arrayContaining([expect.any(WebTableElement)]),
        ])
      );

      expect(grid[0][0].getValue()).toBe('1');
      expect(grid[3][2].getValue()).toBe('12');
    });

    it('should make a list of RowHeaders', () => {
      const { rowHeaders } = new WebTable(table);

      expect(rowHeaders).toEqual(
        expect.arrayContaining([expect.any(WebRowHeader)])
      );

      expect(rowHeaders[0].getValue()).toBe('1');
      expect(rowHeaders[3].getValue()).toBe('4');
    });

    it('should make a list of TableElements for column headers', () => {
      const { columnHeaders } = new WebTable(table);

      expect(columnHeaders).toEqual(
        expect.arrayContaining([expect.any(WebTableElement)])
      );

      expect(columnHeaders[0].getValue()).toBe('A');
      expect(columnHeaders[2].getValue()).toBe('C');
    });
  });

  describe('behavior', () => {
    let wTable: WebTable;

    beforeEach(() => {
      wTable = new WebTable(table);
    });

    it('should make highlight and unhighlight a row', () => {
      wTable.highlightRow(0);

      expect(wTable.grid[0][0].getHighlighted()).toBe(true);
      expect(wTable.grid[0][1].getHighlighted()).toBe(true);
      expect(wTable.grid[0][2].getHighlighted()).toBe(true);
      expect(wTable.rowHeaders[0].getActive()).toBe(true);

      wTable.unhighlightRow(0);

      expect(wTable.grid[0][0].getHighlighted()).toBe(false);
      expect(wTable.grid[0][1].getHighlighted()).toBe(false);
      expect(wTable.grid[0][2].getHighlighted()).toBe(false);
      expect(wTable.rowHeaders[0].getActive()).toBe(false);
    });

    it('should make highlight and unhighlight a column', () => {
      wTable.highlightColumn(0);

      expect(wTable.grid[0][0].getHighlighted()).toBe(true);
      expect(wTable.grid[1][0].getHighlighted()).toBe(true);
      expect(wTable.grid[2][0].getHighlighted()).toBe(true);
      expect(wTable.columnHeaders[0].getActive()).toBe(true);

      wTable.unhighlightColumn(0);

      expect(wTable.grid[0][0].getHighlighted()).toBe(false);
      expect(wTable.grid[1][0].getHighlighted()).toBe(false);
      expect(wTable.grid[2][0].getHighlighted()).toBe(false);
      expect(wTable.columnHeaders[0].getActive()).toBe(false);
    });

    it('should make highlight and unhighlight a cell', () => {
      wTable.highlightCell(0, 0);

      expect(wTable.grid[0][0].getHighlighted()).toBe(true);
      expect(wTable.grid[1][0].getHighlighted()).toBe(true);
      expect(wTable.grid[2][0].getHighlighted()).toBe(true);
      expect(wTable.grid[0][0].getHighlighted()).toBe(true);
      expect(wTable.grid[0][1].getHighlighted()).toBe(true);
      expect(wTable.grid[0][2].getHighlighted()).toBe(true);
      expect(wTable.rowHeaders[0].getActive()).toBe(false);
      expect(wTable.columnHeaders[0].getActive()).toBe(false);

      expect(wTable.grid[1][1].getHighlighted()).toBe(false);

      wTable.unhighlightCell(0, 0);

      expect(wTable.grid[0][0].getHighlighted()).toBe(false);
      expect(wTable.grid[1][0].getHighlighted()).toBe(false);
      expect(wTable.grid[2][0].getHighlighted()).toBe(false);
      expect(wTable.grid[0][0].getHighlighted()).toBe(false);
      expect(wTable.grid[0][1].getHighlighted()).toBe(false);
      expect(wTable.grid[0][2].getHighlighted()).toBe(false);
      expect(wTable.rowHeaders[0].getActive()).toBe(false);
      expect(wTable.columnHeaders[0].getActive()).toBe(false);

      expect(wTable.grid[1][1].getHighlighted()).toBe(false);
    });

    it('should ignore unhighlight if already unhighlighted', () => {
      wTable.unhighlightCell(0, 0);
      expect(wTable.grid[0][0].getHighlighted()).toBe(false);
      expect(wTable.grid[1][0].getHighlighted()).toBe(false);
      expect(wTable.grid[2][0].getHighlighted()).toBe(false);
      expect(wTable.grid[0][0].getHighlighted()).toBe(false);
      expect(wTable.grid[0][1].getHighlighted()).toBe(false);
      expect(wTable.grid[0][2].getHighlighted()).toBe(false);
      expect(wTable.rowHeaders[0].getActive()).toBe(false);
      expect(wTable.columnHeaders[0].getActive()).toBe(false);

      expect(wTable.grid[1][1].getHighlighted()).toBe(false);
    });
  });
});
