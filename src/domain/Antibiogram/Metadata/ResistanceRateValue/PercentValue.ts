import type { ResistanceRateValueBehavior } from '@/domain/Antibiogram/Metadata/ResistanceRateValue/ResistanceRateValueBehavior';

class PercentValue implements ResistanceRateValueBehavior {
  #value: number;
  constructor(value: number) {
    this.#value = value;
  }
  isLessThanOnePercent(): boolean {
    return false;
  }
  getValue(): number | '<1%' {
    return this.#value;
  }
  toString(): string {
    return '' + Math.round(this.#value) + '%';
  }
}
export default PercentValue;
