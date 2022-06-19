import type { ResistanceRateValueBehavior } from '@/domain/Antibiogram/Metadata/ResistanceRateValue/ResistanceRateValueBehavior';

class isLessThanOnePercent implements ResistanceRateValueBehavior {
  toString(): string {
    return '<1%';
  }

  isLessThanOnePercent(): boolean {
    return true;
  }
}

export default isLessThanOnePercent;
