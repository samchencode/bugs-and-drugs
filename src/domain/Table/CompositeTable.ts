import type ValueObject from '@/domain/base/ValueObject';
import type Cell from '@/domain/Table/Cell';
import { EmptyCell } from '@/domain/Table/Cell';
import type { Group } from '@/domain/Table/Group';
import type Label from '@/domain/Table/Label';
import type { Table } from '@/domain/Table/Table';
import type { TableParams } from '@/domain/Table/TableParams';

type Mapping = {
  [arr2Index: number]: number; // arr1Index
};

class CompositeTable<T extends Cell> implements Table<T> {
  #table1: Table<T>;
  #table2: Table<T>;
  #rowMapping: Mapping;
  #columnMapping: Mapping;
  #makeEmptyCell: () => T;

  constructor(
    table1: Table<T>,
    table2: Table<T>,
    makeEmptyCell: () => T = defaultMakeEmptyCell
  ) {
    this.#table1 = table1;
    this.#table2 = table2;

    const rowLabels1 = table1.getRowLabels();
    const rowLabels2 = table2.getRowLabels();
    const colLabels1 = table1.getColumnLabels();
    const colLabels2 = table2.getColumnLabels();

    this.#rowMapping = mapArr2ToArr1(rowLabels1, rowLabels2);
    this.#columnMapping = mapArr2ToArr1(colLabels1, colLabels2);

    this.#makeEmptyCell = makeEmptyCell;
  }

  getData(): T[][] {
    const data1 = this.#table1.getData();
    const data2 = this.#table2.getData();

    const data = applyMappingToMatrix(
      this.#rowMapping,
      this.#columnMapping,
      data1,
      data2,
      this.#makeEmptyCell
    );

    return data;
  }

  getShape(): [number, number] {
    return findShapeOfResultMatrix(
      this.#table1.getData(),
      this.#table2.getData(),
      this.#rowMapping,
      this.#columnMapping
    );
  }

  getRowLabels(): Label[] {
    return applyMapping(
      this.#rowMapping,
      this.#table1.getRowLabels(),
      this.#table2.getRowLabels()
    );
  }

  getColumnLabels(): Label[] {
    return applyMapping(
      this.#columnMapping,
      this.#table1.getColumnLabels(),
      this.#table2.getColumnLabels()
    );
  }

  getRowGroups(): Group[] {
    return [];
  }

  clone(params: Partial<TableParams>): Table<T> {
    const t1 = this.#table1.clone(params);
    const t2 = this.#table2.clone(params);
    return new CompositeTable(t1, t2);
  }

  merge(table: Table<T>): Table<T> {
    return new CompositeTable(this, table);
  }
}

function mapArr2ToArr1<T extends ValueObject>(arr1: T[], arr2: T[]): Mapping {
  const mapping: Mapping = {};
  for (const [i, item] of arr2.entries()) {
    const arr1Index = arr1.findIndex((v) => v.is(item));
    if (arr1Index >= 0) mapping[i] = arr1Index;
  }
  return mapping;
}

function applyMapping<T>(mapping: Mapping, arr1: T[], arr2: T[]): T[] {
  const result: T[] = arr1.slice();
  for (const [arr2Idx, item] of arr2.entries()) {
    const arr1Idx = mapping[arr2Idx];
    if (typeof arr1Idx !== 'undefined') result[arr1Idx] = item;
    else result.push(item);
  }
  return result;
}

function applyMappingToMatrix<T extends Cell>(
  rowMapping: Mapping,
  colMapping: Mapping,
  mat1: T[][],
  mat2: T[][],
  makeEmptyCell: () => T
) {
  const [nRow, nCol] = findShapeOfResultMatrix(
    mat1,
    mat2,
    rowMapping,
    colMapping
  );

  const result = new Array(nRow)
    .fill(undefined)
    .map(() => new Array(nCol).fill(undefined).map(makeEmptyCell));

  for (const [i, row] of mat1.entries()) {
    for (const [j, cell] of row.entries()) result[i][j] = cell;
  }

  for (const [i, row] of mat2.entries()) {
    for (const [j, cell] of row.entries()) {
      const mappedRowIdx = rowMapping[i];
      const mappedColIdx = colMapping[j];
      const rowMappingOffset = Object.keys(rowMapping).filter(
        (k) => +k < i
      ).length;
      const colMappingOffset = Object.keys(colMapping).filter(
        (k) => +k < j
      ).length;
      const unmappedRowIdx = mat1.length + i - rowMappingOffset;
      const unmappedColIdx = mat1[0].length + j - colMappingOffset;

      if (
        typeof mappedRowIdx !== 'undefined' &&
        typeof mappedColIdx !== 'undefined'
      ) {
        result[mappedRowIdx][mappedColIdx] = cell;
      } else if (typeof mappedRowIdx !== 'undefined') {
        result[mappedRowIdx][unmappedColIdx] = cell;
      } else if (typeof mappedColIdx !== 'undefined') {
        result[unmappedRowIdx][mappedColIdx] = cell;
      } else result[unmappedRowIdx][unmappedColIdx] = cell;
    }
  }

  return result;
}

function defaultMakeEmptyCell<T extends Cell>(): T {
  return new EmptyCell() as T;
}

function findShapeOfResultMatrix(
  mat1: unknown[][],
  mat2: unknown[][],
  rowMapping: Mapping,
  colMapping: Mapping
): [number, number] {
  const nRow = mat1.length + mat2.length - Object.values(rowMapping).length;
  const nCol =
    mat1[0].length + mat2[0].length - Object.values(colMapping).length;
  return [nRow, nCol];
}

export default CompositeTable;
