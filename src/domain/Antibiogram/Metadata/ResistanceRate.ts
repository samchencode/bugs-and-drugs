class ResistanceRate {
  #description: string;
  #year: number;
  #rate: number;
  static readonly slug = 'resistance-rate';
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
    return this.#description.concat(
      ', ',
      this.#year.toString(),
      ', ',
      this.#rate.toString()
    );
  }
  getSlug(): string {
    return ResistanceRate.slug;
  }
}

export default ResistanceRate;
