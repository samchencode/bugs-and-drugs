import Csv from '@/infrastructure/persistence/file/Csv';

export enum DataRequiredFields {
  organism_name = 'organism_name',
  antibiotic_name = 'antibiotic_name',
  value = 'value',
}

enum DataNullableFields {
  isolates = 'isolates',
  antibiotic_route = 'antibiotic_route',
  sample_info = 'sample_info',
}

class DataCsv extends Csv<DataRequiredFields, DataNullableFields> {
  protected getRequiredFields(): Record<DataRequiredFields, string> {
    return DataRequiredFields;
  }
}

export default DataCsv;
