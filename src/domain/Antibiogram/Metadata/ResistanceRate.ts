import ResistanceRateValue from '@/domain/Antibiogram/Metadata/ResistanceRateValue';

class ResistanceRate {
  #label: string;
  #rate: ResistanceRateValue;
  #year?: number;

  constructor(label: string, rate: string, year?: number) {
    this.#label = label;
    this.#rate = new ResistanceRateValue(rate);
    this.#year = year;
  }

  getlabel(): string {
    return this.#label;
  }
  getRate(): ResistanceRateValue {
    return this.#rate;
  }
  getYear() {
    if (this.hasYear()) return this.#year;
    else return undefined;
  }
  hasYear(): boolean {
    if (this.#year != undefined) return true;
    else return false;
  }
  toString() {
    return this.hasYear()
      ? `${this.#label} ${this.#rate.toString()}, ${this.#year}`
      : `${this.#label} ${this.#rate.toString()}`;
  }
}

export default ResistanceRate;
