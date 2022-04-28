import { csvParse, type DSVRowArray, type DSVRowString } from '@/lib/d3';

type RowArray<C extends string> = DSVRowArray<C>;

function parseCsv<R extends string>(csv: string): RowArray<R> {
  return csvParse(csv, (row: DSVRowString<R>) => {
    for (const col in row) {
      row[col] = row[col]?.trim();
      if (row[col] === '#N/A') row[col] = undefined;
      if (row[col] === '') row[col] = undefined;
    }
    return row;
  });
}

export default parseCsv;
export type { RowArray };
