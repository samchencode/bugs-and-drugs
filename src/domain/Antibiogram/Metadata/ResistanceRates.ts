import MetadataValue from '@/domain/Antibiogram/Metadata/MetadataValue';
import type ResistanceRate from '@/domain/Antibiogram/Metadata/ResistanceRate';

class ResistanceRates extends MetadataValue {
  #resistanceRates: ResistanceRate[];
  static readonly slug = 'resistance-rates';
  constructor(resistanceRates: ResistanceRate[]) {
    super();
    this.#resistanceRates = resistanceRates;
  }
  getSlug(): string {
    return ResistanceRates.slug;
  }
  getResistanceRates() {
    return this.#resistanceRates;
  }
  protected isIdentical(resistanceRates: ResistanceRates): boolean {
    resistanceRates
      .getResistanceRates()
      .forEach((resistanceRate: ResistanceRate) => {
        if (resistanceRate.toString() != this.#resistanceRates.toString())
          return false;
      });
    return true;
  }
}

export default ResistanceRates;
