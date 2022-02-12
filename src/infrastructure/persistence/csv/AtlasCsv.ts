import Csv, { type Row } from '@/infrastructure/persistence/csv/Csv';
import type { RowArray } from '@/infrastructure/persistence/csv/parseCsv';

enum AtlasRequiredFields {
  year_month_start = 'year_month_start',
  year_month_end = 'year_month_end',
  antibiogram_id = 'antibiogram_id',
  csv = 'csv',
}

enum AtlasNullableFields {
  region = 'region',
  institution = 'institution',
  sample_info = 'sample_info',
  gram = 'gram',
}

type AtlasRow = Row<AtlasRequiredFields, AtlasNullableFields>;

type AtlasRowArray = AtlasRow[] &
  RowArray<AtlasRequiredFields | AtlasNullableFields>;

class AtlasCsv extends Csv<AtlasRequiredFields, AtlasNullableFields> {
  protected getRequiredFields(): Record<AtlasRequiredFields, string> {
    return AtlasRequiredFields;
  }
}

export default AtlasCsv;
export type { AtlasRowArray, AtlasRow };
