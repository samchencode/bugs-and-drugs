import Table, { Cell, Tooltip, EmptyTooltip } from '@/domain/Table';

describe('Table', () => {
  class D extends Cell {
    value: number;
    constructor(v: number) {
      super();
      this.value = v;
    }
    getValue() {
      return '' + this.value;
    }
    getTooltip(): Tooltip {
      return new EmptyTooltip();
    }
  }

  let data: D[][];
  const labels = {
    columns: ['c1', 'c2', 'c3'],
    rows: ['r1', 'r2', 'r3', 'r4'],
  };

  beforeEach(() => {
    data = [
      [new D(10), new D(20), new D(30)],
      [new D(40), new D(50), new D(60)],
      [new D(70), new D(80), new D(90)],
      [new D(100), new D(110), new D(120)],
    ];
  });

  describe('instantiation', () => {
    it('should create new empty table via constructor', () => {
      const table = Table.makeTable([]);
      expect(table).toBeDefined();
      expect(table.data).toEqual([]);
    });

    it('should create new table with data', () => {
      const table = Table.makeTable(data);
      expect(table).toBeDefined();
      expect(table.data).toEqual(data);
    });

    it('should throw error with inconsistent row/col number', () => {
      const badData = [[new D(1)], [new D(3), new D(2)]];
      const boom = () => Table.makeTable(badData);
      expect(boom).toThrowError('Inconsistent number of columns or rows');
    });

    it('should throw error with undefined values', () => {
      let badData = [
        [new D(1), undefined, new D(3)],
        [new D(4), undefined, undefined],
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let boom = () => Table.makeTable(badData as any);
      expect(boom).toThrowError('Undefined value');

      badData = [
        // eslint-disable-next-line no-sparse-arrays
        [new D(1), , new D(3)],
        // eslint-disable-next-line no-sparse-arrays
        [new D(4), ,],
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      boom = () => Table.makeTable(badData as any);
      expect(boom).toThrowError('Undefined value');
    });

    it('should throw error with undefiend columns', () => {
      const badData = [undefined, [new D(1)]];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boom = () => Table.makeTable(badData as any);
      expect(boom).toThrowError('Undefined value');
    });

    it('should throw an error if the number of rows in the data is not equal to the number of row labels', () => {
      const badLabels = {
        columns: ['c1', 'c2', 'c3'],
        rows: ['r1', 'r2', 'r3'],
      };
      const boom = () => Table.makeTable(data, badLabels);
      expect(boom).toThrowError(
        'Row labels do not match number of rows in data'
      );
    });

    it('should make empty row and column labels if none are provided', () => {
      const table = Table.makeTable(data);
      expect(table.getColumnLabels().map((x) => x.toString())).toEqual(
        expect.arrayContaining([''])
      );
      expect(table.getRowLabels().map((x) => x.toString())).toEqual(
        expect.arrayContaining([''])
      );
    });
  });

  describe('behavior', () => {
    let table: Table<D>;

    beforeEach(() => {
      table = Table.makeTable(data, labels);
    });

    it('should report shape of empty table', () => {
      const table = Table.makeTable([]);
      expect(table.getShape()).toEqual([0, 0]);
    });

    it('should get shape of table', () => {
      expect(table.getShape()).toEqual([4, 3]);
    });

    it('should get all values', () => {
      expect(table.getData()).toEqual(data);
    });

    it('should get number of rows and columns', () => {
      const expectedRows = 4;
      const expectedColumns = 3;
      expect(table.getShape()).toEqual([expectedRows, expectedColumns]);
    });

    it('should get row and column names', () => {
      const rLabels = table.getRowLabels();
      const cLabels = table.getColumnLabels();
      expect(rLabels.map((x) => x.toString())).toEqual(labels.rows);
      expect(cLabels.map((x) => x.toString())).toEqual(labels.columns);
    });

    it('should equate another table with identical data', () => {
      const table1 = Table.makeTable(data, labels);
      const table2 = Table.makeTable(data, labels);
      expect(table1.is(table2)).toBe(true);

      const diffData = [
        [new D(10), new D(20), new D(30)],
        [new D(40), new D(50), new D(60)],
        [new D(70), new D(80), new D(90)],
        [new D(100), new D(110), new D(1200)],
      ];
      const table3 = Table.makeTable(diffData, labels);
      expect(table1.is(table3)).toBe(false);
    });
  });
});
