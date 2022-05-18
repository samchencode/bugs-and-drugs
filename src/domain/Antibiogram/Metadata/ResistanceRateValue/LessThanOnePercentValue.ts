import type { ResistanceRateValueBehavior } from '@/domain/Antibiogram/Metadata/ResistanceRateValue/ResistanceRateValueBehavior';

class isLessThanOnePercent implements ResistanceRateValueBehavior {
  #value: string;
  constructor(value: string) {
    this.#value = value;
  }
  toString(): string {
    return this.#value;
  }
  getValue(): number | '<1%' {
    return '<1%';
  }
  isLessThanOnePercent(): boolean {
    return true;
  }
}

export default isLessThanOnePercent;
