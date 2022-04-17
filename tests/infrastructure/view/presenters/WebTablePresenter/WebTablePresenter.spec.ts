import { FilledCell as C, Label as L, makeTable } from '@/domain/Table';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';
import WebRowHeader from '@/infrastructure/view/presenters/WebTablePresenter/WebRowHeader';
import WebTableElement from '@/infrastructure/view/presenters/WebTablePresenter/WebTableElement';

describe('WebTablePresenter', () => {
  describe('instantiation', () => {
    it('should make a new presenter object', () => {
      new WebTablePresenter();
    });
  });

  describe('behavior', () => {
    let p: WebTablePresenter;

    beforeEach(() => {
      const table = makeTable(
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
      p = new WebTablePresenter();
      p.setData(table);
    });

    it('should make view model', () => {
      const vm = p.buildViewModel();
      expect(vm).not.toBeNull();
    });

    it('should make grid of TableElement', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { grid } = p.buildViewModel()!;
      expect(grid).toEqual(
        expect.arrayContaining([
          expect.arrayContaining([expect.any(WebTableElement)]),
        ])
      );

      expect(grid[0][0].getValue()).toBe('1');
      expect(grid[3][2].getValue()).toBe('12');
    });

    it('should make a list of RowHeaders', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { rowHeaders } = p.buildViewModel()!;

      expect(rowHeaders).toEqual(
        expect.arrayContaining([expect.any(WebRowHeader)])
      );

      expect(rowHeaders[0].getValue()).toBe('1');
      expect(rowHeaders[3].getValue()).toBe('4');
    });

    it('should make a list of TableElements for column headers', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { columnHeaders } = p.buildViewModel()!;

      expect(columnHeaders).toEqual(
        expect.arrayContaining([expect.any(WebTableElement)])
      );

      expect(columnHeaders[0].getValue()).toBe('A');
      expect(columnHeaders[2].getValue()).toBe('C');
    });
  });
});
