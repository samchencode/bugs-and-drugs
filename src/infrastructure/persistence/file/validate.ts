import CsvMissingRequiredValueError from '@/infrastructure/persistence/file/CsvMissingRequiredValueError';

type Row<Required extends string> = {
  [key in Required]: string;
};

type CandidateRow<R extends string> = Partial<Row<R>>;

function validate<R extends string>(
  requiredFields: Record<R, string>,
  rows: CandidateRow<R>[]
) {
  rows.forEach((r, i) => {
    try {
      validateRow(requiredFields, r);
    } catch (e) {
      if (e instanceof CsvMissingRequiredValueError) e.setRowNumber(i);
      throw e;
    }
  });
}

function validateRow<R extends string>(
  requiredFields: Record<R, string>,
  row: CandidateRow<R>
) {
  for (const [column, value] of Object.entries(row)) {
    for (const req in requiredFields) {
      if (column === req && typeof value === 'undefined')
        throw new CsvMissingRequiredValueError(column);
    }
  }
}

export default validate;
