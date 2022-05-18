interface ResistanceRateValueBehavior {
  isLessThanOnePercent(): boolean;
  getValue(): number | '<1%';
  toString(): string;
}
export type { ResistanceRateValueBehavior };
