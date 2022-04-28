class CsvMissingRequiredValueError extends Error {
  #field: string;
  #rowNumber: number | undefined;

  constructor(field: string, rowNumber?: number) {
    super();
    this.#field = field;
    this.#rowNumber = rowNumber;
  }

  setRowNumber(n: number) {
    this.#rowNumber = n;
  }

  get message() {
    let message = 'Missing required field "' + this.#field + '"';
    if (this.#rowNumber) message += ' on at row number ' + this.#rowNumber;
    return message;
  }
}

export default CsvMissingRequiredValueError;
