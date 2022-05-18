class ResistanceRate {
  #description: string;
  #year: number;
  #rate: number;

  constructor(description: string, year: number, rate: number) {
    this.#description = description;
    this.#rate = rate;
    this.#year = year;
  }

  getDescription() {
    return this.#description;
  }
  getRate() {
    return this.#rate;
  }
  getYear() {
    return this.#year;
  }

  toString() {
    return `${this.#description} ${this.#rate}, ${this.#year}`;
  }
}

export default ResistanceRate;
