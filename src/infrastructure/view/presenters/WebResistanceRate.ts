class WebResistanceRate {
  #rate: string;
  #label: string;
  #year?: number;
  constructor(label: string, rate: string, year?: number) {
    this.#rate = rate;
    this.#label = label;
    this.#year = year;
  }
  getlabel(): string {
    return this.#label;
  }
  getRate(): string {
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
    if (this.hasYear()) return `${this.#label} ${this.#rate}, ${this.#year}`;
    else return `${this.#label} ${this.#rate}`;
  }
}

export default WebResistanceRate;
