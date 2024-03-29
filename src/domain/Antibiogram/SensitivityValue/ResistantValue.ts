import type { SensitivityValueBehavior } from '@/domain/Antibiogram/SensitivityValue/SensitivityValueBehavior';

class ResistantValue implements SensitivityValueBehavior {
  getValue(): 'R' {
    return 'R';
  }

  toString(): string {
    return 'R';
  }

  valueOf(): number {
    return NaN;
  }

  isResistant(): boolean {
    return true;
  }
}

export default ResistantValue;
