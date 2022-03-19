import type Antibiogram from '@/domain/Antibiogram';
import CellInfo from '@/domain/AntibiogramTableBuilder/CellInfo';
import type ColumnInfo from '@/domain/AntibiogramTableBuilder/ColumnInfo';
import ColumnInfoAssembler from '@/domain/AntibiogramTableBuilder/ColumnInfoAssembler';
import type RowInfo from '@/domain/AntibiogramTableBuilder/RowInfo';
import RowInfoAssembler from '@/domain/AntibiogramTableBuilder/RowInfoAssembler';
import TableElementFactory from '@/domain/AntibiogramTableBuilder/TableElementFactory';
import { Cell, FilledCell, makeTable } from '@/domain/Table';

function assembleRowsAndColumns(abg: Antibiogram): [RowInfo[], ColumnInfo[]] {
  const rowAssembler = new RowInfoAssembler(
    abg.getSensitivities(),
    abg.organisms,
    abg.antibiotics
  );
  const columnAssembler = new ColumnInfoAssembler(
    abg.getSensitivities(),
    abg.antibiotics,
    abg.info
  );

  const rows = rowAssembler.assembleRows();
  const columns = columnAssembler.assembleColumns();

  return [rows, columns];
}

function fillMatrix(
  makeCell: (c: CellInfo) => FilledCell,
  rows: RowInfo[],
  columns: ColumnInfo[],
  matrix: Cell[][]
) {
  const result = matrix.slice().map((r) => r.slice());
  for (const [i, row] of rows.entries()) {
    for (const [j, column] of columns.entries()) {
      const data = row.data.filter((d) => column.describes(d.getAntibiotic()));
      if (data.length < 1) continue;
      const cellInfo = new CellInfo(row.organism, column.antibiotic, data);
      matrix[i][j] = makeCell(cellInfo);
    }
  }
  return result;
}

function makeAntibiogramTable(abg: Antibiogram) {
  const factory = new TableElementFactory();

  const [rows, columns] = assembleRowsAndColumns(abg);

  const nRow = rows.length;
  const nCol = columns.length;

  const rowLabels = rows.map((r) => factory.makeRowLabel(r));
  const columnLabels = columns.map((c) => factory.makeColumnLabel(c));
  const matrix = fillMatrix(
    factory.makeCell,
    rows,
    columns,
    factory.makeEmptyMatrix(nRow, nCol)
  );

  return makeTable(matrix, {
    labels: { rows: rowLabels, columns: columnLabels },
  });
}

export default makeAntibiogramTable;
