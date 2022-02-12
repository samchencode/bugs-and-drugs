import parseCsv, {
  type RowArray,
} from '@/infrastructure/persistence/csv/parseCsv';
import validate from '@/infrastructure/persistence/csv/validate';

type Row<Required extends string, Nullable extends string> = {
  [key in Required]: string;
} & {
  [key in Nullable]: string | undefined;
};

type CsvRowArray<Required extends string, Nullable extends string> = Row<
  Required,
  Nullable
>[] &
  RowArray<Required | Nullable>;

abstract class Csv<Required extends string, Nullable extends string> {
  #csv: string;
  #parsed: CsvRowArray<Required, Nullable> | null = null;

  constructor(csv: string) {
    this.#csv = csv;
  }

  protected abstract getRequiredFields(): Record<Required, string>;

  parse(): CsvRowArray<Required, Nullable> {
    if (!this.#parsed) {
      const parsed = parseCsv<Required | Nullable>(this.#csv);
      const required = this.getRequiredFields();
      validate<Required>(required, parsed);
      this.#parsed = parsed as CsvRowArray<Required, Nullable>;
    }
    return this.#parsed;
  }
}

export default Csv;
export type { CsvRowArray, Row };
