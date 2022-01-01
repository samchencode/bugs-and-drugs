import SourceValue from '@/domain/Antibiogram/SampleInfo/Source/SourceValue';

class NonUrine extends SourceValue {
  toString() {
    return 'Non-Urine';
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default NonUrine;
