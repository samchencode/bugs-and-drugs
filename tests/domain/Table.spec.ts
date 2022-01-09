import {
  Cell,
  Tooltip,
  EmptyTooltip,
  makeTable,
  ExpandedGroup,
  CollapsedGroup,
} from '@/domain/Table';
import type { Table } from '@/domain/Table';

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

  const groups = {
    rows: [
      new ExpandedGroup({ range: [0, 2] }),
      new CollapsedGroup({ range: [2, 4] }),
    ],
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
      const table = makeTable([]);
      expect(table).toBeDefined();
      expect(table.getCells()).toEqual([]);
    });

    it('should create new table with data', () => {
      const table = makeTable(data);
      expect(table).toBeDefined();
      expect(table.getShape()).toEqual([4, 3]);
      expect(table.getCells()[0][0].getValue()).toEqual('10');
      expect(table.getCells()[3][2].getValue()).toEqual('120');
    });

    it('should throw error with inconsistent row/col number', () => {
      const badData = [[new D(1)], [new D(3), new D(2)]];
      const boom = () => makeTable(badData);
      expect(boom).toThrowError('Inconsistent number of columns or rows');
    });

    it('should throw error with undefined values', () => {
      let badData = [
        [new D(1), undefined, new D(3)],
        [new D(4), undefined, undefined],
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let boom = () => makeTable(badData as any);
      expect(boom).toThrowError('Undefined value');

      badData = [
        // eslint-disable-next-line no-sparse-arrays
        [new D(1), , new D(3)],
        // eslint-disable-next-line no-sparse-arrays
        [new D(4), ,],
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      boom = () => makeTable(badData as any);
      expect(boom).toThrowError('Undefined value');
    });

    it('should throw error with undefiend columns', () => {
      const badData = [undefined, [new D(1)]];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boom = () => makeTable(badData as any);
      expect(boom).toThrowError('Undefined value');
    });

    it('should throw an error if the number of rows in the data is not equal to the number of row labels', () => {
      const badLabels = {
        columns: ['c1', 'c2', 'c3'],
        rows: ['r1', 'r2', 'r3'],
      };
      const boom = () => makeTable(data, { labels: badLabels });
      expect(boom).toThrowError(
        'Row labels do not match number of rows in data'
      );
    });

    it('should make empty row and column labels if none are provided', () => {
      const table = makeTable(data);
      expect(table.getColumnLabels().map((x) => x.toString())).toEqual(
        expect.arrayContaining([''])
      );
      expect(table.getRowLabels().map((x) => x.toString())).toEqual(
        expect.arrayContaining([''])
      );
    });

    it('should make a table with collapsed row group range. First row of range is not collapsed', () => {
      const table = makeTable(data, {
        labels,
        groups: {
          rows: [new CollapsedGroup({ range: [1, 3] })],
        },
      });

      const values = cellMatrixToStringMatrix(table.getCells());
      const expectedValues = cellMatrixToStringMatrix([
        data[0],
        data[1],
        data[3],
      ]);
      expect(values).toEqual(expectedValues);
      const rowLabels = table.getRowLabels().map((x) => x.toString());
      expect(rowLabels).toEqual(['r1', 'r2', 'r4']);
    });

    it('should preserve an expanded group that comes after a collapsed range', () => {
      const table = makeTable(data, {
        labels,
        groups: {
          rows: [
            new CollapsedGroup({ range: [0, 2] }),
            new ExpandedGroup({ range: [2, 4] }),
          ],
        },
      });
      const values = cellMatrixToStringMatrix(table.getCells());
      const expectedValues = cellMatrixToStringMatrix([
        data[0],
        data[2],
        data[3],
      ]);
      expect(values).toEqual(expectedValues);
      const rowLabels = table.getRowLabels().map((x) => x.toString());
      expect(rowLabels).toEqual(['r1', 'r3', 'r4']);
    });

    it('should preserve expanded group ranges beyond collapsed range', () => {
      const table = makeTable(data, {
        labels,
        groups: {
          rows: [
            new CollapsedGroup({ range: [0, 2] }),
            new ExpandedGroup({ range: [2, 4] }),
          ],
        },
      });

      expect(table.getRowGroups()[1].getRange()).toEqual([1, 3]);
    });

    it('should throw error with overlapping ranges', () => {
      const badRanges1 = [
        new ExpandedGroup({ range: [1, 3] }),
        new ExpandedGroup({ range: [2, 4] }),
      ];
      const badRanges2 = [
        new ExpandedGroup({ range: [2, 4] }),
        new ExpandedGroup({ range: [1, 3] }),
      ];
      const badRanges3 = [
        new ExpandedGroup({ range: [1, 3] }),
        new ExpandedGroup({ range: [1, 3] }),
      ];

      const boom1 = () =>
        makeTable(data, {
          groups: { rows: badRanges1 },
        });
      const boom2 = () =>
        makeTable(data, {
          groups: { rows: badRanges2 },
        });
      const boom3 = () =>
        makeTable(data, {
          groups: { rows: badRanges3 },
        });

      expect(boom1).toThrowError('Intersecting group ranges');
      expect(boom2).toThrowError('Intersecting group ranges');
      expect(boom3).toThrowError('Duplicate group ranges');
    });

    it('should not allow groups of only zero or one row', () => {
      const badRange1 = [new ExpandedGroup({ range: [0, 1] })];
      const boom1 = () => makeTable(data, { groups: { rows: badRange1 } });

      expect(boom1).toThrowError('Group must have at least two rows');
    });

    it('should not allow negative indices for group range', () => {
      const badRange1 = [new ExpandedGroup({ range: [-1, 2] })];
      const boom1 = () => makeTable(data, { groups: { rows: badRange1 } });

      expect(boom1).toThrowError('Invalid range');
    });

    it('should not allow invalid range', () => {
      const badRange1 = [new ExpandedGroup({ range: [2, 0] })];
      const boom1 = () => makeTable(data, { groups: { rows: badRange1 } });

      expect(boom1).toThrowError('Invalid range');
    });
  });

  describe('behavior', () => {
    let table: Table;

    beforeEach(() => {
      table = makeTable(data, { labels });
    });

    it('should report shape of empty table', () => {
      const table = makeTable([]);
      expect(table.getShape()).toEqual([0, 0]);
    });

    it('should get shape of table', () => {
      expect(table.getShape()).toEqual([4, 3]);
    });

    it('should get all values', () => {
      const values = cellMatrixToStringMatrix(table.getCells());
      const expectedValues = cellMatrixToStringMatrix(data);
      expect(values).toEqual(expectedValues);
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
  });

  describe('row, column, group facades', () => {
    let table: Table;

    beforeEach(() => {
      table = makeTable(data, {
        labels,
        groups: {
          rows: [new ExpandedGroup({ range: [0, 2] })],
        },
      });
    });

    it('should get a row', () => {
      const row = table.getRows()[0];
      const values = cellArrayToStringArray(row.getCells());
      const expectedValues = cellArrayToStringArray(data[0]);
      expect(values).toEqual(expectedValues);

      expect(row.getLabel().toString()).toBe(labels.rows[0]);
    });

    it('should get a column', () => {
      const column = table.getColumns()[0];
      const values = cellArrayToStringArray(column.getCells());
      const expectedValues = cellArrayToStringArray(data.map((v) => v[0]));
      expect(values).toEqual(expectedValues);

      expect(column.getLabel().toString()).toBe(labels.columns[0]);
    });

    it('should get a group', () => {
      const group = table.getRowGroups()[0];
      expect(group.getRange()).toEqual(groups.rows[0].getRange());
    });

    it('should get a group by row', () => {
      const group = table.getRows()[0].getGroup();
      expect(group).not.toBeNull();
    });
  });

  describe('group facade behavior', () => {
    let table: Table;

    beforeEach(() => {
      table = makeTable(data, {
        labels,
        groups,
      });
    });
    it('should create new table with collapsed rows', () => {
      const collapsedTable = table.getRowGroups()[0].collapse();
      const values = cellMatrixToStringMatrix(collapsedTable.getCells());
      const expectedValues = cellMatrixToStringMatrix([data[0], data[2]]);
      expect(values).toEqual(expectedValues);
    });

    it('should create new table with expanded rows', () => {
      const collapsedTable = table.getRowGroups()[1].expand();
      const values = cellMatrixToStringMatrix(collapsedTable.getCells());
      const expectedValues = cellMatrixToStringMatrix(data);
      expect(values).toEqual(expectedValues);
    });

    it('should update group ranges after collapse', () => {
      const collapsedTable = table.getRowGroups()[0].collapse();
      const collapsedRanges = collapsedTable
        .getRowGroups()
        .map((x) => x.getRange());
      expect(collapsedRanges).toEqual(
        expect.arrayContaining([
          [0, 1],
          [1, 2],
        ])
      );
    });

    it('should update group ranges after collapse with many collapsed groups', () => {
      const data = [
        [new D(10), new D(20), new D(30)],
        [new D(40), new D(50), new D(60)],
        [new D(70), new D(80), new D(90)],
        [new D(100), new D(110), new D(120)],
        [new D(130), new D(140), new D(150)],
        [new D(160), new D(170), new D(180)],
      ];
      const table = makeTable(data, {
        groups: {
          rows: [
            new CollapsedGroup({ range: [0, 2] }),
            new CollapsedGroup({ range: [2, 4] }),
            new ExpandedGroup({ range: [4, 6] }),
          ],
        },
      });
      const collapsedTable = table.getRowGroups()[0].collapse();
      const collapsedRanges = collapsedTable
        .getRowGroups()
        .map((x) => x.getRange());
      expect(collapsedRanges).toEqual(
        expect.arrayContaining([
          [0, 1],
          [1, 2],
          [2, 4],
        ])
      );
    });

    it('should update group ranges after expand', () => {
      const table = makeTable(data, {
        labels,
        groups: {
          rows: [
            new CollapsedGroup({ range: [0, 2] }),
            new ExpandedGroup({ range: [2, 4] }),
          ],
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const expandedTable = table.getRowGroupByRange([0, 1])!.expand();
      const expandedRanges = expandedTable
        .getRowGroups()
        .map((x) => x.getRange());
      expect(expandedRanges).toEqual(
        expect.arrayContaining([
          [0, 2],
          [2, 4],
        ])
      );
    });

    it('should return table when calling expand on expanded row', () => {
      const sameTable = table.getRowGroups()[0].expand();
      const values = cellMatrixToStringMatrix(sameTable.getCells());
      const expectedValues = cellMatrixToStringMatrix([
        data[0],
        data[1],
        data[2],
      ]);
      expect(values).toEqual(expectedValues);
    });

    it('should shift the ranges below on collapse', () => {
      const collapsedTable = table.getRowGroups()[0].collapse();
      const newRanges = collapsedTable.getRowGroups().map((x) => x.getRange());
      expect(newRanges).toEqual(
        expect.arrayContaining([
          [0, 1],
          [1, 2],
        ])
      );
    });

    it('should be the same after collapse then expand', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const collapsedTable = table.getRowGroupByRange([0, 2])!.collapse();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const revertedTable = collapsedTable.getRowGroupByRange([0, 1])!.expand();
      const revertedRanges = revertedTable
        .getRowGroups()
        .map((x) => x.getRange());
      const revertedExpandedRanges = revertedTable
        .getRowGroups()
        .map((x) => x.getExpandedRange());
      console.log(revertedRanges, revertedExpandedRanges);
      expect(revertedRanges).toEqual(
        expect.arrayContaining([
          [0, 2],
          [2, 3],
        ])
      );
      expect(revertedExpandedRanges).toEqual(
        expect.arrayContaining([
          [0, 2],
          [2, 4],
        ])
      );

      const values = cellMatrixToStringMatrix(revertedTable.getCells());
      const expectedValues = cellMatrixToStringMatrix([
        data[0],
        data[1],
        data[2],
      ]);
      expect(values).toEqual(expectedValues);
    });

    it('should be the same after expand then collapse', () => {
      const table = makeTable(data, {
        labels,
        groups: {
          rows: [
            new CollapsedGroup({ range: [0, 2] }),
            new ExpandedGroup({ range: [2, 4] }),
          ],
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const expandedTable = table.getRowGroupByRange([0, 1])!.expand();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const revertedTable = expandedTable
        .getRowGroupByRange([0, 2])!
        .collapse();
      const revertedRanges = revertedTable
        .getRowGroups()
        .map((x) => x.getRange());
      const revertedExpandedRanges = revertedTable
        .getRowGroups()
        .map((x) => x.getExpandedRange());
      expect(revertedRanges).toEqual(
        expect.arrayContaining([
          [0, 1],
          [1, 3],
        ])
      );
      expect(revertedExpandedRanges).toEqual(
        expect.arrayContaining([
          [0, 2],
          [1, 3],
        ])
      );
      const values = cellMatrixToStringMatrix(revertedTable.getCells());
      const expectedValues = cellMatrixToStringMatrix([
        data[0],
        data[2],
        data[3],
      ]);
      expect(values).toEqual(expectedValues);
    });
  });
});

function cellArrayToStringArray(cells: { getValue(): string }[]): string[] {
  return cells.map((c) => c.getValue());
}

function cellMatrixToStringMatrix(
  cells: { getValue(): string }[][]
): string[][] {
  return cells.map((r) => cellArrayToStringArray(r));
}
